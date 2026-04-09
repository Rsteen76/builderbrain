import { v4 as uuidv4 } from 'uuid';
import {
  Bid,
  BidPaymentStage,
  BidVersion,
  Expense,
  Project,
  ProjectPhase,
  Subcontractor,
  Task,
} from '../types';
import type { BidFilter, BidSort } from './bid';

const STORAGE_KEY = 'builderbrain:dev-data:v1';
const DEV_DATA_VERSION = 3;
const DEV_USER_ID = 'dev-user';
const DAY_MS = 24 * 60 * 60 * 1000;

interface DevDataState {
  version: number;
  projects: Project[];
  tasks: Task[];
  bids: Bid[];
  expenses: Expense[];
  subcontractors: Subcontractor[];
}

let memoryState: DevDataState | null = null;

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);

const asDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sortByDateDesc = <T>(items: T[], getter: (item: T) => Date | null) =>
  [...items].sort((a, b) => {
    const aDate = getter(a)?.getTime() || 0;
    const bDate = getter(b)?.getTime() || 0;
    return bDate - aDate;
  });

const toDateString = (date: Date) => date.toISOString().slice(0, 10);

const withPaymentProgress = (bid: Bid): Bid => {
  if (!bid.paymentSchedule || bid.paymentSchedule.length === 0) {
    return {
      ...bid,
      paymentProgress: {
        paid: 0,
        pending: bid.totalAmount,
        remaining: bid.totalAmount,
      },
    };
  }

  const paid = bid.paymentSchedule.reduce(
    (sum, stage) => sum + (stage.paidAmount || 0),
    0
  );
  const pending = bid.paymentSchedule
    .filter((stage) => stage.status !== 'paid')
    .reduce((sum, stage) => sum + (stage.amount || 0), 0);

  return {
    ...bid,
    paymentProgress: {
      paid,
      pending,
      remaining: Math.max(bid.totalAmount - paid, 0),
    },
  };
};

const hydrateTask = (task: Task): Task => ({
  ...task,
  createdAt: asDate(task.createdAt) || new Date(),
  updatedAt: asDate(task.updatedAt) || new Date(),
  dueDate: asDate(task.dueDate) || null,
  completedAt: asDate(task.completedAt) || null,
});

const hydrateExpense = (expense: Expense): Expense => ({
  ...expense,
  date: asDate(expense.date) || new Date(),
  createdAt: asDate(expense.createdAt) || new Date(),
  updatedAt: asDate(expense.updatedAt) || new Date(),
  dueDate: asDate(expense.dueDate) || null,
  lastPaymentDate: asDate(expense.lastPaymentDate) || null,
});

const hydrateBidVersion = (version: BidVersion): BidVersion => ({
  ...version,
  createdAt: asDate(version.createdAt) || new Date(),
});

const hydrateBidStage = (stage: BidPaymentStage): BidPaymentStage => ({
  ...stage,
  dueDate: asDate(stage.dueDate) || undefined,
  paymentDate: asDate(stage.paymentDate) || undefined,
  createdAt: asDate(stage.createdAt) || new Date(),
  updatedAt: asDate(stage.updatedAt) || new Date(),
});

const hydrateBid = (bid: Bid): Bid =>
  withPaymentProgress({
    ...bid,
    createdAt: asDate(bid.createdAt) || new Date(),
    updatedAt: asDate(bid.updatedAt) || new Date(),
    submissionDeadline: asDate(bid.submissionDeadline) || null,
    startDate: asDate(bid.startDate) || null,
    completionDate: asDate(bid.completionDate) || null,
    versions: (bid.versions || []).map(hydrateBidVersion),
    paymentSchedule: (bid.paymentSchedule || []).map(hydrateBidStage),
  });

const hydrateSubcontractor = (subcontractor: Subcontractor): Subcontractor => ({
  ...subcontractor,
  createdAt: asDate(subcontractor.createdAt) || new Date(),
  updatedAt: asDate(subcontractor.updatedAt) || new Date(),
  lastBid: subcontractor.lastBid
    ? {
        ...subcontractor.lastBid,
        date: asDate(subcontractor.lastBid.date) || new Date(),
      }
    : null,
});

const hydratePhase = (phase: ProjectPhase): ProjectPhase => ({
  ...phase,
  startDate: asDate(phase.startDate) || new Date(),
  endDate: asDate(phase.endDate) || addDays(new Date(), 30),
  tasks: [],
});

const hydrateProject = (project: Project): Project => ({
  ...project,
  startDate: asDate(project.startDate) || new Date(),
  endDate: asDate(project.endDate) || null,
  createdAt: asDate(project.createdAt) || new Date(),
  updatedAt: asDate(project.updatedAt) || new Date(),
  keyMilestones: (project.keyMilestones || []).map((milestone) => ({
    ...milestone,
    date: asDate(milestone.date) || null,
  })),
  phases: (project.phases || []).map((phase) => hydratePhase(phase as ProjectPhase)),
  lineItems: (project.lineItems || []).map((item) => ({
    ...item,
    createdAt: asDate(item.createdAt) || undefined,
    updatedAt: asDate(item.updatedAt) || undefined,
  })),
});

const readStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStorage = (state: DevDataState) => {
  memoryState = state;
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage failures in dev mode and fall back to memory.
  }
};

