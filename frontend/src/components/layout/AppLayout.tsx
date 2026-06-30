import { Outlet } from 'react-router-dom';
import Header from '@/components/header/Header';
import PageTransition from '@/components/layout/PageTransition';

export default function AppLayout() {
  return (
    <div className="mesh-bg flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <footer className="glass border-t border-glass-border py-4">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-text-muted">
          담록 Damrok · 2026 Kookmin AI Workflow Team 4
        </div>
      </footer>
    </div>
  );
}
