import { Outlet } from 'react-router-dom';
import Header from '@/components/header/Header';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-border-default bg-bg-surface py-4">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-text-muted">
          Meeting Intelligence Hub · 2026 Kookmin AI Workflow Team 4
        </div>
      </footer>
    </div>
  );
}