const createSeedState = (): DevDataState => {
  const now = new Date();
  const lastMonth = addDays(now, -35);

  const subcontractors: Subcontractor[] = [
    {
      id: 'sub-foundation',
      userId: DEV_USER_ID,
      name: 'Summit Foundations',
      specialty: 'Concrete & Site Work',
      rating: 4.7,
      totalProjects: 18,
      lastBid: { date: addDays(now, -18), amount: 76000, projectId: 'proj-hillside' },
      contact: {
        phone: '555-110-4401',
        email: 'bids@summitfoundations.test',
        location: 'Boulder, CO',
      },
      performance: { onTime: 93, quality: 95, communication: 89 },
      companyInfo: { website: 'summitfoundations.test', founded: '2006', employees: 22, license: 'CO-FOUND-2219' },
      projects: ['proj-hillside'],
      notes: 'Strong on site logistics and retaining walls.',
      createdAt: addDays(lastMonth, -14),
      updatedAt: addDays(now, -5),
    },
    {
      id: 'sub-framing',
      userId: DEV_USER_ID,
      name: 'Peak Framing Co.',
      specialty: 'Framing',
      rating: 4.4,
      totalProjects: 24,
      lastBid: { date: addDays(now, -4), amount: 92000, projectId: 'proj-hillside' },
      contact: {
        phone: '555-110-4402',
        email: 'estimating@peakframing.test',
        location: 'Fort Collins, CO',
      },
      performance: { onTime: 88, quality: 92, communication: 86 },
      companyInfo: { website: 'peakframing.test', founded: '2011', employees: 31, license: 'CO-FRAME-1480' },
      projects: ['proj-hillside'],
      notes: 'Fast crew, occasionally tight on schedule during peak season.',
      createdAt: addDays(lastMonth, -10),
      updatedAt: addDays(now, -3),
    },
    {
      id: 'sub-electrical',
      userId: DEV_USER_ID,
      name: 'Blue Arc Electric',
      specialty: 'Electrical',
      rating: 4.9,
      totalProjects: 29,
      lastBid: { date: addDays(now, -9), amount: 48000, projectId: 'proj-hillside' },
      contact: {
        phone: '555-110-4403',
        email: 'ops@bluearc.test',
        location: 'Denver, CO',
      },
      performance: { onTime: 97, quality: 98, communication: 94 },
      companyInfo: { website: 'bluearc.test', founded: '2009', employees: 17, license: 'CO-ELEC-8812' },
      projects: ['proj-hillside', 'proj-tenant'],
      notes: 'Well-documented change orders and clean closeout packages.',
      createdAt: addDays(lastMonth, -7),
      updatedAt: addDays(now, -2),
    },
    {
      id: 'sub-cabinetry',
      userId: DEV_USER_ID,
      name: 'Northline Cabinetry',
      specialty: 'Cabinetry',
      rating: 4.8,
      totalProjects: 15,
      lastBid: { date: addDays(now, -12), amount: 28000, projectId: 'proj-kitchen' },
      contact: {
        phone: '555-110-4404',
        email: 'sales@northline.test',
        location: 'Golden, CO',
      },
      performance: { onTime: 95, quality: 97, communication: 92 },
      companyInfo: { website: 'northline.test', founded: '2014', employees: 11, license: 'CO-CAB-5701' },
      projects: ['proj-kitchen'],
      notes: 'Great finish quality and good homeowner communication.',
      createdAt: addDays(lastMonth, -5),
      updatedAt: addDays(now, -6),
    },
    {
      id: 'sub-plumbing',
      userId: DEV_USER_ID,
      name: 'Copper Creek Plumbing',
      specialty: 'Plumbing',
      rating: 4.5,
      totalProjects: 21,
      lastBid: { date: addDays(now, -8), amount: 17200, projectId: 'proj-kitchen' },
      contact: {
        phone: '555-110-4405',
        email: 'office@coppercreek.test',
        location: 'Lakewood, CO',
      },
      performance: { onTime: 90, quality: 94, communication: 90 },
      companyInfo: { website: 'coppercreek.test', founded: '2008', employees: 13, license: 'CO-PLMB-7221' },
      projects: ['proj-kitchen', 'proj-tenant'],
      notes: 'Reliable for fixture trim-out and punch support.',
      createdAt: addDays(lastMonth, -6),
      updatedAt: addDays(now, -8),
    },
    {
      id: 'sub-hvac',
      userId: DEV_USER_ID,
      name: 'AirGrid Mechanical',
      specialty: 'HVAC',
      rating: 4.6,
      totalProjects: 19,
      lastBid: { date: addDays(now, -40), amount: 22500, projectId: 'proj-tenant' },
      contact: {
        phone: '555-110-4406',
        email: 'pm@airgrid.test',
        location: 'Aurora, CO',
      },
      performance: { onTime: 91, quality: 93, communication: 88 },
      companyInfo: { website: 'airgrid.test', founded: '2007', employees: 26, license: 'CO-HVAC-5029' },
      projects: ['proj-tenant'],
      notes: 'Good commissioning notes and solid service handoff.',
      createdAt: addDays(lastMonth, -18),
      updatedAt: addDays(now, -12),
    },
  ];

  const projects: Project[] = [
    {
      id: 'proj-hillside',
      userId: DEV_USER_ID,
      name: 'Hillside Custom Home',
      description: 'Ground-up custom home with walkout basement, detached workshop, and premium finish package.',
      status: 'active',
      priority: 'high',
      startDate: addDays(now, -42),
      endDate: addDays(now, 210),
      budget: { total: 850000, spent: 0, remaining: 850000 },
      actualCost: 0,
      location: {
        address: '1624 Pine View Road',
        city: 'Boulder',
        state: 'CO',
        zipCode: '80304',
      },
      createdAt: addDays(lastMonth, -20),
      updatedAt: addDays(now, -1),
      team: ['Avery PM', 'Jordan Field Lead', 'Taylor Estimator'],
      projectType: 'Residential Construction',
      estimatedDuration: '9 months',
      phases: [
        { id: 'phase-hillside-pre', projectId: 'proj-hillside', name: 'Pre-Construction', description: 'Permits, utility coordination, and procurement.', startDate: addDays(now, -42), endDate: addDays(now, -22), status: 'completed', progress: 100, order: 1, budget: 42000, actualCost: 0, tasks: [] },
        { id: 'phase-hillside-site', projectId: 'proj-hillside', name: 'Site Work & Foundation', description: 'Excavation, retaining walls, footings, and slab prep.', startDate: addDays(now, -21), endDate: addDays(now, 14), status: 'in_progress', progress: 62, order: 2, budget: 130000, actualCost: 0, tasks: [] },
        { id: 'phase-hillside-framing', projectId: 'proj-hillside', name: 'Framing', description: 'Wall layout, floor framing, roof package, and dry-in.', startDate: addDays(now, 15), endDate: addDays(now, 58), status: 'planning', progress: 10, order: 3, budget: 170000, actualCost: 0, tasks: [] },
        { id: 'phase-hillside-mep', projectId: 'proj-hillside', name: 'Rough-In Mechanical Systems', description: 'Electrical, HVAC, and plumbing rough-ins.', startDate: addDays(now, 59), endDate: addDays(now, 106), status: 'planning', progress: 0, order: 4, budget: 145000, actualCost: 0, tasks: [] },
        { id: 'phase-hillside-finish', projectId: 'proj-hillside', name: 'Interior Finishing', description: 'Cabinetry, flooring, paint, and final trim.', startDate: addDays(now, 107), endDate: addDays(now, 190), status: 'planning', progress: 0, order: 5, budget: 260000, actualCost: 0, tasks: [] },
      ],
      keyMilestones: [
        { name: 'Permit Approved', date: addDays(now, -28), description: 'Building permit issued by Boulder County.' },
        { name: 'Foundation Inspection', date: addDays(now, 6), description: 'Inspection required before slab pour.' },
        { name: 'Framing Start', date: addDays(now, 18), description: 'Crew mobilizes after lumber delivery.' },
        { name: 'Dry-In Complete', date: addDays(now, 70), description: 'Roof and exterior sheathing weather-tight.' },
        { name: 'Certificate of Occupancy Target', date: addDays(now, 214), description: 'Projected owner turnover.' },
      ],
      requirements: {
        permits: ['Building permit', 'Driveway access permit'],
        inspections: ['Foundation inspection', 'Rough-in inspection', 'Final occupancy inspection'],
        documents: ['Site survey', 'Structural drawings', 'Selections package'],
      },
      lineItems: [
        { id: 'li-h1', projectId: 'proj-hillside', phaseId: 'phase-hillside-site', description: 'Excavation and grading', category: 'labor', quantity: 1, unit: 'lot', unitCost: 28000, totalCost: 28000 },
        { id: 'li-h2', projectId: 'proj-hillside', phaseId: 'phase-hillside-site', description: 'Concrete foundation package', category: 'subcontractor', quantity: 1, unit: 'package', unitCost: 76000, totalCost: 76000 },
        { id: 'li-h3', projectId: 'proj-hillside', phaseId: 'phase-hillside-framing', description: 'Lumber package', category: 'material', quantity: 1, unit: 'package', unitCost: 118000, totalCost: 118000 },
        { id: 'li-h4', projectId: 'proj-hillside', phaseId: 'phase-hillside-mep', description: 'Electrical rough-in', category: 'subcontractor', quantity: 1, unit: 'package', unitCost: 48000, totalCost: 48000 },
        { id: 'li-h5', projectId: 'proj-hillside', phaseId: 'phase-hillside-finish', description: 'Interior finishes allowance', category: 'material', quantity: 1, unit: 'allowance', unitCost: 145000, totalCost: 145000 },
      ],
      tasks: [],
      bids: [],
      expenses: [],
      projections: [],
      progress: 0,
    },
    {
      id: 'proj-kitchen',
      userId: DEV_USER_ID,
      name: 'Maple Street Kitchen Remodel',
      description: 'Full kitchen remodel with layout rework, new cabinetry, upgraded lighting, and appliance replacement.',
      status: 'planning',
      priority: 'medium',
      startDate: addDays(now, -10),
      endDate: addDays(now, 55),
      budget: { total: 145000, spent: 0, remaining: 145000 },
      actualCost: 0,
      location: {
        address: '48 Maple Street',
        city: 'Denver',
        state: 'CO',
        zipCode: '80206',
      },
      createdAt: addDays(lastMonth, -12),
      updatedAt: addDays(now, -2),
      team: ['Avery PM', 'Morgan Designer'],
      projectType: 'Residential Remodel',
      estimatedDuration: '10 weeks',
      phases: [
        { id: 'phase-kitchen-design', projectId: 'proj-kitchen', name: 'Design & Selections', description: 'Cabinet layouts, appliance confirmations, and finish approvals.', startDate: addDays(now, -10), endDate: addDays(now, 4), status: 'in_progress', progress: 70, order: 1, budget: 18000, actualCost: 0, tasks: [] },
        { id: 'phase-kitchen-demo', projectId: 'proj-kitchen', name: 'Demolition & Prep', description: 'Existing cabinet removal, dust protection, and rough framing adjustments.', startDate: addDays(now, 5), endDate: addDays(now, 14), status: 'planning', progress: 15, order: 2, budget: 22000, actualCost: 0, tasks: [] },
        { id: 'phase-kitchen-install', projectId: 'proj-kitchen', name: 'Cabinetry & Finish Install', description: 'Cabinets, counters, backsplash, fixtures, and appliance set.', startDate: addDays(now, 15), endDate: addDays(now, 45), status: 'planning', progress: 0, order: 3, budget: 82000, actualCost: 0, tasks: [] },
        { id: 'phase-kitchen-punch', projectId: 'proj-kitchen', name: 'Punch & Closeout', description: 'Final adjustments, homeowner walkthrough, and warranty handoff.', startDate: addDays(now, 46), endDate: addDays(now, 55), status: 'planning', progress: 0, order: 4, budget: 23000, actualCost: 0, tasks: [] },
      ],
      keyMilestones: [
        { name: 'Design Lock', date: addDays(now, 3), description: 'All selections approved by owner.' },
        { name: 'Demolition Start', date: addDays(now, 7), description: 'Temporary kitchen setup confirmed.' },
        { name: 'Cabinet Delivery', date: addDays(now, 18), description: 'Field verify before install.' },
        { name: 'Final Walkthrough', date: addDays(now, 53), description: 'Closeout and warranty review.' },
      ],
      requirements: {
        permits: ['Electrical permit'],
        inspections: ['Electrical rough-in inspection'],
        documents: ['Selections schedule', 'Appliance cut sheets'],
      },
      lineItems: [
        { id: 'li-k1', projectId: 'proj-kitchen', phaseId: 'phase-kitchen-design', description: 'Design and drafting', category: 'labor', quantity: 1, unit: 'package', unitCost: 8500, totalCost: 8500 },
        { id: 'li-k2', projectId: 'proj-kitchen', phaseId: 'phase-kitchen-demo', description: 'Selective demolition', category: 'labor', quantity: 1, unit: 'package', unitCost: 6200, totalCost: 6200 },
        { id: 'li-k3', projectId: 'proj-kitchen', phaseId: 'phase-kitchen-install', description: 'Custom cabinetry', category: 'subcontractor', quantity: 1, unit: 'package', unitCost: 28000, totalCost: 28000 },
        { id: 'li-k4', projectId: 'proj-kitchen', phaseId: 'phase-kitchen-install', description: 'Appliance allowance', category: 'material', quantity: 1, unit: 'allowance', unitCost: 15000, totalCost: 15000 },
        { id: 'li-k5', projectId: 'proj-kitchen', phaseId: 'phase-kitchen-install', description: 'Plumbing fixture package', category: 'subcontractor', quantity: 1, unit: 'package', unitCost: 17200, totalCost: 17200 },
      ],
      tasks: [],
      bids: [],
      expenses: [],
      projections: [],
      progress: 0,
    },
    {
      id: 'proj-tenant',
      userId: DEV_USER_ID,
      name: 'Riverside Retail Tenant Improvement',
      description: 'Completed retail TI with new lighting, HVAC balancing, storefront patching, and merchandising handoff.',
      status: 'completed',
      priority: 'medium',
      startDate: addDays(now, -180),
      endDate: addDays(now, -20),
      budget: { total: 265000, spent: 0, remaining: 265000 },
      actualCost: 0,
      location: {
        address: '905 Riverside Plaza',
        city: 'Aurora',
        state: 'CO',
        zipCode: '80012',
      },
      createdAt: addDays(now, -210),
      updatedAt: addDays(now, -18),
      team: ['Jordan Field Lead', 'Casey Superintendent'],
      projectType: 'Commercial Tenant Improvement',
      estimatedDuration: '5 months',
      phases: [
        { id: 'phase-tenant-demo', projectId: 'proj-tenant', name: 'Demo & Prep', description: 'Selective demo and surface prep.', startDate: addDays(now, -180), endDate: addDays(now, -145), status: 'completed', progress: 100, order: 1, budget: 54000, actualCost: 0, tasks: [] },
        { id: 'phase-tenant-build', projectId: 'proj-tenant', name: 'Build-Out', description: 'Framing, MEP, and finish package.', startDate: addDays(now, -144), endDate: addDays(now, -40), status: 'completed', progress: 100, order: 2, budget: 171000, actualCost: 0, tasks: [] },
        { id: 'phase-tenant-close', projectId: 'proj-tenant', name: 'Closeout', description: 'Punch, balancing, and turnover.', startDate: addDays(now, -39), endDate: addDays(now, -20), status: 'completed', progress: 100, order: 3, budget: 40000, actualCost: 0, tasks: [] },
      ],
      keyMilestones: [
        { name: 'Substantial Completion', date: addDays(now, -26), description: 'Owner inventory moved in.' },
        { name: 'Final HVAC Balance', date: addDays(now, -24), description: 'Mechanical balancing signed off.' },
        { name: 'Warranty Handoff', date: addDays(now, -20), description: 'Closeout package delivered.' },
      ],
      requirements: {
        permits: ['Commercial electrical permit', 'Mechanical permit'],
        inspections: ['Final MEP inspection'],
        documents: ['Closeout binder', 'Warranty register'],
      },
      lineItems: [
        { id: 'li-t1', projectId: 'proj-tenant', phaseId: 'phase-tenant-demo', description: 'Selective demolition', category: 'labor', quantity: 1, unit: 'package', unitCost: 26500, totalCost: 26500 },
        { id: 'li-t2', projectId: 'proj-tenant', phaseId: 'phase-tenant-build', description: 'Lighting and controls', category: 'subcontractor', quantity: 1, unit: 'package', unitCost: 46500, totalCost: 46500 },
        { id: 'li-t3', projectId: 'proj-tenant', phaseId: 'phase-tenant-build', description: 'HVAC modifications', category: 'subcontractor', quantity: 1, unit: 'package', unitCost: 22500, totalCost: 22500 },
        { id: 'li-t4', projectId: 'proj-tenant', phaseId: 'phase-tenant-build', description: 'Merchandising fixtures', category: 'material', quantity: 1, unit: 'allowance', unitCost: 38000, totalCost: 38000 },
      ],
      tasks: [],
      bids: [],
      expenses: [],
      projections: [],
      progress: 0,
    },
  ];

  const tasks: Task[] = [
    {
      id: 'task-h1',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-pre',
      phaseName: 'Pre-Construction',
      title: 'Finalize permit resubmittal package',
      description: 'Address structural comments and upload final stamped sheets.',
      status: 'completed',
      priority: 'high',
      dueDate: addDays(now, -27),
      completedAt: addDays(now, -28),
      createdAt: addDays(now, -36),
      updatedAt: addDays(now, -28),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-h2',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-pre',
      phaseName: 'Pre-Construction',
      title: 'Confirm utility locate and temp power schedule',
      description: 'Coordinate utility marking and temporary power activation before excavation.',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, -30),
      completedAt: addDays(now, -31),
      createdAt: addDays(now, -40),
      updatedAt: addDays(now, -31),
      assigneeType: 'user',
      assigneeId: 'Jordan Field Lead',
    },
    {
      id: 'task-h3',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-pre',
      phaseName: 'Pre-Construction',
      title: 'Release long-lead window package',
      description: 'Approve supplier lead times and release the custom window order.',
      status: 'completed',
      priority: 'high',
      dueDate: addDays(now, -24),
      completedAt: addDays(now, -25),
      createdAt: addDays(now, -35),
      updatedAt: addDays(now, -25),
      assigneeType: 'user',
      assigneeId: 'Taylor Estimator',
    },
    {
      id: 'task-h4',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-site',
      phaseName: 'Site Work & Foundation',
      title: 'Complete excavation and export spoils',
      description: 'Rough grade the pad and verify haul-off quantities against estimate.',
      status: 'completed',
      priority: 'high',
      dueDate: addDays(now, -10),
      completedAt: addDays(now, -9),
      createdAt: addDays(now, -18),
      updatedAt: addDays(now, -9),
      assigneeType: 'user',
      assigneeId: 'Jordan Field Lead',
    },
    {
      id: 'task-h5',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-site',
      phaseName: 'Site Work & Foundation',
      title: 'Review retaining wall rebar submittal',
      description: 'Confirm engineer detail aligns with hillside calcs.',
      status: 'review',
      priority: 'high',
      dueDate: addDays(now, 2),
      createdAt: addDays(now, -9),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Taylor Estimator',
    },
    {
      id: 'task-h6',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-site',
      phaseName: 'Site Work & Foundation',
      title: 'Coordinate concrete pump access and staging',
      description: 'Confirm pump route, washout area, and neighbor access protection.',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, -2),
      completedAt: addDays(now, -1),
      createdAt: addDays(now, -8),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-h7',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-site',
      phaseName: 'Site Work & Foundation',
      title: 'Schedule footing inspection',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: addDays(now, 5),
      createdAt: addDays(now, -6),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Jordan Field Lead',
    },
    {
      id: 'task-h8',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-framing',
      phaseName: 'Framing',
      title: 'Confirm lumber takeoff against latest structural set',
      description: 'Estimator reconciled material counts before supplier lock.',
      status: 'completed',
      priority: 'high',
      dueDate: addDays(now, 10),
      completedAt: addDays(now, -1),
      createdAt: addDays(now, -5),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Taylor Estimator',
    },
    {
      id: 'task-h9',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-framing',
      phaseName: 'Framing',
      title: 'Resolve framing RFIs from the stair opening detail',
      description: 'Pending structural response on revised stair opening header sizing.',
      status: 'review',
      priority: 'medium',
      dueDate: addDays(now, 13),
      createdAt: addDays(now, -2),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-h10',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-framing',
      phaseName: 'Framing',
      title: 'Lock crane window and first lumber delivery',
      status: 'todo',
      priority: 'high',
      dueDate: addDays(now, 16),
      createdAt: addDays(now, -3),
      updatedAt: addDays(now, -3),
      assigneeType: 'user',
      assigneeId: 'Taylor Estimator',
    },
    {
      id: 'task-h11',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-mep',
      phaseName: 'Rough-In Mechanical Systems',
      title: 'Complete homeowner rough-in preferences walk',
      description: 'Capture switch locations, low-voltage drops, and specialty lighting requests.',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, 42),
      completedAt: addDays(now, -2),
      createdAt: addDays(now, -4),
      updatedAt: addDays(now, -2),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-h12',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-mep',
      phaseName: 'Rough-In Mechanical Systems',
      title: 'Review main panel schedule with electrician',
      description: 'Validate load assumptions before permit inspection card is issued.',
      status: 'review',
      priority: 'high',
      dueDate: addDays(now, 49),
      createdAt: addDays(now, -3),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Taylor Estimator',
    },
    {
      id: 'task-h13',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-mep',
      phaseName: 'Rough-In Mechanical Systems',
      title: 'Collect fixture rough-in dimensions from plumbing selections',
      status: 'in_progress',
      priority: 'medium',
      dueDate: addDays(now, 53),
      createdAt: addDays(now, -2),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Morgan Designer',
    },
    {
      id: 'task-h14',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-mep',
      phaseName: 'Rough-In Mechanical Systems',
      title: 'Finalize HVAC equipment submittals',
      status: 'todo',
      priority: 'medium',
      dueDate: addDays(now, 57),
      createdAt: addDays(now, -1),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-h15',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-finish',
      phaseName: 'Interior Finishing',
      title: 'Prepare finish selections tracker for cabinet kickoff',
      description: 'Owner finish matrix is compiled and linked for all finish trades.',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, 70),
      completedAt: addDays(now, -1),
      createdAt: addDays(now, -3),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Morgan Designer',
    },
    {
      id: 'task-h16',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-finish',
      phaseName: 'Interior Finishing',
      title: 'Approve cabinet finish sample set',
      status: 'review',
      priority: 'medium',
      dueDate: addDays(now, 79),
      createdAt: addDays(now, -1),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Morgan Designer',
    },
    {
      id: 'task-h17',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-finish',
      phaseName: 'Interior Finishing',
      title: 'Confirm flooring lead times',
      status: 'todo',
      priority: 'high',
      dueDate: addDays(now, 82),
      createdAt: addDays(now, -1),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Taylor Estimator',
    },
    {
      id: 'task-h18',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-finish',
      phaseName: 'Interior Finishing',
      title: 'Align owner appliance delivery window',
      status: 'in_progress',
      priority: 'medium',
      dueDate: addDays(now, 90),
      createdAt: addDays(now, 0),
      updatedAt: addDays(now, 0),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-k1',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-design',
      phaseName: 'Design & Selections',
      title: 'Finalize appliance selections',
      description: 'Owner signed off on appliance cut sheets and rough-in dimensions.',
      status: 'completed',
      priority: 'high',
      dueDate: addDays(now, 2),
      completedAt: addDays(now, -1),
      createdAt: addDays(now, -8),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Morgan Designer',
    },
    {
      id: 'task-k2',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-design',
      phaseName: 'Design & Selections',
      title: 'Review cabinetry shop drawings',
      status: 'review',
      priority: 'medium',
      dueDate: addDays(now, 4),
      createdAt: addDays(now, -6),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-k3',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-design',
      phaseName: 'Design & Selections',
      title: 'Confirm decorative lighting package',
      description: 'Fixture schedule matches cabinet layout and dimmer zones.',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, 1),
      completedAt: addDays(now, -2),
      createdAt: addDays(now, -7),
      updatedAt: addDays(now, -2),
      assigneeType: 'user',
      assigneeId: 'Morgan Designer',
    },
    {
      id: 'task-k4',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-design',
      phaseName: 'Design & Selections',
      title: 'Capture final owner signoff on countertop slab',
      status: 'in_progress',
      priority: 'medium',
      dueDate: addDays(now, 3),
      createdAt: addDays(now, -3),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-k5',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-demo',
      phaseName: 'Demolition & Prep',
      title: 'Confirm temporary kitchen protection plan',
      description: 'Homeowner staging, protection paths, and dust isolation are signed off.',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, 6),
      completedAt: addDays(now, -1),
      createdAt: addDays(now, -4),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Jordan Field Lead',
    },
    {
      id: 'task-k6',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-demo',
      phaseName: 'Demolition & Prep',
      title: 'Finalize demo-day dumpster and haul-off logistics',
      status: 'todo',
      priority: 'medium',
      dueDate: addDays(now, 7),
      createdAt: addDays(now, -2),
      updatedAt: addDays(now, -2),
      assigneeType: 'user',
      assigneeId: 'Jordan Field Lead',
    },
    {
      id: 'task-k7',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-demo',
      phaseName: 'Demolition & Prep',
      title: 'Verify framing scope at the pantry wall opening',
      status: 'review',
      priority: 'medium',
      dueDate: addDays(now, 8),
      createdAt: addDays(now, -1),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-k8',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-install',
      phaseName: 'Cabinetry & Finish Install',
      title: 'Coordinate countertop field measure',
      description: 'Template visit is booked after cabinet set and sink base confirmation.',
      status: 'completed',
      priority: 'high',
      dueDate: addDays(now, 22),
      completedAt: addDays(now, -2),
      createdAt: addDays(now, -4),
      updatedAt: addDays(now, -2),
      assigneeType: 'user',
      assigneeId: 'Morgan Designer',
    },
    {
      id: 'task-k9',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-install',
      phaseName: 'Cabinetry & Finish Install',
      title: 'Release cabinet hardware order',
      status: 'in_progress',
      priority: 'medium',
      dueDate: addDays(now, 18),
      createdAt: addDays(now, -2),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Morgan Designer',
    },
    {
      id: 'task-k10',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-install',
      phaseName: 'Cabinetry & Finish Install',
      title: 'Schedule appliance delivery window',
      status: 'todo',
      priority: 'medium',
      dueDate: addDays(now, 24),
      createdAt: addDays(now, -1),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-k11',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-install',
      phaseName: 'Cabinetry & Finish Install',
      title: 'Confirm backsplash layout with owner',
      status: 'review',
      priority: 'low',
      dueDate: addDays(now, 26),
      createdAt: addDays(now, -1),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Morgan Designer',
    },
    {
      id: 'task-k12',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-punch',
      phaseName: 'Punch & Closeout',
      title: 'Draft homeowner closeout checklist',
      description: 'Warranty, care guides, and final walkthrough notes are pre-assembled.',
      status: 'completed',
      priority: 'low',
      dueDate: addDays(now, 48),
      completedAt: addDays(now, -1),
      createdAt: addDays(now, -2),
      updatedAt: addDays(now, -1),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-k13',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-punch',
      phaseName: 'Punch & Closeout',
      title: 'Schedule final electrician trim walkthrough',
      status: 'todo',
      priority: 'medium',
      dueDate: addDays(now, 50),
      createdAt: addDays(now, 0),
      updatedAt: addDays(now, 0),
      assigneeType: 'user',
      assigneeId: 'Jordan Field Lead',
    },
    {
      id: 'task-k14',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-punch',
      phaseName: 'Punch & Closeout',
      title: 'Assemble warranty packet template',
      status: 'review',
      priority: 'low',
      dueDate: addDays(now, 52),
      createdAt: addDays(now, 0),
      updatedAt: addDays(now, 0),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-t1',
      userId: DEV_USER_ID,
      projectId: 'proj-tenant',
      phaseId: 'phase-tenant-demo',
      phaseName: 'Demo & Prep',
      title: 'Complete selective demolition',
      status: 'completed',
      priority: 'high',
      dueDate: addDays(now, -160),
      completedAt: addDays(now, -158),
      createdAt: addDays(now, -175),
      updatedAt: addDays(now, -158),
      assigneeType: 'user',
      assigneeId: 'Jordan Field Lead',
    },
    {
      id: 'task-t1b',
      userId: DEV_USER_ID,
      projectId: 'proj-tenant',
      phaseId: 'phase-tenant-demo',
      phaseName: 'Demo & Prep',
      title: 'Patch slab cuts and prep for new fixtures',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, -150),
      completedAt: addDays(now, -149),
      createdAt: addDays(now, -168),
      updatedAt: addDays(now, -149),
      assigneeType: 'user',
      assigneeId: 'Casey Superintendent',
    },
    {
      id: 'task-t2',
      userId: DEV_USER_ID,
      projectId: 'proj-tenant',
      phaseId: 'phase-tenant-build',
      phaseName: 'Build-Out',
      title: 'Complete lighting controls commissioning',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, -45),
      completedAt: addDays(now, -44),
      createdAt: addDays(now, -72),
      updatedAt: addDays(now, -44),
      assigneeType: 'user',
      assigneeId: 'Casey Superintendent',
    },
    {
      id: 'task-t2b',
      userId: DEV_USER_ID,
      projectId: 'proj-tenant',
      phaseId: 'phase-tenant-build',
      phaseName: 'Build-Out',
      title: 'Finish HVAC air balance and diffusers tuning',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, -38),
      completedAt: addDays(now, -37),
      createdAt: addDays(now, -61),
      updatedAt: addDays(now, -37),
      assigneeType: 'user',
      assigneeId: 'Casey Superintendent',
    },
    {
      id: 'task-t2c',
      userId: DEV_USER_ID,
      projectId: 'proj-tenant',
      phaseId: 'phase-tenant-build',
      phaseName: 'Build-Out',
      title: 'Complete storefront patch and final paint',
      status: 'completed',
      priority: 'low',
      dueDate: addDays(now, -34),
      completedAt: addDays(now, -33),
      createdAt: addDays(now, -54),
      updatedAt: addDays(now, -33),
      assigneeType: 'user',
      assigneeId: 'Jordan Field Lead',
    },
    {
      id: 'task-t3',
      userId: DEV_USER_ID,
      projectId: 'proj-tenant',
      phaseId: 'phase-tenant-close',
      phaseName: 'Closeout',
      title: 'Deliver closeout binder and warranty log',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, -20),
      completedAt: addDays(now, -20),
      createdAt: addDays(now, -28),
      updatedAt: addDays(now, -20),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
    {
      id: 'task-t3b',
      userId: DEV_USER_ID,
      projectId: 'proj-tenant',
      phaseId: 'phase-tenant-close',
      phaseName: 'Closeout',
      title: 'Complete owner turnover walkthrough',
      status: 'completed',
      priority: 'medium',
      dueDate: addDays(now, -21),
      completedAt: addDays(now, -21),
      createdAt: addDays(now, -26),
      updatedAt: addDays(now, -21),
      assigneeType: 'user',
      assigneeId: 'Avery PM',
    },
  ];

  const bids: Bid[] = [
    withPaymentProgress({
      id: 'bid-hillside-foundation',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-site',
      phaseName: 'Site Work & Foundation',
      projectName: 'Hillside Custom Home',
      subcontractorId: 'sub-foundation',
      subcontractorName: 'Summit Foundations',
      title: 'Foundation and retaining wall package',
      scope: 'Excavation support, footings, stem walls, retaining walls, and slab prep.',
      status: 'accepted',
      priority: 'high',
      submissionDeadline: addDays(now, -20),
      startDate: addDays(now, -18),
      completionDate: addDays(now, 12),
      totalAmount: 76000,
      timeline: 28,
      paymentTerms: '30% mobilization, 40% wall completion, 30% inspection signoff',
      currentVersionId: 'bid-hillside-foundation-v1',
      versions: [
        {
          id: 'bid-hillside-foundation-v1',
          versionNumber: 1,
          createdAt: addDays(now, -21),
          totalAmount: 76000,
          notes: 'Accepted after alternate retaining wall value engineering.',
          lineItems: [
            { id: 'bf1-li1', description: 'Footings and rebar', category: 'labor', quantity: 1, unit: 'lot', unitCost: 28000, totalCost: 28000 },
            { id: 'bf1-li2', description: 'Retaining wall concrete', category: 'material', quantity: 1, unit: 'lot', unitCost: 48000, totalCost: 48000 },
          ],
          attachments: ['foundation-bid-v1.pdf'],
        },
      ],
      tags: ['foundation', 'critical-path'],
      createdAt: addDays(now, -21),
      updatedAt: addDays(now, -6),
      createdBy: DEV_USER_ID,
      updatedBy: DEV_USER_ID,
      notes: 'Crew is available to hold schedule if inspection clears on time.',
      requiresInsurance: true,
      requiresBond: false,
      isPublic: false,
      isApproved: true,
      attachments: [{ name: 'foundation-bid.pdf', url: '/dev-assets/foundation-bid.pdf' }],
      paymentSchedule: [
        {
          id: 'stage-foundation-1',
          name: 'Mobilization',
          description: 'Excavation mobilization and layout',
          percentage: 30,
          amount: 22800,
          dueDate: addDays(now, -15),
          phaseId: 'phase-hillside-site',
          phaseName: 'Site Work & Foundation',
          status: 'paid',
          paidAmount: 22800,
          createdAt: addDays(now, -20),
          updatedAt: addDays(now, -14),
          paymentDate: addDays(now, -14),
          expenseId: 'expense-hillside-grading',
        },
        {
          id: 'stage-foundation-2',
          name: 'Walls complete',
          description: 'Stem walls and retaining wall complete',
          percentage: 40,
          amount: 30400,
          dueDate: addDays(now, 8),
          phaseId: 'phase-hillside-site',
          phaseName: 'Site Work & Foundation',
          status: 'pending',
          paidAmount: 0,
          createdAt: addDays(now, -20),
          updatedAt: addDays(now, -10),
        },
        {
          id: 'stage-foundation-3',
          name: 'Inspection signoff',
          description: 'Final payment after foundation inspection',
          percentage: 30,
          amount: 22800,
          dueDate: addDays(now, 16),
          phaseId: 'phase-hillside-site',
          phaseName: 'Site Work & Foundation',
          status: 'pending',
          paidAmount: 0,
          createdAt: addDays(now, -20),
          updatedAt: addDays(now, -10),
        },
      ],
    }),
    withPaymentProgress({
      id: 'bid-hillside-electrical',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-mep',
      phaseName: 'Rough-In Mechanical Systems',
      projectName: 'Hillside Custom Home',
      subcontractorId: 'sub-electrical',
      subcontractorName: 'Blue Arc Electric',
      title: 'Electrical rough-in and finish package',
      scope: 'Main service, rough wiring, fixtures, and smart lighting controls.',
      status: 'accepted',
      priority: 'high',
      submissionDeadline: addDays(now, -9),
      startDate: addDays(now, 58),
      completionDate: addDays(now, 188),
      totalAmount: 48000,
      timeline: 36,
      paymentTerms: '25% deposit, 50% rough complete, 25% trim-out',
      currentVersionId: 'bid-hillside-electrical-v1',
      versions: [
        {
          id: 'bid-hillside-electrical-v1',
          versionNumber: 1,
          createdAt: addDays(now, -9),
          totalAmount: 48000,
          notes: 'Includes owner lighting allowance coordination.',
          lineItems: [
            { id: 'be1-li1', description: 'Rough wiring', category: 'labor', quantity: 1, unit: 'package', unitCost: 32000, totalCost: 32000 },
            { id: 'be1-li2', description: 'Fixtures and controls', category: 'material', quantity: 1, unit: 'package', unitCost: 16000, totalCost: 16000 },
          ],
        },
      ],
      tags: ['electrical', 'rough-in'],
      createdAt: addDays(now, -9),
      updatedAt: addDays(now, -2),
      createdBy: DEV_USER_ID,
      updatedBy: DEV_USER_ID,
      requiresInsurance: true,
      requiresBond: false,
      isApproved: true,
      attachments: [{ name: 'electrical-scope.pdf', url: '/dev-assets/electrical-scope.pdf' }],
      paymentSchedule: [
        {
          id: 'stage-electrical-1',
          name: 'Deposit',
          description: 'Procurement deposit',
          percentage: 25,
          amount: 12000,
          dueDate: addDays(now, -1),
          phaseId: 'phase-hillside-mep',
          phaseName: 'Rough-In Mechanical Systems',
          status: 'paid',
          paidAmount: 12000,
          createdAt: addDays(now, -9),
          updatedAt: addDays(now, -1),
          paymentDate: addDays(now, -1),
          expenseId: 'expense-hillside-electrical-deposit',
        },
        {
          id: 'stage-electrical-2',
          name: 'Rough complete',
          description: 'Release after rough inspection',
          percentage: 50,
          amount: 24000,
          dueDate: addDays(now, 82),
          phaseId: 'phase-hillside-mep',
          phaseName: 'Rough-In Mechanical Systems',
          status: 'pending',
          paidAmount: 0,
          createdAt: addDays(now, -9),
          updatedAt: addDays(now, -2),
        },
        {
          id: 'stage-electrical-3',
          name: 'Trim-out',
          description: 'Final release after fixture install',
          percentage: 25,
          amount: 12000,
          dueDate: addDays(now, 182),
          phaseId: 'phase-hillside-finish',
          phaseName: 'Interior Finishing',
          status: 'pending',
          paidAmount: 0,
          createdAt: addDays(now, -9),
          updatedAt: addDays(now, -2),
        },
      ],
    }),
    {
      id: 'bid-hillside-framing',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      phaseId: 'phase-hillside-framing',
      phaseName: 'Framing',
      projectName: 'Hillside Custom Home',
      subcontractorId: 'sub-framing',
      subcontractorName: 'Peak Framing Co.',
      title: 'Structural framing package',
      scope: 'Wall framing, floor system, roof framing, and sheathing labor.',
      status: 'submitted',
      priority: 'high',
      submissionDeadline: addDays(now, 6),
      totalAmount: 92000,
      timeline: 30,
      paymentTerms: 'Net 10 from weekly progress invoices',
      currentVersionId: 'bid-hillside-framing-v1',
      versions: [
        {
          id: 'bid-hillside-framing-v1',
          versionNumber: 1,
          createdAt: addDays(now, -4),
          totalAmount: 92000,
          notes: 'Awaiting crew availability confirmation.',
          lineItems: [
            { id: 'bfr-li1', description: 'Framing labor', category: 'labor', quantity: 1, unit: 'package', unitCost: 92000, totalCost: 92000 },
          ],
        },
      ],
      tags: ['framing'],
      createdAt: addDays(now, -4),
      updatedAt: addDays(now, -4),
      createdBy: DEV_USER_ID,
      updatedBy: DEV_USER_ID,
      requiresInsurance: true,
      requiresBond: false,
      isApproved: false,
      attachments: [{ name: 'framing-bid.pdf', url: '/dev-assets/framing-bid.pdf' }],
    },
    withPaymentProgress({
      id: 'bid-kitchen-cabinetry',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-install',
      phaseName: 'Cabinetry & Finish Install',
      projectName: 'Maple Street Kitchen Remodel',
      subcontractorId: 'sub-cabinetry',
      subcontractorName: 'Northline Cabinetry',
      title: 'Cabinet fabrication and install',
      scope: 'Shop drawings, finish samples, fabrication, install, and punch.',
      status: 'accepted',
      priority: 'medium',
      submissionDeadline: addDays(now, -12),
      startDate: addDays(now, 18),
      completionDate: addDays(now, 44),
      totalAmount: 28000,
      timeline: 18,
      paymentTerms: '30% deposit, 70% on install completion',
      currentVersionId: 'bid-kitchen-cabinetry-v1',
      versions: [
        {
          id: 'bid-kitchen-cabinetry-v1',
          versionNumber: 1,
          createdAt: addDays(now, -12),
          totalAmount: 28000,
          notes: 'Includes satin lacquer finish upgrade.',
          lineItems: [
            { id: 'bkc-li1', description: 'Custom cabinet package', category: 'subcontractor', quantity: 1, unit: 'package', unitCost: 28000, totalCost: 28000 },
          ],
        },
      ],
      tags: ['cabinetry', 'owner-allowance'],
      createdAt: addDays(now, -12),
      updatedAt: addDays(now, -4),
      createdBy: DEV_USER_ID,
      updatedBy: DEV_USER_ID,
      requiresInsurance: false,
      requiresBond: false,
      isApproved: true,
      attachments: [{ name: 'cabinet-schedule.pdf', url: '/dev-assets/cabinet-schedule.pdf' }],
      paymentSchedule: [
        {
          id: 'stage-cabinetry-1',
          name: 'Deposit',
          description: 'Fabrication deposit',
          percentage: 30,
          amount: 8400,
          dueDate: addDays(now, -8),
          phaseId: 'phase-kitchen-design',
          phaseName: 'Design & Selections',
          status: 'paid',
          paidAmount: 8400,
          createdAt: addDays(now, -12),
          updatedAt: addDays(now, -8),
          paymentDate: addDays(now, -8),
          expenseId: 'expense-kitchen-cabinet-deposit',
        },
        {
          id: 'stage-cabinetry-2',
          name: 'Install completion',
          description: 'Release after final install and punch',
          percentage: 70,
          amount: 19600,
          dueDate: addDays(now, 42),
          phaseId: 'phase-kitchen-install',
          phaseName: 'Cabinetry & Finish Install',
          status: 'pending',
          paidAmount: 0,
          createdAt: addDays(now, -12),
          updatedAt: addDays(now, -4),
        },
      ],
    }),
    {
      id: 'bid-kitchen-plumbing',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      phaseId: 'phase-kitchen-install',
      phaseName: 'Cabinetry & Finish Install',
      projectName: 'Maple Street Kitchen Remodel',
      subcontractorId: 'sub-plumbing',
      subcontractorName: 'Copper Creek Plumbing',
      title: 'Kitchen plumbing fixture package',
      scope: 'Sink relocation, disposal, faucet install, and final trim.',
      status: 'draft',
      priority: 'medium',
      submissionDeadline: addDays(now, 9),
      totalAmount: 17200,
      timeline: 6,
      currentVersionId: 'bid-kitchen-plumbing-v1',
      versions: [
        {
          id: 'bid-kitchen-plumbing-v1',
          versionNumber: 1,
          createdAt: addDays(now, -8),
          totalAmount: 17200,
          notes: 'Draft pending final appliance cut sheet.',
          lineItems: [
            { id: 'bkp-li1', description: 'Fixture rough and trim', category: 'labor', quantity: 1, unit: 'package', unitCost: 17200, totalCost: 17200 },
          ],
        },
      ],
      tags: ['plumbing'],
      createdAt: addDays(now, -8),
      updatedAt: addDays(now, -5),
      createdBy: DEV_USER_ID,
      updatedBy: DEV_USER_ID,
      requiresInsurance: false,
      requiresBond: false,
      isApproved: false,
      attachments: [],
    },
    withPaymentProgress({
      id: 'bid-tenant-hvac',
      userId: DEV_USER_ID,
      projectId: 'proj-tenant',
      phaseId: 'phase-tenant-build',
      phaseName: 'Build-Out',
      projectName: 'Riverside Retail Tenant Improvement',
      subcontractorId: 'sub-hvac',
      subcontractorName: 'AirGrid Mechanical',
      title: 'HVAC modification and balance',
      scope: 'Duct modifications, rooftop tie-in, test and balance.',
      status: 'accepted',
      priority: 'medium',
      submissionDeadline: addDays(now, -110),
      startDate: addDays(now, -118),
      completionDate: addDays(now, -35),
      totalAmount: 22500,
      timeline: 21,
      currentVersionId: 'bid-tenant-hvac-v1',
      versions: [
        {
          id: 'bid-tenant-hvac-v1',
          versionNumber: 1,
          createdAt: addDays(now, -118),
          totalAmount: 22500,
          notes: 'Closed out with minor balancing retainage release.',
          lineItems: [
            { id: 'bth-li1', description: 'HVAC modification package', category: 'subcontractor', quantity: 1, unit: 'package', unitCost: 22500, totalCost: 22500 },
          ],
        },
      ],
      tags: ['hvac', 'complete'],
      createdAt: addDays(now, -118),
      updatedAt: addDays(now, -28),
      createdBy: DEV_USER_ID,
      updatedBy: DEV_USER_ID,
      requiresInsurance: true,
      requiresBond: false,
      isApproved: true,
      attachments: [],
      paymentSchedule: [
        {
          id: 'stage-tenant-hvac-1',
          name: 'Install complete',
          description: 'Release on install completion',
          percentage: 70,
          amount: 15750,
          dueDate: addDays(now, -60),
          phaseId: 'phase-tenant-build',
          phaseName: 'Build-Out',
          status: 'paid',
          paidAmount: 15750,
          createdAt: addDays(now, -118),
          updatedAt: addDays(now, -58),
          paymentDate: addDays(now, -58),
          expenseId: 'expense-tenant-hvac',
        },
        {
          id: 'stage-tenant-hvac-2',
          name: 'Balance and closeout',
          description: 'Final release after TAB and closeout',
          percentage: 30,
          amount: 6750,
          dueDate: addDays(now, -28),
          phaseId: 'phase-tenant-close',
          phaseName: 'Closeout',
          status: 'paid',
          paidAmount: 6750,
          createdAt: addDays(now, -118),
          updatedAt: addDays(now, -26),
          paymentDate: addDays(now, -26),
        },
      ],
    }),
  ];

  const expenses: Expense[] = [
    {
      id: 'expense-hillside-permit',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      projectName: 'Hillside Custom Home',
      phaseId: 'phase-hillside-pre',
      phaseName: 'Pre-Construction',
      category: 'permits',
      description: 'County permit and impact fees',
      amount: 12500,
      amountPaid: 12500,
      amountRemaining: 0,
      date: addDays(now, -29),
      vendor: 'Boulder County',
      status: 'paid',
      createdBy: DEV_USER_ID,
      createdAt: addDays(now, -30),
      updatedAt: addDays(now, -29),
      paymentDetails: { method: 'bank_transfer', date: toDateString(addDays(now, -29)), referenceNumber: 'PERMIT-2217' },
      tags: ['permit'],
    },
    {
      id: 'expense-hillside-grading',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      projectName: 'Hillside Custom Home',
      phaseId: 'phase-hillside-site',
      phaseName: 'Site Work & Foundation',
      category: 'subcontractor',
      description: 'Foundation mobilization and initial grading invoice',
      amount: 22800,
      amountPaid: 22800,
      amountRemaining: 0,
      date: addDays(now, -14),
      vendor: 'Summit Foundations',
      subcontractorId: 'sub-foundation',
      subcontractorName: 'Summit Foundations',
      status: 'paid',
      createdBy: DEV_USER_ID,
      createdAt: addDays(now, -14),
      updatedAt: addDays(now, -14),
      bidId: 'bid-hillside-foundation',
      paymentStageId: 'stage-foundation-1',
      paymentDetails: { method: 'check', date: toDateString(addDays(now, -14)), referenceNumber: 'CHK-8421' },
      tags: ['foundation'],
    },
    {
      id: 'expense-hillside-electrical-deposit',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      projectName: 'Hillside Custom Home',
      phaseId: 'phase-hillside-mep',
      phaseName: 'Rough-In Mechanical Systems',
      category: 'subcontractor',
      description: 'Electrical procurement deposit',
      amount: 12000,
      amountPaid: 12000,
      amountRemaining: 0,
      date: addDays(now, -1),
      vendor: 'Blue Arc Electric',
      subcontractorId: 'sub-electrical',
      subcontractorName: 'Blue Arc Electric',
      status: 'paid',
      createdBy: DEV_USER_ID,
      createdAt: addDays(now, -1),
      updatedAt: addDays(now, -1),
      bidId: 'bid-hillside-electrical',
      paymentStageId: 'stage-electrical-1',
      paymentDetails: { method: 'bank_transfer', date: toDateString(addDays(now, -1)), referenceNumber: 'ACH-1188' },
      tags: ['electrical'],
    },
    {
      id: 'expense-hillside-lumber',
      userId: DEV_USER_ID,
      projectId: 'proj-hillside',
      projectName: 'Hillside Custom Home',
      phaseId: 'phase-hillside-framing',
      phaseName: 'Framing',
      category: 'materials',
      description: 'Initial lumber package deposit',
      amount: 38500,
      amountPaid: 0,
      amountRemaining: 38500,
      date: addDays(now, 3),
      dueDate: addDays(now, 12),
      vendor: 'Front Range Lumber',
      status: 'approved',
      createdBy: DEV_USER_ID,
      createdAt: addDays(now, -1),
      updatedAt: addDays(now, -1),
      tags: ['framing', 'materials'],
    },
    {
      id: 'expense-kitchen-design',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      projectName: 'Maple Street Kitchen Remodel',
      phaseId: 'phase-kitchen-design',
      phaseName: 'Design & Selections',
      category: 'labor',
      description: 'Design retainer and field measurements',
      amount: 4500,
      amountPaid: 4500,
      amountRemaining: 0,
      date: addDays(now, -8),
      vendor: 'Studio Interior',
      status: 'paid',
      createdBy: DEV_USER_ID,
      createdAt: addDays(now, -8),
      updatedAt: addDays(now, -8),
      paymentDetails: { method: 'credit_card', date: toDateString(addDays(now, -8)), referenceNumber: 'CC-9923' },
      tags: ['design'],
    },
    {
      id: 'expense-kitchen-cabinet-deposit',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      projectName: 'Maple Street Kitchen Remodel',
      phaseId: 'phase-kitchen-design',
      phaseName: 'Design & Selections',
      category: 'subcontractor',
      description: 'Cabinet fabrication deposit',
      amount: 8400,
      amountPaid: 8400,
      amountRemaining: 0,
      date: addDays(now, -8),
      vendor: 'Northline Cabinetry',
      subcontractorId: 'sub-cabinetry',
      subcontractorName: 'Northline Cabinetry',
      status: 'paid',
      createdBy: DEV_USER_ID,
      createdAt: addDays(now, -8),
      updatedAt: addDays(now, -8),
      bidId: 'bid-kitchen-cabinetry',
      paymentStageId: 'stage-cabinetry-1',
      paymentDetails: { method: 'bank_transfer', date: toDateString(addDays(now, -8)), referenceNumber: 'ACH-4490' },
      tags: ['cabinetry'],
    },
    {
      id: 'expense-kitchen-demo',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      projectName: 'Maple Street Kitchen Remodel',
      phaseId: 'phase-kitchen-demo',
      phaseName: 'Demolition & Prep',
      category: 'labor',
      description: 'Selective demolition labor hold',
      amount: 6200,
      amountPaid: 0,
      amountRemaining: 6200,
      date: addDays(now, 8),
      dueDate: addDays(now, 14),
      vendor: 'InHouse Labor',
      status: 'approved',
      createdBy: DEV_USER_ID,
      createdAt: addDays(now, -2),
      updatedAt: addDays(now, -2),
      tags: ['demo'],
    },
    {
      id: 'expense-kitchen-appliances',
      userId: DEV_USER_ID,
      projectId: 'proj-kitchen',
      projectName: 'Maple Street Kitchen Remodel',
      phaseId: 'phase-kitchen-install',
      phaseName: 'Cabinetry & Finish Install',
      category: 'materials',
      description: 'Appliance allowance placeholder',
      amount: 15000,
      amountPaid: 0,
      amountRemaining: 15000,
      date: addDays(now, 20),
      dueDate: addDays(now, 28),
      vendor: 'Appliance Gallery',
      status: 'pending',
      createdBy: DEV_USER_ID,
      createdAt: addDays(now, -1),
      updatedAt: addDays(now, -1),
      tags: ['appliances'],
    },
    {
      id: 'expense-tenant-hvac',
      userId: DEV_USER_ID,
      projectId: 'proj-tenant',
      projectName: 'Riverside Retail Tenant Improvement',
      phaseId: 'phase-tenant-build',
      phaseName: 'Build-Out',
      category: 'subcontractor',
      description: 'HVAC install completion invoice',
      amount: 15750,
      amountPaid: 15750,
      amountRemaining: 0,
      date: addDays(now, -58),
      vendor: 'AirGrid Mechanical',
      subcontractorId: 'sub-hvac',
      subcontractorName: 'AirGrid Mechanical',
      status: 'paid',
      createdBy: DEV_USER_ID,
      createdAt: addDays(now, -58),
      updatedAt: addDays(now, -58),
      bidId: 'bid-tenant-hvac',
      paymentStageId: 'stage-tenant-hvac-1',
      paymentDetails: { method: 'bank_transfer', date: toDateString(addDays(now, -58)), referenceNumber: 'ACH-2201' },
      tags: ['hvac'],
    },
    {
      id: 'expense-tenant-closeout',
      userId: DEV_USER_ID,
      projectId: 'proj-tenant',
      projectName: 'Riverside Retail Tenant Improvement',
      phaseId: 'phase-tenant-close',
      phaseName: 'Closeout',
      category: 'other',
      description: 'Final closeout printing and merchandising handoff',
      amount: 3200,
      amountPaid: 3200,
      amountRemaining: 0,
      date: addDays(now, -19),
      vendor: 'Project Admin',
      status: 'paid',
      createdBy: DEV_USER_ID,
      createdAt: addDays(now, -19),
      updatedAt: addDays(now, -19),
      paymentDetails: { method: 'credit_card', date: toDateString(addDays(now, -19)), referenceNumber: 'CC-2109' },
      tags: ['closeout'],
    },
  ];

  return {
    version: DEV_DATA_VERSION,
    projects,
    tasks,
    bids,
    expenses,
    subcontractors,
  };
};

