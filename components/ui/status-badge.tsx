'use client';

import { cn } from '../../lib/utils';
import { getCompatibilityGroupColor, getTransactionTypeColor } from '../../lib/utils';

export interface StatusBadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'compatibility' | 'transaction';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  type?: string; // For compatibility group or transaction type
}

export function StatusBadge({ 
  variant = 'default', 
  size = 'md', 
  children, 
  className,
  type
}: StatusBadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-lg';
  
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs min-h-[24px]',
    md: 'px-3 py-1.5 text-sm min-h-[32px]', 
    lg: 'px-4 py-2 text-base min-h-[40px]',
  };

  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    compatibility: type ? getCompatibilityGroupColor(type) : 'bg-gray-100 text-gray-800',
    transaction: type ? getTransactionTypeColor(type) : 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}