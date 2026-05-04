import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { useBusiness } from './BusinessContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

export type ExpenseCategory = 'rent' | 'salary' | 'transport' | 'utilities' | 'internet' | 'stock' | 'repairs' | 'other';

export interface Expense {
  id: string;
  branchId?: string; // Optional - if null, it's for the whole business
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod?: string;
  reference?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ExpensesContextType {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  createExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getExpensesByCategory: (category: ExpenseCategory) => Expense[];
  getTotalExpenses: (startDate?: Date, endDate?: Date) => number;
}

const ExpensesContext = createContext<ExpensesContextType | undefined>(undefined);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const { currentBranch, business } = useBusiness();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load expenses when branch changes
  useEffect(() => {
    if (!currentBranch && !business) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const loadExpenses = async () => {
      try {
        setError(null);
        setLoading(true);

        let expensesData: Expense[] = [];

        // Load branch-specific expenses
        if (currentBranch) {
          const branchExpensesQuery = query(
            collection(db, 'expenses'),
            where('branchId', '==', currentBranch.id)
          );
          const branchExpensesSnap = await getDocs(branchExpensesQuery);
          const branchExpenses = branchExpensesSnap.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          })) as Expense[];
          expensesData = [...expensesData, ...branchExpenses];
        }

        // Load business-wide expenses
        if (business) {
          const businessExpensesQuery = query(
            collection(db, 'expenses'),
            where('branchId', '==', null)
          );
          const businessExpensesSnap = await getDocs(businessExpensesQuery);
          const businessExpenses = businessExpensesSnap.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          })) as Expense[];
          expensesData = [...expensesData, ...businessExpenses];
        }

        setExpenses(expensesData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load expenses';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, [currentBranch, business]);

  const createExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const newExpenseRef = doc(collection(db, 'expenses'));
      const newExpense: Expense = {
        id: newExpenseRef.id,
        ...expenseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(newExpenseRef, newExpense);
      setExpenses([...expenses, newExpense]);
      return newExpenseRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create expense';
      setError(errorMessage);
      throw err;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      setError(null);
      const expenseRef = doc(db, 'expenses', id);
      await updateDoc(expenseRef, {
        ...updates,
        updatedAt: new Date(),
      });
      setExpenses(
        expenses.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update expense';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      setError(null);
      const expenseRef = doc(db, 'expenses', id);
      await deleteDoc(expenseRef);
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete expense';
      setError(errorMessage);
      throw err;
    }
  };

  const getExpensesByCategory = (category: ExpenseCategory) => {
    return expenses.filter((e) => e.category === category);
  };

  const getTotalExpenses = (startDate?: Date, endDate?: Date) => {
    let filteredExpenses = expenses;
    if (startDate && endDate) {
      filteredExpenses = expenses.filter(
        (e) => e.createdAt >= startDate && e.createdAt <= endDate
      );
    }
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  };

  return (
    <ExpensesContext.Provider
      value={{
        expenses,
        loading,
        error,
        createExpense,
        updateExpense,
        deleteExpense,
        getExpensesByCategory,
        getTotalExpenses,
      }}
    >
      {children}
    </ExpensesContext.Provider>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (context === undefined) {
    throw new Error('useExpenses must be used within an ExpensesProvider');
  }
  return context;
}
