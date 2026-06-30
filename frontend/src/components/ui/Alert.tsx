import type { ReactNode } from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-primary-subtle border-primary/20 text-text-primary',
  success: 'bg-success-bg border-success/20 text-text-primary',
  warning: 'bg-warning-bg border-warning/20 text-text-primary',
  error: 'bg-error-bg border-error/20 text-text-primary',
};

export default function Alert({ variant = 'info', title, children }: AlertProps) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 text-sm ${variantClasses[variant]}`}
      role="alert"
    >
      {title && <div className="mb-1 font-medium">{title}</div>}
      <div>{children}</div>
    </div>
  );
}