const loadState = (): DevDataState => {
  if (memoryState) {
    return memoryState;
  }

  const raw = readStorage();
  if (!raw) {
    const seeded = createSeedState();
    writeStorage(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as DevDataState;
    if (parsed.version !== DEV_DATA_VERSION) {
      const reseeded = createSeedState();
      writeStorage(reseeded);
      return reseeded;
    }
    memoryState = parsed;
    return parsed;
  } catch {
    const reseeded = createSeedState();
    writeStorage(reseeded);
    return reseeded;
  }
};

const saveState = (state: DevDataState) => {
  writeStorage(state);
};

const getHydratedState = (): DevDataState => {
  const raw = loadState();
  const tasks = raw.tasks.map(hydrateTask);
  const bids = raw.bids.map(hydrateBid);
  const expenses = raw.expenses.map(hydrateExpense);
  const subcontractors = raw.subcontractors.map(hydrateSubcontractor);

  const projects = raw.projects.map((project) => {
    const hydratedProject = hydrateProject(project);
    const projectTasks = sortByDateDesc(
      tasks.filter((task) => task.projectId === hydratedProject.id),
      (task) => asDate(task.dueDate) || asDate(task.updatedAt)
    );
    const projectBids = sortByDateDesc(
      bids.filter((bid) => bid.projectId === hydratedProject.id),
      (bid) => asDate(bid.updatedAt)
    );
    const projectExpenses = sortByDateDesc(
      expenses.filter((expense) => expense.projectId === hydratedProject.id),
      (expense) => asDate(expense.date)
    );
    const spent = projectExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const totalBudget =
      typeof hydratedProject.budget === 'number'
        ? hydratedProject.budget
        : hydratedProject.budget.total;

    const phases = hydratedProject.phases.map((phase) => {
      const phaseTasks = projectTasks.filter((task) => task.phaseId === phase.id);
      const phaseExpenses = projectExpenses.filter((expense) => expense.phaseId === phase.id);
      const completedTasks = phaseTasks.filter((task) => task.status === 'completed').length;
      const progress = phaseTasks.length
        ? Math.round((completedTasks / phaseTasks.length) * 100)
        : phase.progress || 0;

      return {
        ...phase,
        tasks: phaseTasks,
        actualCost: phaseExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0),
        progress,
      };
    });

    const completedProjectTasks = projectTasks.filter(
      (task) => task.status === 'completed'
    ).length;
    const progress = projectTasks.length
      ? Math.round((completedProjectTasks / projectTasks.length) * 100)
      : hydratedProject.progress || 0;

    return {
      ...hydratedProject,
      phases,
      tasks: projectTasks,
      bids: projectBids,
      expenses: projectExpenses,
      actualCost: spent,
      budget:
        typeof hydratedProject.budget === 'number'
          ? { total: totalBudget, spent, remaining: totalBudget - spent }
          : {
              ...hydratedProject.budget,
              total: totalBudget,
              spent,
              remaining: totalBudget - spent,
            },
      progress,
    };
  });

  return {
    ...raw,
    projects,
    tasks,
    bids,
    expenses,
    subcontractors,
  };
};

