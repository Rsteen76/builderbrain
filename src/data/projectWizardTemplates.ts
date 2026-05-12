import { addDays } from '../services/project/dates';
import type { Task } from '../types';
import type { BudgetItem, ScheduleMilestone, WizardProjectPhase } from '../contexts/ProjectWizardContext';

export type ProjectTemplateId =
  | 'residential'
  | 'commercial'
  | 'renovation'
  | 'kitchen-remodel'
  | 'landscaping'
  | 'custom';

export interface ProjectTemplatePhase {
  name: string;
  description: string;
  budgetPercentage: number;
  durationPercentage: number;
  tasks: Array<{ title: string; priority: Task['priority'] }>;
}

export interface ProjectWizardTemplate {
  id: ProjectTemplateId;
  name: string;
  projectType: string;
  description: string;
  phases: ProjectTemplatePhase[];
  milestones: Array<{ title: string; description: string; phaseName?: string }>;
}

const residentialPhases: ProjectTemplatePhase[] = [
  {
    name: 'Pre-Construction & Permits',
    description: 'Scope, selections, estimates, permit approvals, insurance, and procurement plan.',
    budgetPercentage: 5,
    durationPercentage: 10,
    tasks: [
      { title: 'Confirm approved drawings and specifications', priority: 'high' },
      { title: 'Submit permits and utility applications', priority: 'high' },
      { title: 'Identify long-lead materials and order dates', priority: 'high' },
    ],
  },
  {
    name: 'Site Prep & Utilities',
    description: 'Survey, erosion control, clearing, access, temporary utilities, and rough grading.',
    budgetPercentage: 8,
    durationPercentage: 8,
    tasks: [
      { title: 'Install erosion control and construction access', priority: 'high' },
      { title: 'Stake building corners and verify setbacks', priority: 'high' },
      { title: 'Coordinate temporary power and water', priority: 'medium' },
    ],
  },
  {
    name: 'Foundation',
    description: 'Excavation, footings, foundation walls/slab, waterproofing, drainage, and backfill.',
    budgetPercentage: 12,
    durationPercentage: 10,
    tasks: [
      { title: 'Complete excavation and footing prep', priority: 'high' },
      { title: 'Pass footing/foundation inspections', priority: 'high' },
      { title: 'Install drainage and waterproofing', priority: 'high' },
    ],
  },
  {
    name: 'Framing & Dry-In',
    description: 'Floor/wall/roof framing, sheathing, roofing, windows, exterior doors, and weather dry-in.',
    budgetPercentage: 18,
    durationPercentage: 16,
    tasks: [
      { title: 'Frame structure and roof system', priority: 'high' },
      { title: 'Install windows, exterior doors, and roofing', priority: 'high' },
      { title: 'Pass framing inspection', priority: 'high' },
    ],
  },
  {
    name: 'MEP Rough-In',
    description: 'Electrical, plumbing, HVAC, low-voltage rough-in, trade coordination, and inspections.',
    budgetPercentage: 14,
    durationPercentage: 14,
    tasks: [
      { title: 'Complete plumbing rough-in', priority: 'high' },
      { title: 'Complete electrical and low-voltage rough-in', priority: 'high' },
      { title: 'Complete HVAC rough-in and inspections', priority: 'high' },
    ],
  },
  {
    name: 'Insulation & Drywall',
    description: 'Insulation, air sealing, drywall hang, finish, texture, and primer.',
    budgetPercentage: 8,
    durationPercentage: 10,
    tasks: [
      { title: 'Pass insulation inspection', priority: 'high' },
      { title: 'Hang and finish drywall', priority: 'high' },
      { title: 'Prime walls and ceilings', priority: 'medium' },
    ],
  },
  {
    name: 'Exterior Finishes',
    description: 'Siding, masonry, exterior trim, paint, gutters, decks, porches, and exterior details.',
    budgetPercentage: 8,
    durationPercentage: 8,
    tasks: [
      { title: 'Install exterior cladding and trim', priority: 'medium' },
      { title: 'Complete exterior paint or finish', priority: 'medium' },
      { title: 'Install gutters and exterior details', priority: 'medium' },
    ],
  },
  {
    name: 'Interior Finishes',
    description: 'Cabinets, countertops, tile, flooring, interior doors, trim, paint, and finish carpentry.',
    budgetPercentage: 18,
    durationPercentage: 16,
    tasks: [
      { title: 'Install cabinets, counters, and built-ins', priority: 'high' },
      { title: 'Install tile, flooring, doors, and trim', priority: 'high' },
      { title: 'Complete interior paint and finish carpentry', priority: 'medium' },
    ],
  },
  {
    name: 'Trim-Out & Commissioning',
    description: 'Plumbing/electrical/HVAC trim, appliances, startup, testing, and owner orientation prep.',
    budgetPercentage: 6,
    durationPercentage: 5,
    tasks: [
      { title: 'Install fixtures, devices, and appliances', priority: 'high' },
      { title: 'Start up HVAC and verify systems', priority: 'high' },
      { title: 'Prepare owner orientation items', priority: 'medium' },
    ],
  },
  {
    name: 'Punch, Closeout & Warranty',
    description: 'Final inspections, punch list, cleaning, documentation, warranty, and owner handoff.',
    budgetPercentage: 3,
    durationPercentage: 3,
    tasks: [
      { title: 'Pass final inspections and certificate requirements', priority: 'high' },
      { title: 'Complete punch list and final clean', priority: 'high' },
      { title: 'Deliver warranty and closeout documents', priority: 'medium' },
    ],
  },
];

