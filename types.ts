
export interface AuditRequest {
  projectName: string;
  projectDescription: string;
  category: string;
  files: File[];
  normFiles: File[];
}

export type AuditResponse = string;


export interface AuditDetail {
  norm: string;
  clause: string;
  status: 'MATCH' | 'VIOLATION';
  description: string;
}

export interface NormReference {
  id: string;
  name: string;
  description: string;
}

export interface PriorityTask {
  id: string;
  label: string;
  enabled: boolean;
  count: number;
}

export interface UserSubscription {
  email: string;
  subscriptionActive: boolean;
  expiryDate: Date; // In Firestore this would be a Timestamp
  lastPaymentDate: Date;
}

// Types for Volume Comparison Feature
export interface VolumeComparisonRow {
  itemName: string;
  unit: string;
  plannedQty: number;
  actualQty: number;
}

export interface VolumeSummary {
  totalPlannedCost: string;
  totalActualCost: string;
  percentComplete: number;
  keyDiscrepancies: string[];
}

export interface VolumeComparisonResponse {
  comparisonTable: VolumeComparisonRow[];
  summary: VolumeSummary;
}

// Type for Prompt Templates
export interface Template {
  id: string;
  title: string;
  prompt: string;
}

// Type for AI Chat
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