export const ensureDevDataSeeded = () => {
  getHydratedState();
};

const updateState = (updater: (state: DevDataState) => DevDataState) => {
  const nextState = updater(loadState());
  saveState(nextState);
  return getHydratedState();
};

export const resetDevDataSeed = () => {
  const seeded = createSeedState();
  saveState(seeded);
  return getHydratedState();
};

export const listDevProjects = (userId: string, filters?: {
  status?: Project['status'];
  clientId?: string;
  startDate?: Date | null;
  endDate?: Date | null;
}) => {
  const state = getHydratedState();
  return state.projects
    .filter((project) => project.userId === userId)
    .filter((project) => !filters?.status || project.status === filters.status)
    .filter((project) => !filters?.clientId || project.clientId === filters.clientId)
    .filter((project) => !filters?.startDate || (project.startDate && project.startDate >= filters.startDate))
    .filter((project) => !filters?.endDate || (!!project.endDate && project.endDate <= filters.endDate))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getDevProjectById = (projectId: string) =>
  getHydratedState().projects.find((project) => project.id === projectId) || null;

export const createDevProject = (userId: string, projectData: Partial<Project>) => {
  const now = new Date();
  const projectId = projectData.id || uuidv4();
  const project: Project = {
    id: projectId,
    userId,
    name: projectData.name || 'Untitled Project',
    description: projectData.description || '',
    status: projectData.status || 'draft',
    priority: projectData.priority || 'medium',
    startDate: asDate(projectData.startDate) || new Date(),
    endDate: asDate(projectData.endDate) || null,
    budget:
      typeof projectData.budget === 'number'
        ? { total: projectData.budget, spent: 0, remaining: projectData.budget }
        : projectData.budget || { total: 0, spent: 0, remaining: 0 },
    actualCost: 0,
    location:
      typeof projectData.location === 'string'
        ? { address: projectData.location, city: '', state: '', zipCode: '' }
        : projectData.location || { address: '', city: '', state: '', zipCode: '' },
    createdAt: now,
    updatedAt: now,
    team: projectData.team || [],
    projectType: projectData.projectType,
    estimatedDuration: projectData.estimatedDuration,
    phases: (projectData.phases as ProjectPhase[]) || [],
    keyMilestones: projectData.keyMilestones || [],
    requirements: projectData.requirements || { permits: [], inspections: [], documents: [] },
    lineItems: projectData.lineItems || [],
    tasks: [],
    bids: [],
    expenses: [],
    projections: projectData.projections || [],
    progress: projectData.progress || 0,
    clientId: projectData.clientId,
    contractorId: projectData.contractorId,
  };

  const state = updateState((current) => ({
    ...current,
    projects: [...current.projects, project],
  }));
  return state.projects.find((item) => item.id === projectId)!;
};

export const updateDevProject = (projectId: string, projectData: Partial<Project>) => {
  const hydrated = getHydratedState();
  const existing = hydrated.projects.find((project) => project.id === projectId);
  if (!existing) return null;

  const incomingTasks = (projectData.tasks || []).map((task) => ({
    ...hydrateTask(task),
    projectId,
  }));

  const incomingPhaseTasks = (projectData.phases || [])
    .flatMap((phase) => (phase.tasks || []).map((task) => ({
      ...hydrateTask(task),
      projectId,
      phaseId: phase.id,
      phaseName: phase.name,
    })));

  const nextTasks =
    incomingTasks.length > 0
      ? [...hydrated.tasks.filter((task) => task.projectId !== projectId), ...incomingTasks]
      : incomingPhaseTasks.length > 0
      ? [
          ...hydrated.tasks.filter(
            (task) =>
              task.projectId !== projectId ||
              !incomingPhaseTasks.some((incoming) => incoming.id === task.id)
          ),
          ...incomingPhaseTasks,
        ]
      : hydrated.tasks;

  const strippedPhases = (projectData.phases as ProjectPhase[] | undefined)?.map((phase) => ({
    ...phase,
    tasks: [],
  }));

  const updatedProject: Project = {
    ...existing,
    ...projectData,
    id: projectId,
    userId: existing.userId,
    startDate: asDate(projectData.startDate) || existing.startDate,
    endDate:
      projectData.endDate === null
        ? null
        : asDate(projectData.endDate) || existing.endDate,
    updatedAt: new Date(),
    phases: strippedPhases || existing.phases,
  };

  const state = updateState((current) => ({
    ...current,
    tasks: nextTasks,
    projects: current.projects.map((project) =>
      project.id === projectId ? updatedProject : project
    ),
  }));
  return state.projects.find((project) => project.id === projectId) || null;
};

export const deleteDevProject = (projectId: string) => {
  updateState((current) => ({
    ...current,
    projects: current.projects.filter((project) => project.id !== projectId),
    tasks: current.tasks.filter((task) => task.projectId !== projectId),
    bids: current.bids.filter((bid) => bid.projectId !== projectId),
    expenses: current.expenses.filter((expense) => expense.projectId !== projectId),
  }));
};

export const listDevTasks = (userId: string, filters?: {
  projectId?: string;
  status?: Task['status'];
  assigneeId?: string;
  priority?: Task['priority'];
  sortBy?: keyof Omit<Task, 'id'>;
  sortDirection?: 'asc' | 'desc';
}) => {
  const tasks = getHydratedState().tasks
    .filter((task) => task.userId === userId)
    .filter((task) => !filters?.projectId || task.projectId === filters.projectId)
    .filter((task) => !filters?.status || task.status === filters.status)
    .filter((task) => !filters?.assigneeId || task.assigneeId === filters.assigneeId)
    .filter((task) => !filters?.priority || task.priority === filters.priority);

  const sortBy = filters?.sortBy || 'createdAt';
  const sortDirection = filters?.sortDirection || 'desc';

  return [...tasks].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    if (aValue instanceof Date && bValue instanceof Date) {
      return direction * (aValue.getTime() - bValue.getTime());
    }
    return direction * String(aValue || '').localeCompare(String(bValue || ''));
  });
};