const kitchenPhases: ProjectTemplatePhase[] = [
  {
    name: 'Design, Selections & Procurement',
    description: 'Finalize layout, cabinet drawings, selections, appliance specs, and long-lead orders.',
    budgetPercentage: 15,
    durationPercentage: 20,
    tasks: [
      { title: 'Approve cabinet layout and appliance specs', priority: 'high' },
      { title: 'Order cabinets, counters, and long-lead items', priority: 'high' },
      { title: 'Confirm temporary kitchen and protection plan', priority: 'medium' },
    ],
  },
  {
    name: 'Demolition & Protection',
    description: 'Dust protection, disconnects, selective demo, disposal, and rough framing prep.',
    budgetPercentage: 12,
    durationPercentage: 15,
    tasks: [
      { title: 'Install dust protection and floor protection', priority: 'high' },
      { title: 'Disconnect utilities and remove existing finishes', priority: 'high' },
      { title: 'Verify hidden conditions after demo', priority: 'high' },
    ],
  },
  {
    name: 'Rough Framing & MEP',
    description: 'Framing changes, electrical/plumbing/HVAC rough-in, inspections, and wall close-up.',
    budgetPercentage: 18,
    durationPercentage: 20,
    tasks: [
      { title: 'Complete framing modifications', priority: 'high' },
      { title: 'Complete electrical and plumbing rough-in', priority: 'high' },
      { title: 'Pass rough inspections before close-up', priority: 'high' },
    ],
  },
  {
    name: 'Drywall, Paint & Finish Prep',
    description: 'Patch, drywall, paint prep, primer, and field measurements for finishes.',
    budgetPercentage: 10,
    durationPercentage: 15,
    tasks: [
      { title: 'Close walls and patch drywall', priority: 'high' },
      { title: 'Prime and paint prep areas', priority: 'medium' },
      { title: 'Confirm final field measurements', priority: 'high' },
    ],
  },
  {
    name: 'Cabinetry, Counters & Finish Install',
    description: 'Cabinets, counters, backsplash, flooring, trim, fixtures, and appliances.',
    budgetPercentage: 38,
    durationPercentage: 25,
    tasks: [
      { title: 'Install cabinets and panels', priority: 'high' },
      { title: 'Install countertops and backsplash', priority: 'high' },
      { title: 'Set fixtures, appliances, trim, and hardware', priority: 'high' },
    ],
  },
  {
    name: 'Punch & Closeout',
    description: 'Final adjustments, cleaning, owner walkthrough, care instructions, and warranty handoff.',
    budgetPercentage: 7,
    durationPercentage: 5,
    tasks: [
      { title: 'Complete punch list and final clean', priority: 'high' },
      { title: 'Walk owner through appliance and finish care', priority: 'medium' },
      { title: 'Deliver warranty and closeout packet', priority: 'medium' },
    ],
  },
];

