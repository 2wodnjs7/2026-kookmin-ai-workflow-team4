import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

const PAGE_ANIMATION: Record<string, string> = {
  '/': 'page-enter-fade-up',
  '/meetings/create': 'page-enter-slide-right',
  '/actions': 'page-enter-fade-up',
  '/search': 'page-enter-slide-left',
};

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const { pathname } = useLocation();
  const animation = PAGE_ANIMATION[pathname] ?? 'page-enter-fade-up';

  return (
    <div key={pathname} className={animation}>
      {children}
    </div>
  );
}
