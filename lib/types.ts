export interface Magazine {
  id: number;
  code: string;
  name: string;
  location: string;
  maxNetExplosiveWeightKg: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  unNumber: string;
  description?: string;
  compatibilityGroup: string;
  explosiveType?: string;
  unit: string;
  netExplosiveWeightPerUnitKg?: number;
  manufacturer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeProfile {
  id: number;
  userId: string;
  approvalId?: string;
  approvalExpiresAt?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 
  | 'Receipt'
  | 'Issue'
  | 'TransferOut'
  | 'TransferIn'
  | 'AdjustIncrease'
  | 'AdjustDecrease'
  | 'Destruction';

export interface InventoryTransaction {
  id: number;
  transactionDate: number;
  type: TransactionType;
  magazineFromId?: number;
  magazineToId?: number;
  productId: number;
  quantity: number;
  referenceNumber?: string;
  authorizationNumber?: string;
  notes?: string;
  enteredByUserId: string;
  attachments?: string[];
  createdAt: string;
}

export interface InventoryReconciliation {
  id: number;
  reconciliationDate: number;
  magazineId: number;
  productId: number;
  physicalCount: number;
  systemCountAtTime: number;
  variance: number;
  varianceReason?: string;
  enteredByUserId: string;
  attachments?: string[];
  resolved: boolean;
  resolvedByUserId?: string;
  resolutionNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: number;
  timestamp: number;
  actorUserId: string;
  action: string;
  entity: string;
  entityId?: number;
  details?: Record<string, any>;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentStock {
  magazineId: number;
  magazineName: string;
  magazineCode: string;
  productId: number;
  productName: string;
  unNumber: string;
  compatibilityGroup: string;
  unit: string;
  currentQuantity: number;
  netExplosiveWeight: number;
}

export interface TransactionSummary extends InventoryTransaction {
  magazineFromName?: string;
  magazineFromCode?: string;
  magazineToName?: string;
  magazineToCode?: string;
  productName: string;
  unNumber: string;
  enteredByName: string;
}