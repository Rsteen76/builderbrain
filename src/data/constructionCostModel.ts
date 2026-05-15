export type CostMarketId =
  | 'national-average'
  | 'lower-cost'
  | 'moderate-cost'
  | 'high-cost'
  | 'very-high-cost';

export type FinishLevelId = 'economy' | 'standard' | 'premium' | 'luxury';

export interface RegionalCostMarket {
  id: CostMarketId;
  label: string;
  laborMultiplier: number;
  materialMultiplier: number;
  permitMultiplier: number;
  description: string;
}

export interface FinishLevel {
  id: FinishLevelId;
  label: string;
  multiplier: number;
  description: string;
}

type PhaseCostDriver =
  | 'soft-cost'
  | 'site'
  | 'structure'
  | 'mep'
  | 'envelope'
  | 'interior'
  | 'closeout';

interface PhaseDriverProfile {
  laborShare: number;
  materialShare: number;
  permitShare: number;
  finishSensitivity: number;
}

export interface CostModelPhase {
  name: string;
  budgetPercentage: number;
}

export const REGIONAL_COST_MARKETS: RegionalCostMarket[] = [
  {
    id: 'national-average',
    label: 'National average',
    laborMultiplier: 1,
    materialMultiplier: 1,
    permitMultiplier: 1,
    description: 'Baseline cost profile for early estimating.',
  },
  {
    id: 'lower-cost',
    label: 'Lower-cost rural / small metro',
    laborMultiplier: 0.86,
    materialMultiplier: 0.96,
    permitMultiplier: 0.9,
    description: 'Lower labor rates and simpler local requirements.',
  },
  {
    id: 'moderate-cost',
    label: 'Moderate regional market',
    laborMultiplier: 0.96,
    materialMultiplier: 0.99,
    permitMultiplier: 0.98,
    description: 'Slightly below national-average labor and soft costs.',
  },
  {
    id: 'high-cost',
    label: 'High-cost metro',
    laborMultiplier: 1.18,
    materialMultiplier: 1.05,
    permitMultiplier: 1.15,
    description: 'Higher labor rates, logistics, and permitting overhead.',
  },
  {
    id: 'very-high-cost',
    label: 'Very high-cost coastal / constrained metro',
    laborMultiplier: 1.34,
    materialMultiplier: 1.1,
    permitMultiplier: 1.28,
    description: 'Premium labor market with more expensive administration and logistics.',
  },
];

export const FINISH_LEVELS: FinishLevel[] = [
  {
    id: 'economy',
    label: 'Economy',
    multiplier: 0.9,
    description: 'Cost-controlled finishes and simpler fixtures.',
  },
  {
    id: 'standard',
    label: 'Standard',
    multiplier: 1,
    description: 'Typical production-quality finishes.',
  },
  {
    id: 'premium',
    label: 'Premium',
    multiplier: 1.18,
    description: 'Higher-grade finishes, fixtures, and details.',
  },
  {
    id: 'luxury',
    label: 'Luxury',
    multiplier: 1.38,
    description: 'Custom finishes, specialty details, and premium fixtures.',
  },
];

const PHASE_DRIVER_PROFILES: Record<PhaseCostDriver, PhaseDriverProfile> = {
  'soft-cost': {
    laborShare: 0.45,
    materialShare: 0.05,
    permitShare: 0.5,
    finishSensitivity: 0.1,
  },
  site: {
    laborShare: 0.55,
    materialShare: 0.35,
    permitShare: 0.1,
    finishSensitivity: 0.05,
  },
  structure: {
    laborShare: 0.46,
    materialShare: 0.5,
    permitShare: 0.04,
    finishSensitivity: 0.1,
  },
  mep: {
    laborShare: 0.48,
    materialShare: 0.46,
    permitShare: 0.06,
    finishSensitivity: 0.25,
  },
  envelope: {
    laborShare: 0.44,
    materialShare: 0.52,
    permitShare: 0.04,
    finishSensitivity: 0.35,
  },
  interior: {
    laborShare: 0.5,
    materialShare: 0.48,
    permitShare: 0.02,
    finishSensitivity: 0.8,
  },
  closeout: {
    laborShare: 0.72,
    materialShare: 0.25,
    permitShare: 0.03,
    finishSensitivity: 0.2,
  },
};

