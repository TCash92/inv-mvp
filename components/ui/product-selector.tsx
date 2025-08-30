'use client';

import { useState } from 'react';
import { cn } from '../../lib/utils';
import { StatusBadge } from './status-badge';
import { ActionButton } from './action-button';

export interface Product {
  id: number;
  name: string;
  un_number: string;
  description?: string;
  compatibility_group: string;
  explosive_type: string;
  unit: string;
  net_explosive_weight_per_unit_kg: number;
  manufacturer?: string;
}

export interface ProductSelectorProps {
  products: Product[];
  value?: Product | null;
  onChange?: (product: Product | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  showCompatibility?: boolean;
  filterCompatible?: boolean;
  magazineId?: number; // For compatibility filtering
}

export function ProductSelector({
  products,
  value,
  onChange,
  label,
  placeholder = "Select a product...",
  error,
  disabled = false,
  className,
  showCompatibility = true,
  filterCompatible = false,
  magazineId
}: ProductSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter products based on search term
  const filteredProducts = (Array.isArray(products) ? products : []).filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.un_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const handleSelect = (product: Product) => {
    onChange?.(product);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange?.(null);
    setSearchTerm('');
  };

  return (
    <div className={cn('relative space-y-2', className)}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Selected Product Display / Trigger Button */}
      <div
        className={cn(
          'w-full border-2 border-gray-300 rounded-lg bg-white cursor-pointer transition-colors min-h-[56px] flex items-center',
          isOpen && 'border-blue-500 ring-2 ring-blue-200',
          error && 'border-red-500',
          disabled && 'bg-gray-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {value ? (
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">{value.name}</div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <StatusBadge size="sm" variant="info">
                    {value.un_number}
                  </StatusBadge>
                  {showCompatibility && (
                    <StatusBadge size="sm" variant="compatibility" type={value.compatibility_group}>
                      Group {value.compatibility_group}
                    </StatusBadge>
                  )}
                  <span>{value.net_explosive_weight_per_unit_kg} kg/{value.unit}</span>
                </div>
              </div>
              {!disabled && (
                <ActionButton
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="ml-2 w-8 h-8 p-0"
                >
                  ×
                </ActionButton>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 text-gray-500 font-medium">
            {placeholder}
          </div>
        )}
        
        {/* Dropdown Arrow */}
        <div className="p-4">
          <svg 
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              isOpen && 'rotate-180'
            )} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[44px]"
              autoFocus
            />
          </div>

          {/* Product List */}
          <div className="overflow-y-auto max-h-64">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 min-h-[56px] flex items-center"
                  onClick={() => handleSelect(product)}
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 mb-1">{product.name}</div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <StatusBadge size="sm" variant="info">
                        {product.un_number}
                      </StatusBadge>
                      {showCompatibility && (
                        <StatusBadge size="sm" variant="compatibility" type={product.compatibility_group}>
                          Group {product.compatibility_group}
                        </StatusBadge>
                      )}
                      <span>{product.net_explosive_weight_per_unit_kg} kg/{product.unit}</span>
                    </div>
                    {product.manufacturer && (
                      <div className="text-xs text-gray-500 mt-1">{product.manufacturer}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No products found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 font-medium">{error}</p>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}