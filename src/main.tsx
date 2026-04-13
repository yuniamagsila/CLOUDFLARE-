import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './index.css';
import { router } from './router';
import { useAuthStore } from './store/authStore';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

export function App() {
  const { restoreSession, isLoading } = useAuthStore();

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  return <RouterProvider router={router} />;
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
