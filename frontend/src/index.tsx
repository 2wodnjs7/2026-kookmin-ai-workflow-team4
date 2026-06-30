import { useAuthStore } from '@/stores/authStore';
import AppRouter from '@/routes/routes';
import { useThemeStore } from '@/stores/themeStore';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function Bootstrap() {
  const refresh = useAuthStore((s) => s.refresh);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return <AppRouter />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Bootstrap />
  </StrictMode>,
);
