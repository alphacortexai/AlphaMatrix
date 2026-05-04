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

export type ProductType = 'product' | 'service';

export interface Product {
  id: string;
  branchId: string;
  name: string;
  type: ProductType;
  category: string;
  description?: string;
  costPrice: number; // Buying price
  sellingPrice: number;
  quantity: number; // For products only
  lowStockAlert: number;
  supplier?: string;
  expiryDate?: Date;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  createProduct: (product: Omit<Product, 'id' | 'branchId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  getProductsByCategory: (category: string) => Product[];
  getLowStockProducts: () => Product[];
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const { currentBranch } = useBusiness();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load products when branch changes
  useEffect(() => {
    if (!currentBranch) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const loadProducts = async () => {
      try {
        setError(null);
        setLoading(true);

        const productsQuery = query(
          collection(db, 'products'),
          where('branchId', '==', currentBranch.id)
        );
        const productsSnap = await getDocs(productsQuery);
        const productsData = productsSnap.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          expiryDate: doc.data().expiryDate?.toDate?.(),
        })) as Product[];
        setProducts(productsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [currentBranch]);

  const createProduct = async (productData: Omit<Product, 'id' | 'branchId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentBranch) throw new Error('No branch selected');
    try {
      setError(null);
      const newProductRef = doc(collection(db, 'products'));
      const newProduct: Product = {
        id: newProductRef.id,
        branchId: currentBranch.id,
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(newProductRef, newProduct);
      setProducts([...products, newProduct]);
      return newProductRef.id;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      setError(errorMessage);
      throw err;
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      setError(null);
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: new Date(),
      });
      setProducts(
        products.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setError(null);
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
      setError(errorMessage);
      throw err;
    }
  };

  const getProductsByCategory = (category: string) => {
    return products.filter((p) => p.category === category);
  };

  const getLowStockProducts = () => {
    return products.filter((p) => p.type === 'product' && p.quantity <= p.lowStockAlert);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        error,
        createProduct,
        updateProduct,
        deleteProduct,
        getProductsByCategory,
        getLowStockProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
