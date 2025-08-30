'use client';

import { useState, useEffect } from 'react';
import { ResponsePlansDropdown, ResponsePlan } from '../ui/response-plans-dropdown';

export function ResponsePlansHeader() {
  const [plans, setPlans] = useState<ResponsePlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // For now, use empty plans array to test the UI
  // We'll add tRPC integration after we verify the basic functionality works
  useEffect(() => {
    setPlans([]);
    setIsLoading(false);
  }, []);

  const handlePlanSelect = (planType: string, plan: ResponsePlan | null) => {
    console.log('Plan selected:', planType, plan);
    // Could add analytics tracking here
  };

  return (
    <ResponsePlansDropdown
      plans={plans}
      isLoading={isLoading}
      onPlanSelect={handlePlanSelect}
      className="hidden sm:block"
      buttonSize="md"
    />
  );
}