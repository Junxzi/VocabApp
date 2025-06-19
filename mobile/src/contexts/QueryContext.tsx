import React, {createContext, useContext} from 'react';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const QueryContext = createContext<QueryClient | undefined>(undefined);

export function QueryProvider({children}: {children: React.ReactNode}) {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryContext.Provider value={queryClient}>
        {children}
      </QueryContext.Provider>
    </QueryClientProvider>
  );
}

export function useQueryClient() {
  const context = useContext(QueryContext);
  if (!context) {
    throw new Error('useQueryClient must be used within a QueryProvider');
  }
  return context;
}