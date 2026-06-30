import { useThemeStore } from '@/stores/themeStore';

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14.5A8.5 8.5 0 1 1 9.5 3a6.5 6.5 0 0 0 11.5 11.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      onClick={toggleTheme}
      className="theme-switch"
    >
      <div className={`theme-switch-track ${isDark ? 'theme-switch-track-dark' : ''}`}>
        <div className="theme-switch-icon theme-switch-icon-light">
          <SunIcon />
        </div>
        <div className="theme-switch-icon theme-switch-icon-dark">
          <MoonIcon />
        </div>
        <div className={`theme-switch-thumb ${isDark ? 'theme-switch-thumb-dark' : ''}`} />
      </div>
    </button>
  );
}
