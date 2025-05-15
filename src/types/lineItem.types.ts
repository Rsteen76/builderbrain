export interface LineItem {
  id: string;
  projectId: string;
  description: string;
  category: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
