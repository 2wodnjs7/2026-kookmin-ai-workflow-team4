import { NavLink } from 'react-router-dom';
import { useThemeStore } from '@/stores/themeStore';
import Button from '@/components/ui/Button';

const navItems = [
  { to: '/', label: '소개', end: true },
  { to: '/meetings/create', label: '회의록 생성', end: false },
  { to: '/actions', label: '액션 트래커', end: false },
  { to: '/search', label: '회의 검색', end: false },
];

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="glass sticky top-0 z-50 border-b border-glass-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-4">
        <NavLink to="/" className="flex items-center gap-2 no-underline">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/90 shadow-md">
            <img src="/damrok-mark.svg" alt="담록 아이콘" className="h-7 w-7 object-contain" />
          </div>
          <div className="text-base font-semibold text-nav-text">담록</div>
        </NavLink>

        <nav className="flex flex-1 items-center justify-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors ${
                  isActive
                    ? 'bg-primary/15 text-nav-active backdrop-blur-sm'
                    : 'text-text-secondary hover:bg-glass-bg hover:text-nav-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Button variant="ghost" size="sm" onClick={toggleTheme} aria-label="테마 전환">
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>
      </div>
    </header>
  );
}
