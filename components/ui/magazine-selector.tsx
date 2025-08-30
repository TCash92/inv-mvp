'use client';

import { useState } from 'react';
import { cn, calculateCapacityPercentage, getCapacityColor, formatWeight } from '../../lib/utils';
import { ActionButton } from './action-button';

export interface Magazine {
  id: number;
  code: string;
  name: string;
  location: string;
  max_net_explosive_weight_kg: number;
  notes?: string;
  // For capacity display - these would come from a separate query
  current_net_weight_kg?: number;
  current_capacity_percentage?: number;
}

export interface MagazineSelectorProps {
  magazines: Magazine[];
  value?: Magazine | null;
  onChange?: (magazine: Magazine | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  showCapacity?: boolean;
  filterBy?: 'available' | 'hasSpace' | 'all';
}

export function MagazineSelector({
  magazines,
  value,
  onChange,
  label,
  placeholder = "Select a magazine...",
  error,
  disabled = false,
  className,
  showCapacity = true,
  filterBy = 'all'
}: MagazineSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter magazines based on search term and filter criteria - handle undefined/null magazines
  const safeMagazines = Array.isArray(magazines) ? magazines : [];
  const filteredMagazines = safeMagazines
    .filter(magazine => {
      const matchesSearch = 
        magazine.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        magazine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        magazine.location.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      if (filterBy === 'hasSpace') {
        return (magazine.current_capacity_percentage || 0) < 95;
      }
      
      return true;
    });

  const handleSelect = (magazine: Magazine) => {
    onChange?.(magazine);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange?.(null);
    setSearchTerm('');
  };

  const getCapacityInfo = (magazine: Magazine) => {
    const current = magazine.current_net_weight_kg || 0;
    const max = magazine.max_net_explosive_weight_kg;
    const percentage = calculateCapacityPercentage(current, max);
    const color = getCapacityColor(percentage);
    
    return { current, max, percentage, color };
  };

  return (
    <div className={cn('relative space-y-2', className)}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Selected Magazine Display / Trigger Button */}
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
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-gray-900">{value.code}</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-700">{value.name}</span>
                </div>
                <div className="text-sm text-gray-600 mb-1">{value.location}</div>
                {showCapacity && (
                  <div className="flex items-center space-x-2 text-xs">
                    {(() => {
                      const capacity = getCapacityInfo(value);
                      return (
                        <>
                          <span className={cn('font-medium', capacity.color)}>
                            {capacity.percentage}% capacity
                          </span>
                          <span className="text-gray-500">
                            ({formatWeight(capacity.current)} / {formatWeight(capacity.max)})
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}
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
              placeholder="Search magazines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[44px]"
              autoFocus
            />
          </div>

          {/* Magazine List */}
          <div className="overflow-y-auto max-h-64">
            {filteredMagazines.length > 0 ? (
              filteredMagazines.map((magazine) => (
                <div
                  key={magazine.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 min-h-[56px] flex items-center"
                  onClick={() => handleSelect(magazine)}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-gray-900">{magazine.code}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-700">{magazine.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">{magazine.location}</div>
                    {showCapacity && (
                      <div className="flex items-center space-x-2 text-xs">
                        {(() => {
                          const capacity = getCapacityInfo(magazine);
                          return (
                            <>
                              <span className={cn('font-medium', capacity.color)}>
                                {capacity.percentage}% capacity
                              </span>
                              <span className="text-gray-500">
                                ({formatWeight(capacity.current)} / {formatWeight(capacity.max)})
                              </span>
                              {capacity.percentage >= 90 && (
                                <span className="text-red-600 font-bold">⚠ Near Full</span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                    {magazine.notes && (
                      <div className="text-xs text-gray-500 mt-1">{magazine.notes}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                No magazines found matching "{searchTerm}"
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