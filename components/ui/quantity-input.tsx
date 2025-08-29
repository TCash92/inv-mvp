'use client';

import { cn } from '../../lib/utils';
import { useState, useEffect, forwardRef } from 'react';
import { ActionButton } from './action-button';

export interface QuantityInputProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  showButtons?: boolean;
  size?: 'md' | 'lg' | 'xl';
}

const QuantityInput = forwardRef<HTMLInputElement, QuantityInputProps>(({
  value = 0,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
  label,
  placeholder,
  error,
  disabled = false,
  className,
  showButtons = true,
  size = 'lg',
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState<string>(value.toString());

  useEffect(() => {
    setInternalValue(value.toString());
  }, [value]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInternalValue(newValue);
    
    const numericValue = parseFloat(newValue);
    if (!isNaN(numericValue) && onChange) {
      onChange(Math.max(min, max ? Math.min(max, numericValue) : numericValue));
    }
  };

  const handleIncrement = () => {
    const newValue = value + step;
    const constrainedValue = max ? Math.min(max, newValue) : newValue;
    if (onChange) {
      onChange(constrainedValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    const constrainedValue = Math.max(min, newValue);
    if (onChange) {
      onChange(constrainedValue);
    }
  };

  const sizeStyles = {
    md: 'text-base px-4 py-3 min-h-[48px]',
    lg: 'text-lg px-6 py-4 min-h-[56px]',
    xl: 'text-xl px-8 py-5 min-h-[64px]',
  };

  const buttonSize = size === 'xl' ? 'lg' : size === 'lg' ? 'md' : 'sm';

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
          {unit && <span className="text-gray-500 ml-1">({unit})</span>}
        </label>
      )}
      
      <div className="flex items-center space-x-2">
        {showButtons && (
          <ActionButton
            variant="outline"
            size={buttonSize}
            onClick={handleDecrement}
            disabled={disabled || value <= min}
            type="button"
            className="flex-shrink-0 w-12 h-12 p-0"
          >
            <span className="text-xl font-bold">−</span>
          </ActionButton>
        )}
        
        <div className="flex-1 relative">
          <input
            ref={ref}
            type="number"
            value={internalValue}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 disabled:cursor-not-allowed text-center font-semibold transition-colors',
              sizeStyles[size],
              error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
              showButtons && 'text-center'
            )}
            {...props}
          />
          {unit && !showButtons && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium pointer-events-none">
              {unit}
            </span>
          )}
        </div>
        
        {showButtons && (
          <ActionButton
            variant="outline"
            size={buttonSize}
            onClick={handleIncrement}
            disabled={disabled || (max !== undefined && value >= max)}
            type="button"
            className="flex-shrink-0 w-12 h-12 p-0"
          >
            <span className="text-xl font-bold">+</span>
          </ActionButton>
        )}
      </div>
      
      {unit && showButtons && (
        <div className="text-center">
          <span className="text-sm text-gray-600 font-medium">{unit}</span>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
});

QuantityInput.displayName = 'QuantityInput';

export { QuantityInput };