export const DEFAULT_COST_MARKET_ID: CostMarketId = 'national-average';
export const DEFAULT_FINISH_LEVEL_ID: FinishLevelId = 'standard';

const getPhaseDriver = (phaseName: string): PhaseCostDriver => {
  const normalized = phaseName.toLowerCase();

  if (normalized.includes('permit') || normalized.includes('pre-construction') || normalized.includes('planning')) {
    return 'soft-cost';
  }

  if (
    normalized.includes('site') ||
    normalized.includes('foundation') ||
    normalized.includes('utility') ||
    normalized.includes('landscape') ||
    normalized.includes('civil')
  ) {
    return 'site';
  }

  if (normalized.includes('frame') || normalized.includes('structure') || normalized.includes('steel')) {
    return 'structure';
  }

  if (
    normalized.includes('mep') ||
    normalized.includes('mechanical') ||
    normalized.includes('electrical') ||
    normalized.includes('plumbing') ||
    normalized.includes('hvac')
  ) {
    return 'mep';
  }

  if (normalized.includes('exterior') || normalized.includes('dry-in') || normalized.includes('roof')) {
    return 'envelope';
  }

  if (
    normalized.includes('interior') ||
    normalized.includes('finish') ||
    normalized.includes('trim') ||
    normalized.includes('fixture') ||
    normalized.includes('drywall') ||
    normalized.includes('cabinet')
  ) {
    return 'interior';
  }

  return 'closeout';
};

const getRegionalCostMarket = (marketId?: CostMarketId): RegionalCostMarket =>
  REGIONAL_COST_MARKETS.find(market => market.id === marketId) || REGIONAL_COST_MARKETS[0];

const getFinishLevel = (finishLevelId?: FinishLevelId): FinishLevel =>
  FINISH_LEVELS.find(level => level.id === finishLevelId) || FINISH_LEVELS[1];

export const getCostModelDescription = (
  marketId?: CostMarketId,
  finishLevelId?: FinishLevelId
): string => {
  const market = getRegionalCostMarket(marketId);
  const finishLevel = getFinishLevel(finishLevelId);
  return `${market.label} / ${finishLevel.label}`;
};

export const allocateConstructionPhaseBudgets = <TPhase extends CostModelPhase>(
  phases: TPhase[],
  constructionBudget: number,
  marketId?: CostMarketId,
  finishLevelId?: FinishLevelId
): TPhase[] => {
  if (constructionBudget <= 0 || phases.length === 0) {
    return phases.map(phase => ({ ...phase, budget: 0 } as TPhase));
  }

  const market = getRegionalCostMarket(marketId);
  const finishLevel = getFinishLevel(finishLevelId);

  const phaseWeights = phases.map(phase => {
    const profile = PHASE_DRIVER_PROFILES[getPhaseDriver(phase.name)];
    const regionalFactor =
      profile.laborShare * market.laborMultiplier +
      profile.materialShare * market.materialMultiplier +
      profile.permitShare * market.permitMultiplier;
    const finishFactor = 1 + (finishLevel.multiplier - 1) * profile.finishSensitivity;

    return {
      phase,
      weight: Math.max(0, phase.budgetPercentage * regionalFactor * finishFactor),
    };
  });

  const totalWeight = phaseWeights.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight <= 0) {
    return phases.map(phase => ({ ...phase, budgetPercentage: 0, budget: 0 } as TPhase));
  }

  let allocatedBudget = 0;
  return phaseWeights.map((item, index) => {
    const isLast = index === phaseWeights.length - 1;
    const normalizedPercentage = (item.weight / totalWeight) * 100;
    const budget = isLast
      ? constructionBudget - allocatedBudget
      : Math.round(constructionBudget * (normalizedPercentage / 100));
    allocatedBudget += budget;

    return {
      ...item.phase,
      budget,
      budgetPercentage: normalizedPercentage,
    } as TPhase;
  });
};