export const getDevTask = (userId: string, taskId: string) =>
  getHydratedState().tasks.find((task) => task.id === taskId && task.userId === userId) ||
  null;

export const createDevTask = (
  userId: string,
  taskData: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) => {
  const now = new Date();
  const task: Task = {
    ...taskData,
    id: uuidv4(),
    userId,
    createdAt: now,
    updatedAt: now,
    dueDate: asDate(taskData.dueDate) || null,
    completedAt: asDate(taskData.completedAt) || null,
  };

  updateState((current) => ({
    ...current,
    tasks: [...current.tasks, task],
  }));
  return task;
};

export const updateDevTask = (taskId: string, taskData: Partial<Task>) => {
  updateState((current) => ({
    ...current,
    tasks: current.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            ...taskData,
            dueDate:
              taskData.dueDate === null
                ? null
                : asDate(taskData.dueDate) || task.dueDate,
            completedAt:
              taskData.completedAt === null
                ? null
                : asDate(taskData.completedAt) || task.completedAt,
            updatedAt: new Date(),
          }
        : task
    ),
  }));
};

export const deleteDevTask = (taskId: string) => {
  updateState((current) => ({
    ...current,
    tasks: current.tasks.filter((task) => task.id !== taskId),
  }));
};

export const listDevExpenses = (userId: string, filters?: {
  projectId?: string;
  category?: Expense['category'];
  startDate?: Date;
  endDate?: Date;
  status?: Expense['status'] | Expense['status'][];
  phaseId?: string;
  subcontractorId?: string;
}) => {
  return sortByDateDesc(
    getHydratedState().expenses
      .filter((expense) => expense.userId === userId)
      .filter((expense) => !filters?.projectId || expense.projectId === filters.projectId)
      .filter((expense) => !filters?.category || expense.category === filters.category)
      .filter((expense) => !filters?.phaseId || expense.phaseId === filters.phaseId)
      .filter(
        (expense) =>
          !filters?.subcontractorId ||
          expense.subcontractorId === filters.subcontractorId
      )
      .filter((expense) => {
        if (!filters?.status) return true;
        return Array.isArray(filters.status)
          ? filters.status.includes(expense.status)
          : expense.status === filters.status;
      })
      .filter((expense) => !filters?.startDate || (asDate(expense.date) && asDate(expense.date)! >= filters.startDate))
      .filter((expense) => !filters?.endDate || (asDate(expense.date) && asDate(expense.date)! <= filters.endDate)),
    (expense) => asDate(expense.date)
  );
};

