'use client';

import { useState } from 'react';
import { ResponsePlan } from '../ui/response-plans-dropdown';

const planTypes = [
  {
    type: 'fire' as const,
    label: 'Fire Safety Plan',
    icon: '🔥',
    description: 'Fire emergency procedures'
  },
  {
    type: 'security' as const,
    label: 'Security Plan',
    icon: '🔒',
    description: 'Security protocols'
  },
  {
    type: 'erap' as const,
    label: 'ERAP',
    icon: '🚨',
    description: 'Emergency Response Plan'
  }
];

export function ResponsePlansMobile() {
  const [showPlans, setShowPlans] = useState(false);
  const [plans] = useState<ResponsePlan[]>([]); // Mock empty plans for now

  const handlePlanClick = (planType: string) => {
    const plan = (plans || []).find(p => p.plan_type === planType && p.is_active);
    
    if (plan) {
      window.open(`/response-plans/${plan.file_name}`, '_blank');
      setShowPlans(false);
    } else {
      const planName = planTypes.find(p => p.type === planType)?.label;
      alert(`${planName} is not currently available. Please contact your administrator.`);
    }
  };

  if (showPlans) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">Emergency Plans</h3>
          <button
            onClick={() => setShowPlans(false)}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-2">
          {planTypes.map((planType) => {
            const plan = (plans || []).find(p => p.plan_type === planType.type && p.is_active);
            const isAvailable = !!plan;
            
            return (
              <button
                key={planType.type}
                onClick={() => handlePlanClick(planType.type)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-colors min-h-[72px] ${
                  isAvailable 
                    ? "border-green-200 bg-green-50 hover:bg-green-100"
                    : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl flex-shrink-0">
                    {planType.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-base text-gray-900">
                        {planType.label}
                      </h4>
                      {isAvailable ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          Not Available
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {planType.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            For plan updates, contact your site administrator
          </p>
        </div>
      </div>
    );
  }

  return (
    <button 
      onClick={() => setShowPlans(true)}
      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-semibold text-base min-h-[56px] transition-colors flex items-center justify-center gap-2"
    >
      <span className="text-lg">📋</span>
      <span>Response Plans</span>
    </button>
  );
}