const commercialPhases: ProjectTemplatePhase[] = [
  {
    name: 'Pre-Construction, Permits & Procurement',
    description: 'Lease/owner requirements, code review, permits, submittals, procurement, and schedule lock.',
    budgetPercentage: 8,
    durationPercentage: 15,
    tasks: [
      { title: 'Confirm approved drawings and landlord requirements', priority: 'high' },
      { title: 'Submit permits and required submittals', priority: 'high' },
      { title: 'Procure long-lead fixtures and equipment', priority: 'high' },
    ],
  },
  {
    name: 'Demolition & Site Prep',
    description: 'Protection, selective demolition, abatement coordination if needed, and layout.',
    budgetPercentage: 12,
    durationPercentage: 12,
    tasks: [
      { title: 'Install protection and safety controls', priority: 'high' },
      { title: 'Complete selective demolition', priority: 'high' },
      { title: 'Lay out walls, openings, and critical dimensions', priority: 'high' },
    ],
  },
  {
    name: 'Framing, Rough-In & Above-Ceiling',
    description: 'Partitions, backing, electrical, plumbing, HVAC, fire/life safety, low-voltage, and inspections.',
    budgetPercentage: 32,
    durationPercentage: 30,
    tasks: [
      { title: 'Frame partitions and install backing', priority: 'high' },
      { title: 'Complete MEP and fire/life-safety rough-in', priority: 'high' },
      { title: 'Pass rough and above-ceiling inspections', priority: 'high' },
    ],
  },
  {
    name: 'Drywall, Ceilings & Finishes',
    description: 'Drywall, ceilings, doors/hardware, paint, flooring, millwork, and finish materials.',
    budgetPercentage: 28,
    durationPercentage: 25,
    tasks: [
      { title: 'Hang/finish drywall and install ceilings', priority: 'high' },
      { title: 'Install doors, hardware, paint, and flooring', priority: 'high' },
      { title: 'Install millwork and specialty finishes', priority: 'medium' },
    ],
  },
  {
    name: 'Fixtures, Equipment & Commissioning',
    description: 'Fixtures, owner/vendor equipment, controls, balancing, testing, and commissioning.',
    budgetPercentage: 12,
    durationPercentage: 10,
    tasks: [
      { title: 'Install fixtures and owner-furnished equipment', priority: 'high' },
      { title: 'Test systems and complete balancing', priority: 'high' },
      { title: 'Resolve commissioning issues', priority: 'high' },
    ],
  },
  {
    name: 'Final Inspections & Turnover',
    description: 'Final inspections, punch, cleaning, closeout documents, owner training, and turnover.',
    budgetPercentage: 8,
    durationPercentage: 8,
    tasks: [
      { title: 'Pass final inspections and occupancy requirements', priority: 'high' },
      { title: 'Complete punch list and final clean', priority: 'high' },
      { title: 'Deliver closeout documents and training', priority: 'medium' },
    ],
  },
];