export const getDevExpense = (userId: string, expenseId: string) =>
  getHydratedState().expenses.find(
    (expense) => expense.id === expenseId && expense.userId === userId
  ) || null;

export const createDevExpense = (
  userId: string,
  expenseData: Omit<Expense, 'id' | 'userId' | 'createdBy' | 'createdAt' | 'updatedAt'>
) => {
  const now = new Date();
  const project = getDevProjectById(expenseData.projectId);
  const subcontractor = expenseData.subcontractorId
    ? getHydratedState().subcontractors.find(
        (item) => item.id === expenseData.subcontractorId
      )
    : null;

  const expense: Expense = {
    ...expenseData,
    id: uuidv4(),
    userId,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    projectName: expenseData.projectName || project?.name,
    subcontractorName:
      expenseData.subcontractorName || subcontractor?.name || null,
    date: asDate(expenseData.date) || now,
    dueDate: asDate(expenseData.dueDate) || null,
    lastPaymentDate: asDate(expenseData.lastPaymentDate) || null,
    amountPaid: expenseData.amountPaid || 0,
    amountRemaining:
      expenseData.amountRemaining ??
      Math.max((expenseData.amount || 0) - (expenseData.amountPaid || 0), 0),
  };

  updateState((current) => ({
    ...current,
    expenses: [...current.expenses, expense],
  }));
  return expense;
};

