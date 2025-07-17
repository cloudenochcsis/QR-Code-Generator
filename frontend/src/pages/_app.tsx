import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  // Apply dark theme by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f9fafb',
            border: '1px solid #374151',
            borderRadius: '8px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#065f46',
              color: '#d1fae5',
              border: '1px solid #10b981',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#d1fae5',
            },
          },
          error: {
            duration: 5000,
            style: {
              background: '#7f1d1d',
              color: '#fecaca',
              border: '1px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fecaca',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default MyApp;
