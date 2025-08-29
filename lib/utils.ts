import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display in industrial contexts
export function formatDate(date: number | Date | string, options?: {
  includeTime?: boolean;
  format?: 'short' | 'long';
}) {
  const dateObj = typeof date === 'number' ? new Date(date) : new Date(date);
  const { includeTime = false, format = 'short' } = options || {};
  
  if (format === 'short') {
    const dateStr = dateObj.toLocaleDateString('en-US', {
      year: '2-digit',
      month: 'numeric',
      day: 'numeric'
    });
    
    if (includeTime) {
      const timeStr = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false
      });
      return `${dateStr} ${timeStr}`;
    }
    
    return dateStr;
  }
  
  const dateStr = dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  if (includeTime) {
    const timeStr = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    });
    return `${dateStr} at ${timeStr}`;
  }
  
  return dateStr;
}

// Format weight for display
export function formatWeight(weightKg: number, precision: number = 2) {
  return `${weightKg.toFixed(precision)} kg`;
}

// Format quantities with units
export function formatQuantity(quantity: number, unit: string) {
  const displayUnit = unit === 'each' ? (quantity === 1 ? 'unit' : 'units') : unit;
  return `${quantity} ${displayUnit}`;
}

// Validate UN Number format
export function isValidUNNumber(unNumber: string): boolean {
  return /^UN \d{4}$/.test(unNumber);
}

// Get compatibility group color for display
export function getCompatibilityGroupColor(group: string): string {
  const colors: Record<string, string> = {
    'A': 'bg-red-100 text-red-800',      // Extremely dangerous
    'B': 'bg-orange-100 text-orange-800', // Very dangerous  
    'C': 'bg-yellow-100 text-yellow-800', // Dangerous
    'D': 'bg-yellow-100 text-yellow-800', // Dangerous
    'E': 'bg-yellow-100 text-yellow-800', // Dangerous
    'F': 'bg-purple-100 text-purple-800', // Special handling
    'G': 'bg-blue-100 text-blue-800',     // Moderate risk
    'H': 'bg-blue-100 text-blue-800',     // Moderate risk
    'J': 'bg-blue-100 text-blue-800',     // Moderate risk
    'K': 'bg-blue-100 text-blue-800',     // Moderate risk
    'L': 'bg-blue-100 text-blue-800',     // Moderate risk
    'N': 'bg-green-100 text-green-800',   // Lower risk
    'S': 'bg-gray-100 text-gray-800',     // Special/safe
  };
  return colors[group] || 'bg-gray-100 text-gray-800';
}

// Get transaction type color for display
export function getTransactionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'Receipt': 'bg-green-100 text-green-800',
    'Issue': 'bg-blue-100 text-blue-800', 
    'TransferIn': 'bg-purple-100 text-purple-800',
    'TransferOut': 'bg-purple-100 text-purple-800',
    'AdjustIncrease': 'bg-teal-100 text-teal-800',
    'AdjustDecrease': 'bg-orange-100 text-orange-800',
    'Destruction': 'bg-red-100 text-red-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

// Generate reference numbers
export function generateReferenceNumber(type: string): string {
  const timestamp = Date.now().toString().slice(-6);
  const typePrefix: Record<string, string> = {
    'Receipt': 'REC',
    'Issue': 'ISS',
    'Transfer': 'TRF',
    'Adjustment': 'ADJ',
    'Destruction': 'DES',
    'Reconciliation': 'REC',
  };
  
  const prefix = typePrefix[type] || 'TXN';
  return `${prefix}-${timestamp}`;
}

// Calculate capacity percentage
export function calculateCapacityPercentage(current: number, max: number): number {
  if (max === 0) return 0;
  return Math.round((current / max) * 100);
}

// Get capacity color based on percentage
export function getCapacityColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 75) return 'text-orange-600';
  if (percentage >= 50) return 'text-yellow-600';
  return 'text-green-600';
}