'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface ResponsePlan {
  id: number;
  plan_type: 'fire' | 'security' | 'erap';
  file_name: string;
  file_path: string;
  file_size: number;
  uploaded_at: number;
  version: number;
  is_active: boolean;
}

interface ResponsePlansDropdownProps {
  plans?: ResponsePlan[];
  isLoading?: boolean;
  onPlanSelect?: (planType: string, plan: ResponsePlan | null) => void;
  className?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
}

const planTypes = [
  {
    type: 'fire' as const,
    label: 'Fire Safety Plan',
    icon: '🔥',
    description: 'Fire emergency procedures and evacuation routes'
  },
  {
    type: 'security' as const,
    label: 'Security Plan',
    icon: '🔒',
    description: 'Security protocols and threat response procedures'
  },
  {
    type: 'erap' as const,
    label: 'ERAP',
    icon: '🚨',
    description: 'Emergency Response Assistance Plan'
  }
];

export function ResponsePlansDropdown({
  plans = [],
  isLoading = false,
  onPlanSelect,
  className,
  buttonSize = 'md'
}: ResponsePlansDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handlePlanClick = (planType: string) => {
    const plan = plans.find(p => p.plan_type === planType && p.is_active);
    
    if (plan) {
      // Open the PDF file
      window.open(`/response-plans/${plan.file_name}`, '_blank');
    } else {
      // No plan available, show notification
      alert(`${planTypes.find(p => p.type === planType)?.label} is not currently available. Please contact your administrator.`);
    }
    
    onPlanSelect?.(planType, plan || null);
    setIsOpen(false);
  };

  const getButtonSizeClasses = () => {
    switch (buttonSize) {
      case 'sm':
        return 'px-3 py-2 text-sm min-h-[40px]';
      case 'lg':
        return 'px-4 py-3 text-base min-h-[56px]';
      default:
        return 'px-3 py-2 text-sm min-h-[44px]';
    }
  };

  return (
    <div ref={dropdownRef} className={cn("relative inline-block", className)}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-50",
          getButtonSizeClasses(),
          isOpen && "bg-orange-700"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        type="button"
      >
        <span className="text-lg">📋</span>
        <span className="hidden sm:inline">Response Plans</span>
        <svg
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Emergency Response Plans
            </h3>
            
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {planTypes.map((planType) => {
                  const plan = plans.find(p => p.plan_type === planType.type && p.is_active);
                  const isAvailable = !!plan;
                  
                  return (
                    <button
                      key={planType.type}
                      onClick={() => handlePlanClick(planType.type)}
                      className={cn(
                        "w-full p-3 text-left rounded-lg border-2 transition-colors min-h-[64px]",
                        isAvailable 
                          ? "border-green-200 bg-green-50 hover:bg-green-100 text-green-900"
                          : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl flex-shrink-0 mt-1">
                          {planType.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-sm">
                              {planType.label}
                            </h4>
                            {isAvailable ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                Available
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                Not Available
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {planType.description}
                          </p>
                          {isAvailable && plan && (
                            <p className="text-xs text-gray-500 mt-1">
                              Updated: {new Date(plan.uploaded_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-600 text-center">
              For plan updates, contact your site administrator
            </p>
          </div>
        </div>
      )}
    </div>
  );
}