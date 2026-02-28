/**
 * Innertia Application
 * Multi-tenant SaaS Platform with Hierarchical Roles
 */

import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProviderWithManager } from './components/ui/Toast';
import { AppRouter } from './app/router';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProviderWithManager>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </ToastProviderWithManager>
    </QueryClientProvider>
  );
}

export default App;
