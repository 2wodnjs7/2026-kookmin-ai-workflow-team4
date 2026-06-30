import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

export default function Card({ title, description, children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border-default bg-bg-surface p-6 shadow-sm ${className}`}
      style={{ boxShadow: `0 1px 3px var(--color-shadow)` }}
    >
      {(title || description) && (
        <div className="mb-4 flex flex-col gap-1">
          {title && (
            <div className="text-lg font-semibold text-text-primary">{title}</div>
          )}
          {description && (
            <div className="text-sm text-text-secondary">{description}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
