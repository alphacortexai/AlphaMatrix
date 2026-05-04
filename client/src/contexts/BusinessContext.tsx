import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthContext';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  location: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  type: 'shop' | 'stationery' | 'service' | 'other';
  createdAt: Date;
  updatedAt: Date;
}

interface BusinessContextType {
  business: Business | null;
  branches: Branch[];
  currentBranch: Branch | null;
  loading: boolean;
  error: string | null;
  createBusiness: (business: Omit<Business, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBusiness: (id: string, updates: Partial<Business>) => Promise<void>;
  createBranch: (branch: Omit<Branch, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateBranch: (id: string, updates: Partial<Branch>) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  setCurrentBranch: (branch: Branch) => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load business and branches when user profile is available
  useEffect(() => {
    if (!user || !userProfile) {
      setLoading(false);
      return;
    }

    const loadBusinessData = async () => {
      try {
        setError(null);
        setLoading(true);

        // Fetch user's business
        if (userProfile.businessId) {
          const businessDocRef = doc(db, 'businesses', userProfile.businessId);
          const businessDocSnap = await getDocs(
            query(collection(db, 'businesses'), where('id', '==', userProfile.businessId))
          );

          if (!businessDocSnap.empty) {
            const businessData = businessDocSnap.docs[0].data() as Business;
            setBusiness(businessData);

            // Fetch branches for this business
            const branchesQuery = query(
              collection(db, 'branches'),
              where('businessId', '==', userProfile.businessId)
            );
            const branchesSnap = await getDocs(branchesQuery);
            const branchesData = branchesSnap.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            })) as Branch[];
            setBranches(branchesData);

            // Set current branch
            if (userProfile.branchId) {
              const currentBranchData = branchesData.find((b) => b.id === userProfile.branchId);
              if (currentBranchData) {
                setCurrentBranch(currentBranchData);
              }
            } else if (branchesData.length > 0) {
              setCurrentBranch(branchesData[0]);
            }
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load business data';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadBusinessData();
  }, [user, userProfile]);

  const createBusiness = async (businessData: Omit<Business, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('No user logged in');
    try {
      setError(null);
      const newBusinessRef = doc(collection(db, 'businesses'));
      const newBusiness: Business = {
        id: newBusinessRef.id,
        ownerId: user.uid,
        ...businessData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(newBusinessRef, newBusiness);
      setBusiness(newBusiness);
      return newBusinessRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create business';
      setError(errorMessage);
      throw err;
    }
  };

  const updateBusiness = async (id: string, updates: Partial<Business>) => {
    try {
      setError(null);
      const businessRef = doc(db, 'businesses', id);
      await updateDoc(businessRef, {
        ...updates,
        updatedAt: new Date(),
      });
      if (business?.id === id) {
        setBusiness({ ...business, ...updates, updatedAt: new Date() });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update business';
      setError(errorMessage);
      throw err;
    }
  };

  const createBranch = async (branchData: Omit<Branch, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>) => {
    if (!business) throw new Error('No business selected');
    try {
      setError(null);
      const newBranchRef = doc(collection(db, 'branches'));
      const newBranch: Branch = {
        id: newBranchRef.id,
        businessId: business.id,
        ...branchData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(newBranchRef, newBranch);
      setBranches([...branches, newBranch]);
      return newBranchRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create branch';
      setError(errorMessage);
      throw err;
    }
  };

  const updateBranch = async (id: string, updates: Partial<Branch>) => {
    try {
      setError(null);
      const branchRef = doc(db, 'branches', id);
      await updateDoc(branchRef, {
        ...updates,
        updatedAt: new Date(),
      });
      setBranches(
        branches.map((b) =>
          b.id === id ? { ...b, ...updates, updatedAt: new Date() } : b
        )
      );
      if (currentBranch?.id === id) {
        setCurrentBranch({ ...currentBranch, ...updates, updatedAt: new Date() });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update branch';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      setError(null);
      const branchRef = doc(db, 'branches', id);
      await deleteDoc(branchRef);
      setBranches(branches.filter((b) => b.id !== id));
      if (currentBranch?.id === id) {
        setCurrentBranch(branches.length > 0 ? branches[0] : null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete branch';
      setError(errorMessage);
      throw err;
    }
  };

  return (
    <BusinessContext.Provider
      value={{
        business,
        branches,
        currentBranch,
        loading,
        error,
        createBusiness,
        updateBusiness,
        createBranch,
        updateBranch,
        deleteBranch,
        setCurrentBranch,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
