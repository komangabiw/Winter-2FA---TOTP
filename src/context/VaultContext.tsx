import React, { createContext, useContext, useState, useEffect } from 'react';
import { VaultData, OtpAccount } from '../types';
import { loadPlainVault, savePlainVault, clearPlainVault } from '../services/storage';

interface VaultContextType {
  data: VaultData;
  isLoading: boolean;
  addAccount: (account: Omit<OtpAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const DEFAULT_VAULT: VaultData = {
  accounts: [],
  lastModified: Date.now(),
};

const VaultContext = createContext<VaultContextType | null>(null);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<VaultData>(DEFAULT_VAULT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const stored = await loadPlainVault();
      if (stored) {
        setData(stored);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const persist = async (updated: VaultData) => {
    setData(updated);
    await savePlainVault(updated);
  };

  const addAccount = async (account: Omit<OtpAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    const norm = account.secret.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
    const isDuplicate = data.accounts.some(
      (a) => a.secret.toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '') === norm
    );

    if (isDuplicate) {
      throw new Error('Akun 2FA dengan secret key ini sudah ada di daftar!');
    }

    const newAcc: OtpAccount = {
      ...account,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = {
      ...data,
      accounts: [newAcc, ...data.accounts],
      lastModified: Date.now(),
    };
    await persist(updated);
    return true;
  };

  const deleteAccount = async (id: string) => {
    const filtered = data.accounts.filter((acc) => acc.id !== id);
    await persist({
      ...data,
      accounts: filtered,
      lastModified: Date.now(),
    });
  };

  const clearAll = async () => {
    await clearPlainVault();
    setData(DEFAULT_VAULT);
  };

  return (
    <VaultContext.Provider
      value={{
        data,
        isLoading,
        addAccount,
        deleteAccount,
        clearAll,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
};
