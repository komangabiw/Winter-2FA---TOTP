import React from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { Dashboard } from './components/Dashboard';

const MainApp: React.FC = () => {
  const { isLoading } = useVault();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <Dashboard />;
};

export const App: React.FC = () => {
  return (
    <VaultProvider>
      <MainApp />
    </VaultProvider>
  );
};