const landscapingPhases: ProjectTemplatePhase[] = [
  {
    name: 'Design, Permits & Utility Locate',
    description: 'Plan review, selections, permits, locates, access, and staging.',
    budgetPercentage: 8,
    durationPercentage: 12,
    tasks: [
      { title: 'Confirm plan, materials, and plant selections', priority: 'high' },
      { title: 'Complete utility locates and permit checks', priority: 'high' },
      { title: 'Confirm access, staging, and protection', priority: 'medium' },
    ],
  },
  {
    name: 'Site Prep, Grading & Drainage',
    description: 'Clearing, demolition, rough grading, drainage, base prep, and soil amendments.',
    budgetPercentage: 24,
    durationPercentage: 28,
    tasks: [
      { title: 'Clear work areas and protect existing features', priority: 'high' },
      { title: 'Complete grading and drainage rough-in', priority: 'high' },
      { title: 'Prepare base and soil conditions', priority: 'high' },
    ],
  },
  {
    name: 'Hardscape & Structures',
    description: 'Patios, walks, retaining walls, edging, fencing, decks, pergolas, and structures.',
    budgetPercentage: 34,
    durationPercentage: 32,
    tasks: [
      { title: 'Install hardscape base and layout', priority: 'high' },
      { title: 'Build walls, flatwork, and structures', priority: 'high' },
      { title: 'Verify grades and transitions', priority: 'medium' },
    ],
  },
  {
    name: 'Irrigation, Lighting & Utilities',
    description: 'Irrigation, sleeves, lighting, controls, low-voltage, and testing.',
    budgetPercentage: 14,
    durationPercentage: 12,
    tasks: [
      { title: 'Install irrigation and sleeves', priority: 'high' },
      { title: 'Install lighting and controls', priority: 'medium' },
      { title: 'Pressure test and program systems', priority: 'high' },
    ],
  },
  {
    name: 'Planting, Mulch & Finish Work',
    description: 'Planting, sod/seed, mulch, decorative rock, final grading, and cleanup.',
    budgetPercentage: 16,
    durationPercentage: 12,
    tasks: [
      { title: 'Install trees, shrubs, plants, and lawn areas', priority: 'high' },
      { title: 'Install mulch, rock, and final finish materials', priority: 'medium' },
      { title: 'Complete cleanup and plant care setup', priority: 'medium' },
    ],
  },
  {
    name: 'Walkthrough & Maintenance Handoff',
    description: 'Punch list, watering schedule, maintenance instructions, warranties, and owner handoff.',
    budgetPercentage: 4,
    durationPercentage: 4,
    tasks: [
      { title: 'Complete punch list and final walkthrough', priority: 'high' },
      { title: 'Provide watering and maintenance instructions', priority: 'medium' },
      { title: 'Deliver warranty and care documents', priority: 'medium' },
    ],
  },
];

