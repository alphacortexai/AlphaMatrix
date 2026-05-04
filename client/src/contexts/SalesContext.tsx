import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import { useBusiness } from './BusinessContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'credit';

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  branchId: string;
  staffId: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  totalDiscount: number;
  tax: number;
  total: number;
  profit: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SalesContextType {
  sales: Sale[];
  loading: boolean;
  error: string | null;
  createSale: (sale: Omit<Sale, 'id' | 'branchId' | 'staffId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  getSalesByDateRange: (startDate: Date, endDate: Date) => Sale[];
  getTotalSales: (startDate?: Date, endDate?: Date) => number;
  getTotalProfit: (startDate?: Date, endDate?: Date) => number;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentBranch } = useBusiness();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load sales when branch changes
  useEffect(() => {
    if (!currentBranch) {
      setSales([]);
      setLoading(false);
      return;
    }

    const loadSales = async () => {
      try {
        setError(null);
        setLoading(true);

        const salesQuery = query(
          collection(db, 'sales'),
          where('branchId', '==', currentBranch.id)
        );
        const salesSnap = await getDocs(salesQuery);
        const salesData = salesSnap.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        })) as Sale[];
        setSales(salesData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load sales';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, [currentBranch]);

  const createSale = async (saleData: Omit<Sale, 'id' | 'branchId' | 'staffId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentBranch || !user) throw new Error('No branch or user selected');
    try {
      setError(null);
      const newSaleRef = doc(collection(db, 'sales'));
      const newSale: Sale = {
        id: newSaleRef.id,
        branchId: currentBranch.id,
        staffId: user.uid,
        ...saleData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(newSaleRef, newSale);
      setSales([...sales, newSale]);
      return newSaleRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create sale';
      setError(errorMessage);
      throw err;
    }
  };

  const getSalesByDateRange = (startDate: Date, endDate: Date) => {
    return sales.filter(
      (s) => s.createdAt >= startDate && s.createdAt <= endDate
    );
  };

  const getTotalSales = (startDate?: Date, endDate?: Date) => {
    let filteredSales = sales;
    if (startDate && endDate) {
      filteredSales = getSalesByDateRange(startDate, endDate);
    }
    return filteredSales.reduce((sum, s) => sum + s.total, 0);
  };

  const getTotalProfit = (startDate?: Date, endDate?: Date) => {
    let filteredSales = sales;
    if (startDate && endDate) {
      filteredSales = getSalesByDateRange(startDate, endDate);
    }
    return filteredSales.reduce((sum, s) => sum + s.profit, 0);
  };

  return (
    <SalesContext.Provider
      value={{
        sales,
        loading,
        error,
        createSale,
        getSalesByDateRange,
        getTotalSales,
        getTotalProfit,
      }}
    >
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (context === undefined) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}