export const updateDevExpense = (expenseId: string, expenseData: Partial<Expense>) => {
  updateState((current) => ({
    ...current,
    expenses: current.expenses.map((expense) => {
      if (expense.id !== expenseId) return expense;
      const nextAmount = expenseData.amount ?? expense.amount;
      const nextAmountPaid = expenseData.amountPaid ?? expense.amountPaid ?? 0;
      return {
        ...expense,
        ...expenseData,
        date: asDate(expenseData.date) || asDate(expense.date) || new Date(),
        dueDate:
          expenseData.dueDate === null
            ? null
            : asDate(expenseData.dueDate) || asDate(expense.dueDate) || null,
        lastPaymentDate:
          expenseData.lastPaymentDate === null
            ? null
            : asDate(expenseData.lastPaymentDate) ||
              asDate(expense.lastPaymentDate) ||
              null,
        amountPaid: nextAmountPaid,
        amountRemaining:
          expenseData.amountRemaining ?? Math.max(nextAmount - nextAmountPaid, 0),
        updatedAt: new Date(),
      };
    }),
  }));
};

export const deleteDevExpense = (expenseId: string) => {
  updateState((current) => ({
    ...current,
    expenses: current.expenses.filter((expense) => expense.id !== expenseId),
  }));
};

export const listDevSubcontractors = (userId: string, filters?: {
  specialtyArea?: string;
  companyName?: string;
  active?: boolean;
}) => {
  return getHydratedState().subcontractors
    .filter((subcontractor) => subcontractor.userId === userId)
    .filter(
      (subcontractor) =>
        !filters?.specialtyArea ||
        subcontractor.specialty === filters.specialtyArea
    )
    .filter(
      (subcontractor) =>
        !filters?.companyName ||
        subcontractor.name === filters.companyName
    )
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
};

