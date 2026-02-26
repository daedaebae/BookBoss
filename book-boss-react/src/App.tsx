import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Library } from './pages/Library';
import { Features } from './pages/Features';
import { Login } from './pages/Login';

import { soundService } from './services/soundService';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  import('react').then((React) => {
    React.useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button, a, [role="button"], input[type="submit"], input[type="button"], select, .sidebar-item');
        if (isInteractive) {
          soundService.playPop();
        }
      };
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }, []);
  });

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout>
      {window.location.pathname === '/features' ? <Features /> : <Library />}
    </Layout>
  );
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

export default App;