export const PROJECT_WIZARD_TEMPLATES: Record<ProjectTemplateId, ProjectWizardTemplate> = {
  residential: {
    id: 'residential',
    name: 'Residential Construction',
    projectType: 'Residential Construction',
    description: 'Balanced custom-home workflow with permitting, construction, commissioning, and closeout.',
    phases: residentialPhases,
    milestones: [
      { title: 'Permits approved', description: 'Project can move from planning into field work.', phaseName: 'Pre-Construction & Permits' },
      { title: 'Foundation inspection passed', description: 'Foundation is complete and ready for framing.', phaseName: 'Foundation' },
      { title: 'Dry-in complete', description: 'Roof, windows, and doors protect the structure.', phaseName: 'Framing & Dry-In' },
      { title: 'Final walkthrough', description: 'Owner walkthrough and punch list review.', phaseName: 'Punch, Closeout & Warranty' },
    ],
  },
  commercial: {
    id: 'commercial',
    name: 'Commercial Building',
    projectType: 'Commercial Construction',
    description: 'Tenant improvement and light commercial workflow with inspections, commissioning, and turnover.',
    phases: commercialPhases,
    milestones: [
      { title: 'Permit release', description: 'Approved to start field work.', phaseName: 'Pre-Construction, Permits & Procurement' },
      { title: 'Above-ceiling inspection passed', description: 'MEP rough-in is approved before ceiling close-up.', phaseName: 'Framing, Rough-In & Above-Ceiling' },
      { title: 'Substantial completion', description: 'Space is ready for final punch and owner/vendor setup.', phaseName: 'Fixtures, Equipment & Commissioning' },
      { title: 'Turnover complete', description: 'Final documents and owner training delivered.', phaseName: 'Final Inspections & Turnover' },
    ],
  },
  renovation: {
    id: 'renovation',
    name: 'Renovation Project',
    projectType: 'Renovation',
    description: 'General renovation workflow based on protection, demolition, rough-in, finishes, and handoff.',
    phases: kitchenPhases.map(phase =>
      phase.name === 'Cabinetry, Counters & Finish Install'
        ? { ...phase, name: 'Finish Installation', description: 'Flooring, trim, paint, fixtures, cabinets or built-ins, and final finish materials.' }
        : phase
    ),
    milestones: [
      { title: 'Selections locked', description: 'Materials and long-lead items are approved.', phaseName: 'Design, Selections & Procurement' },
      { title: 'Rough inspections passed', description: 'Walls can be closed and finishes can begin.', phaseName: 'Rough Framing & MEP' },
      { title: 'Owner walkthrough', description: 'Punch and closeout review.', phaseName: 'Punch & Closeout' },
    ],
  },
  'kitchen-remodel': {
    id: 'kitchen-remodel',
    name: 'Kitchen Remodel',
    projectType: 'Renovation',
    description: 'Kitchen-specific workflow with selections, protection, MEP, cabinetry, counters, and closeout.',
    phases: kitchenPhases,
    milestones: [
      { title: 'Cabinets ordered', description: 'Long-lead cabinetry and hardware are released.', phaseName: 'Design, Selections & Procurement' },
      { title: 'Rough inspections passed', description: 'MEP rough-in can be closed.', phaseName: 'Rough Framing & MEP' },
      { title: 'Counters templated', description: 'Cabinets are ready for counter field measure.', phaseName: 'Cabinetry, Counters & Finish Install' },
      { title: 'Kitchen handoff', description: 'Final clean, punch, and warranty handoff.', phaseName: 'Punch & Closeout' },
    ],
  },
  landscaping: {
    id: 'landscaping',
    name: 'Landscaping Project',
    projectType: 'Specialized Construction',
    description: 'Outdoor construction workflow covering grading, hardscape, irrigation, planting, and care handoff.',
    phases: landscapingPhases,
    milestones: [
      { title: 'Utility locate complete', description: 'Safe to begin excavation and grading.', phaseName: 'Design, Permits & Utility Locate' },
      { title: 'Rough grading approved', description: 'Drainage and grades are ready for hardscape.', phaseName: 'Site Prep, Grading & Drainage' },
      { title: 'Irrigation tested', description: 'Watering systems are pressure-tested and programmed.', phaseName: 'Irrigation, Lighting & Utilities' },
      { title: 'Maintenance handoff', description: 'Owner has watering and maintenance plan.', phaseName: 'Walkthrough & Maintenance Handoff' },
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom Project',
    projectType: 'Residential Construction',
    description: 'Lightweight starter workflow that can be reshaped for unusual scopes.',
    phases: [
      {
        name: 'Planning & Scope',
        description: 'Define scope, budget, schedule, approvals, and success criteria.',
        budgetPercentage: 10,
        durationPercentage: 15,
        tasks: [
          { title: 'Confirm scope and budget assumptions', priority: 'high' },
          { title: 'Identify approvals and long-lead risks', priority: 'high' },
        ],
      },
      {
        name: 'Procurement & Mobilization',
        description: 'Line up vendors, materials, site access, and start conditions.',
        budgetPercentage: 20,
        durationPercentage: 20,
        tasks: [
          { title: 'Confirm vendors and material lead times', priority: 'high' },
          { title: 'Mobilize project site', priority: 'medium' },
        ],
      },
      {
        name: 'Field Work',
        description: 'Complete the primary construction scope.',
        budgetPercentage: 55,
        durationPercentage: 50,
        tasks: [
          { title: 'Execute primary field scope', priority: 'high' },
          { title: 'Track quality, schedule, and budget', priority: 'medium' },
        ],
      },
      {
        name: 'Punch & Closeout',
        description: 'Finish corrections, documentation, final clean, and handoff.',
        budgetPercentage: 15,
        durationPercentage: 15,
        tasks: [
          { title: 'Complete punch list', priority: 'high' },
          { title: 'Deliver closeout documentation', priority: 'medium' },
        ],
      },
    ],
    milestones: [
      { title: 'Scope approved', description: 'Project assumptions and budget are confirmed.', phaseName: 'Planning & Scope' },
      { title: 'Field work complete', description: 'Primary work is ready for punch.', phaseName: 'Field Work' },
      { title: 'Closeout complete', description: 'Project is turned over.', phaseName: 'Punch & Closeout' },
    ],
  },
};

export const getProjectWizardTemplate = (templateId?: string | null): ProjectWizardTemplate =>
  PROJECT_WIZARD_TEMPLATES[(templateId as ProjectTemplateId) || 'custom'] || PROJECT_WIZARD_TEMPLATES.custom;

export const getTemplateIdForProjectType = (projectType?: string): ProjectTemplateId | null => {
  switch (projectType) {
    case 'Residential Construction':
      return 'residential';
    case 'Commercial Construction':
    case 'Industrial':
      return 'commercial';
    case 'Renovation':
      return 'renovation';
    case 'Specialized Construction':
      return 'custom';
    default:
      return null;
  }
};

export const getDefaultBudgetForSize = (size?: string): number => {
  if (!size) return 0;
  if (size.includes('Under $50,000')) return 45000;
  if (size.includes('$50,000 - $250,000')) return 150000;
  if (size.includes('$250,000 - $1,000,000')) return 650000;
  if (size.includes('Over $1,000,000')) return 1500000;
  return 0;
};

export const buildTemplatePhases = (
  template: ProjectWizardTemplate,
  startDate: Date,
  endDate: Date,
  totalBudget: number
): WizardProjectPhase[] => {
  const totalDays = Math.max(
    1,
    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  );

  let elapsedDays = 0;
  return template.phases.map((phase, index) => {
    const isLast = index === template.phases.length - 1;
    const durationDays = isLast
      ? Math.max(1, totalDays - elapsedDays)
      : Math.max(1, Math.round(totalDays * (phase.durationPercentage / 100)));
    const phaseStartDate = addDays(startDate, elapsedDays);
    elapsedDays += durationDays;

    return {
      id: `template-phase-${template.id}-${index + 1}`,
      name: phase.name,
      description: phase.description,
      startDate: phaseStartDate,
      endDate: addDays(phaseStartDate, durationDays),
      status: 'not_started',
      progress: 0,
      budget: Math.round(totalBudget * (phase.budgetPercentage / 100)),
      actualCost: 0,
      budgetPercentage: phase.budgetPercentage,
      tasks: phase.tasks.map((task, taskIndex) => ({
        id: `template-task-${template.id}-${index + 1}-${taskIndex + 1}`,
        title: task.title,
        status: 'todo',
        priority: task.priority,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };
  });
};

export const buildTemplateMilestones = (
  template: ProjectWizardTemplate,
  phases: WizardProjectPhase[]
): ScheduleMilestone[] =>
  template.milestones.map((milestone, index) => {
    const matchingPhase = phases.find(phase => phase.name === milestone.phaseName);
    return {
      id: `template-milestone-${template.id}-${index + 1}`,
      title: milestone.title,
      description: milestone.description,
      dueDate: matchingPhase?.endDate || phases[Math.min(index, phases.length - 1)]?.endDate || new Date(),
      isCompleted: false,
    };
  });

export const buildTemplateBudgetItems = (
  phases: WizardProjectPhase[]
): BudgetItem[] =>
  phases.map((phase, index) => ({
    id: `template-budget-${index + 1}`,
    category: 'Phase Budget',
    description: phase.name,
    estimatedCost: phase.budget || 0,
    actualCost: 0,
  }));
