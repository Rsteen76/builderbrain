export type LineItemCategory = 'Material' | 'Labor' | 'Subcontractor' | 'Equipment' | 'Permit' | 'Other';
export type BidStatus = 'Submitted' | 'Accepted' | 'Rejected' | 'Pending' | 'Needs Revision';

export interface LineItem {
  id: string; // Unique ID for the line item
  description: string;
  category: LineItemCategory;
  quantity: number;
  unit: string; // e.g., sq ft, linear ft, hour, lump sum, each
  unitCost: number; // Estimated unit cost
  totalCost: number; // Calculated: quantity * unitCost
  notes?: string;
}

export interface Bid {
  id: string; // Unique ID for the bid
  category?: string; // <-- Add category field (optional for now)
  contractorId?: string; // Link to a contractor record (if applicable)
  contractorName: string; // Name of the contractor/supplier
  costCategoryId?: string; // Optional link to a specific cost category/line item
  bidAmount: number;
  status: BidStatus;
  submittedDate: Date;
  notes?: string;
  attachments?: { name: string; url: string }[]; // Array of file attachments
}

// We might also need a Contractor type later
// export interface Contractor {
//   id: string;
//   name: string;
//   contactPerson?: string;
//   email?: string;
//   phone?: string;
//   specialty?: string; // e.g., Plumbing, Electrical, Framing
// } 