export const getDevSubcontractor = (userId: string, subcontractorId: string) =>
  getHydratedState().subcontractors.find(
    (subcontractor) =>
      subcontractor.id === subcontractorId && subcontractor.userId === userId
  ) || null;

export const createDevSubcontractor = (
  userId: string,
  subcontractorData: Omit<Subcontractor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) => {
  const now = new Date();
  const subcontractor: Subcontractor = {
    ...subcontractorData,
    id: uuidv4(),
    userId,
    createdAt: now,
    updatedAt: now,
  };

  updateState((current) => ({
    ...current,
    subcontractors: [...current.subcontractors, subcontractor],
  }));
  return subcontractor;
};

export const updateDevSubcontractor = (
  subcontractorId: string,
  subcontractorData: Partial<Subcontractor>
) => {
  updateState((current) => ({
    ...current,
    subcontractors: current.subcontractors.map((subcontractor) =>
      subcontractor.id === subcontractorId
        ? {
            ...subcontractor,
            ...subcontractorData,
            updatedAt: new Date(),
          }
        : subcontractor
    ),
  }));
};

export const deleteDevSubcontractor = (subcontractorId: string) => {
  updateState((current) => ({
    ...current,
    subcontractors: current.subcontractors.filter(
      (subcontractor) => subcontractor.id !== subcontractorId
    ),
  }));
};

export const listDevBids = (
  userId: string,
  filters?: BidFilter,
  sort?: BidSort,
  pageSize = 50
) => {
  let bids = getHydratedState().bids.filter((bid) => bid.userId === userId);
  const minAmount = filters?.minAmount;
  const maxAmount = filters?.maxAmount;

  if (filters?.projectId) bids = bids.filter((bid) => bid.projectId === filters.projectId);
  if (filters?.subcontractorId) {
    bids = bids.filter((bid) => bid.subcontractorId === filters.subcontractorId);
  }
  if (filters?.status) {
    bids = bids.filter((bid) =>
      Array.isArray(filters.status)
        ? filters.status.includes(bid.status)
        : bid.status === filters.status
    );
  }
  if (filters?.priority) bids = bids.filter((bid) => bid.priority === filters.priority);
  if (minAmount !== undefined) bids = bids.filter((bid) => bid.totalAmount >= minAmount);
  if (maxAmount !== undefined) bids = bids.filter((bid) => bid.totalAmount <= maxAmount);
  if (filters?.submissionDeadlineFrom) {
    bids = bids.filter((bid) => {
      const value = asDate(bid.submissionDeadline);
      return !!value && value >= filters.submissionDeadlineFrom!;
    });
  }
  if (filters?.submissionDeadlineTo) {
    bids = bids.filter((bid) => {
      const value = asDate(bid.submissionDeadline);
      return !!value && value <= filters.submissionDeadlineTo!;
    });
  }
  if (filters?.tags?.length) {
    bids = bids.filter((bid) =>
      filters.tags!.some((tag) => (bid.tags || []).includes(tag))
    );
  }

  const sorted = [...bids].sort((a, b) => {
    const direction = sort?.direction === 'asc' ? 1 : -1;
    const field = sort?.field || 'updatedAt';
    const aValue = (a as unknown as Record<string, unknown>)[field];
    const bValue = (b as unknown as Record<string, unknown>)[field];
    if (aValue instanceof Date && bValue instanceof Date) {
      return direction * (aValue.getTime() - bValue.getTime());
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return direction * (aValue - bValue);
    }
    return direction * String(aValue || '').localeCompare(String(bValue || ''));
  });

  return sorted.slice(0, pageSize);
};

export const getDevBid = (userId: string, bidId: string) =>
  getHydratedState().bids.find((bid) => bid.id === bidId && bid.userId === userId) ||
  null;

export const createDevBid = (
  userId: string,
  bidData: Omit<Bid, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'currentVersionId' | 'versions'>
) => {
  const now = new Date();
  const project = getDevProjectById(bidData.projectId);
  const subcontractor = bidData.subcontractorId
    ? getHydratedState().subcontractors.find(
        (item) => item.id === bidData.subcontractorId
      )
    : null;
  const versionId = uuidv4();
  const baseVersion: BidVersion = {
    id: versionId,
    versionNumber: 1,
    createdAt: now,
    totalAmount: bidData.totalAmount || 0,
    notes: bidData.notes || 'Initial version',
    lineItems: [],
    attachments: [],
  };

  const bid = withPaymentProgress({
    ...bidData,
    id: uuidv4(),
    userId,
    projectName: bidData.projectName || project?.name,
    subcontractorName: bidData.subcontractorName || subcontractor?.name,
    currentVersionId: versionId,
    versions: [baseVersion],
    createdAt: now,
    updatedAt: now,
    paymentSchedule: (bidData.paymentSchedule || []).map((stage) => ({
      ...stage,
      id: stage.id || uuidv4(),
      createdAt: asDate(stage.createdAt) || now,
      updatedAt: asDate(stage.updatedAt) || now,
      dueDate: asDate(stage.dueDate) || undefined,
      paymentDate: asDate(stage.paymentDate) || undefined,
      status: stage.status || 'pending',
      paidAmount: stage.paidAmount || 0,
    })),
  });

  updateState((current) => ({
    ...current,
    bids: [...current.bids, bid],
  }));
  return bid;
};

export const updateDevBid = (bidId: string, bidData: Partial<Bid>) => {
  updateState((current) => ({
    ...current,
    bids: current.bids.map((bid) =>
      bid.id === bidId
        ? withPaymentProgress({
            ...bid,
            ...bidData,
            submissionDeadline:
              bidData.submissionDeadline === null
                ? null
                : asDate(bidData.submissionDeadline) || bid.submissionDeadline || null,
            startDate:
              bidData.startDate === null
                ? null
                : asDate(bidData.startDate) || bid.startDate || null,
            completionDate:
              bidData.completionDate === null
                ? null
                : asDate(bidData.completionDate) || bid.completionDate || null,
            versions: (bidData.versions || bid.versions || []).map(hydrateBidVersion),
            paymentSchedule: (bidData.paymentSchedule || bid.paymentSchedule || []).map(
              (stage) => ({
                ...hydrateBidStage(stage),
                updatedAt: new Date(),
              })
            ),
            updatedAt: new Date(),
          })
        : bid
    ),
  }));
};

export const deleteDevBid = (bidId: string) => {
  updateState((current) => ({
    ...current,
    bids: current.bids.filter((bid) => bid.id !== bidId),
  }));
};

export const createDevBidVersion = (
  userId: string,
  bidId: string,
  versionData: Omit<BidVersion, 'id' | 'createdAt'>,
  updateBid = true
) => {
  const bid = getDevBid(userId, bidId);
  if (!bid) {
    throw new Error(`Bid with ID ${bidId} not found`);
  }

  const version: BidVersion = {
    ...versionData,
    id: uuidv4(),
    createdAt: new Date(),
    versionNumber: versionData.versionNumber || (bid.versions?.length || 0) + 1,
  };

  if (updateBid) {
    updateDevBid(bidId, {
      versions: [...(bid.versions || []), version],
      currentVersionId: version.id,
      totalAmount: version.totalAmount,
      status: 'revision_requested',
    });
  }

  return version;
};

export const updateDevBidPaymentStage = (
  userId: string,
  bidId: string,
  stageId: string,
  stageData: Partial<BidPaymentStage>
) => {
  const bid = getDevBid(userId, bidId);
  if (!bid || !bid.paymentSchedule) {
    throw new Error(`Bid ${bidId} or payment schedule not found`);
  }

  const paymentSchedule = bid.paymentSchedule.map((stage) =>
    stage.id === stageId
      ? {
          ...stage,
          ...stageData,
          dueDate:
            stageData.dueDate === null
              ? undefined
              : asDate(stageData.dueDate) || stage.dueDate,
          paymentDate:
            stageData.paymentDate === null
              ? undefined
              : asDate(stageData.paymentDate) || stage.paymentDate,
          updatedAt: new Date(),
        }
      : stage
  );

  updateDevBid(bidId, { paymentSchedule });
};
