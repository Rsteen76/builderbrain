import { Phase, LineItem, ProjectRequirements, ProjectMilestone, ProjectStatus, ProjectPriority } from './project.types';
import { BidPaymentStage } from './bid.types';

export type WizardStep = 
  | 'project_info'
  | 'project_details'
  | 'phases'
  | 'line_items'
  | 'requirements'
  | 'milestones'
  | 'bid_packages'
  | 'summary';

export interface WizardPhase extends Omit<Phase, 'id'> {
  id?: string;
  lineItems: LineItemGroup[];
  bidPackages: BidPackageInfo[];
}

export interface LineItemGroup {
  id: string;
  name: string;
  category: 'material' | 'labor' | 'equipment' | 'subcontractor' | 'other';
  lineItems: LineItem[];
}

export interface BidPackageInfo {
  id: string;
  title: string;
  description: string;
  scope: string;
  lineItemIds: string[];
  estimatedAmount: number;
  subcontractorType: string;
  paymentSchedule: BidPaymentStage[];
}

export interface WizardTemplate {
  id: string;
  name: string;
  description: string;
  projectType: 'residential' | 'commercial' | 'renovation' | 'custom';
  icon?: string;
  phases: {
    name: string;
    description: string;
    percentage: number;
    standardLineItems?: {
      name: string;
      category: LineItem['category'];
      unitCost?: number;
      unit?: string;
    }[];
    standardBidPackages?: {
      title: string;
      description: string;
      scope: string;
      subcontractorType: string;
    }[];
  }[];
  standardRequirements?: Partial<ProjectRequirements>;
  standardMilestones?: Partial<ProjectMilestone>[];
}

export interface WizardProjectData {
  // Project basic info
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: Date;
  endDate?: Date;
  budget: number;
  location: string;
  projectType: string;
  estimatedDuration: string;
  clientId?: string;
  
  // Wizard specific data
  selectedTemplate?: WizardTemplate;
  currentStep: WizardStep;
  phases: WizardPhase[];
  requirements: ProjectRequirements;
  milestones: ProjectMilestone[];
  stepProgress: Record<WizardStep, 'not_started' | 'in_progress' | 'completed'>;
} 