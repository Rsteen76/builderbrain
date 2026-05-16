import { Bid, Expense, Project, ProjectPhase, Subcontractor } from '../types';
import { safelyParseDate } from '../utils/formatters';
import { BidService } from './bid';
import { ExpenseService } from './expense';
import { ProjectService } from './project';
import { SubcontractorService } from './subcontractor';
import { logger } from '../utils/logger';

export interface ProjectDetailData {
  project: Project | null;
  phases: ProjectPhase[];
  bids: Bid[];
  expenses: Expense[];
  subcontractors: Subcontractor[];
}

const ensureValidPhaseDates = (phases: ProjectPhase[]): ProjectPhase[] => {
  return phases.map(phase => {
    let startDate = phase.startDate;
    let endDate = phase.endDate;

    if (!startDate || isNaN(safelyParseDate(startDate).getTime())) {
      startDate = new Date();
    }

    if (!endDate || isNaN(safelyParseDate(endDate).getTime())) {
      const validStartDate = safelyParseDate(startDate);
      const newEndDate = new Date(validStartDate.getTime());
      newEndDate.setDate(validStartDate.getDate() + 30);
      endDate = newEndDate;
    } else {
      const validStartDate = safelyParseDate(startDate);
      const validEndDate = safelyParseDate(endDate);
      if (validEndDate < validStartDate) {
        const newEndDate = new Date(validStartDate.getTime());
        newEndDate.setDate(validStartDate.getDate() + 30);
        endDate = newEndDate;
      }
    }

    return {
      ...phase,
      startDate,
      endDate,
    };
  });
};

const referencedSubcontractorIds = (bids: Bid[], expenses: Expense[]): string[] => {
  const ids = new Set<string>();

  bids.forEach(bid => {
    if (bid.subcontractorId) ids.add(bid.subcontractorId);
  });

  expenses.forEach(expense => {
    if (expense.subcontractorId) ids.add(expense.subcontractorId);
  });

  return Array.from(ids);
};

const DEFAULT_TIMEOUTS = {
  projectMs: 10000,
  relatedMs: 8000,
  subcontractorMs: 5000,
};

interface ProjectDetailLoadTimeouts {
  projectMs?: number;
  relatedMs?: number;
  subcontractorMs?: number;
}

interface ProjectShellDetailData {
  project: Project | null;
  phases: ProjectPhase[];
}

interface ProjectRelatedDetailData {
  bids: Bid[];
  expenses: Expense[];
  subcontractors: Subcontractor[];
}

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const getSettledValue = <T,>(
  result: PromiseSettledResult<T>,
  fallback: T,
  label: string
): T => {
  if (result.status === 'fulfilled') {
    return result.value;
  }

  logger.warn(`ProjectDetailDataService: ${label} failed`, result.reason);
  return fallback;
};

export class ProjectDetailDataService {
  static async getProjectShellDetailData(
    userId: string,
    projectId: string,
    timeouts: ProjectDetailLoadTimeouts = {}
  ): Promise<ProjectShellDetailData> {
    const loadTimeouts = { ...DEFAULT_TIMEOUTS, ...timeouts };

    if (!userId || !projectId) {
      return {
        project: null,
        phases: [],
      };
    }

    const project = await withTimeout(
      ProjectService.getProject(projectId, userId),
      loadTimeouts.projectMs,
      'Project load'
    );

    return {
      project,
      phases: project ? ensureValidPhaseDates(project.phases || []) : [],
    };
  }

  static async getRelatedProjectDetailData(
    userId: string,
    projectId: string,
    timeouts: ProjectDetailLoadTimeouts = {}
  ): Promise<ProjectRelatedDetailData> {
    const loadTimeouts = { ...DEFAULT_TIMEOUTS, ...timeouts };

    if (!userId || !projectId) {
      return {
        bids: [],
        expenses: [],
        subcontractors: [],
      };
    }

    const [bidsResult, expensesResult] = await Promise.allSettled([
      withTimeout(
        BidService.getBids(userId, { projectId }, undefined, Number.MAX_SAFE_INTEGER),
        loadTimeouts.relatedMs,
        'Project bids load'
      ),
      withTimeout(
        ExpenseService.getProjectExpenses(userId, projectId),
        loadTimeouts.relatedMs,
        'Project expenses load'
      ),
    ]);

    const bids = getSettledValue(bidsResult, [] as Bid[], 'bids load');
    const expenses = getSettledValue(expensesResult, [] as Expense[], 'expenses load');

    const subcontractorResults = await Promise.allSettled(
      referencedSubcontractorIds(bids, expenses).map(id =>
        withTimeout(
          SubcontractorService.getSubcontractor(userId, id),
          loadTimeouts.subcontractorMs,
          `Subcontractor ${id} load`
        )
      )
    );

    return {
      bids,
      expenses,
      subcontractors: subcontractorResults
        .map((result) => getSettledValue(result, null, 'subcontractor load'))
        .filter((sub): sub is Subcontractor => Boolean(sub)),
    };
  }

  static async getProjectDetailData(
    userId: string,
    projectId: string,
    timeouts: ProjectDetailLoadTimeouts = {}
  ): Promise<ProjectDetailData> {
    if (!userId || !projectId) {
      return {
        project: null,
        phases: [],
        bids: [],
        expenses: [],
        subcontractors: [],
      };
    }

    const { project, phases } = await this.getProjectShellDetailData(userId, projectId, timeouts);

    if (!project) {
      return {
        project: null,
        phases: [],
        bids: [],
        expenses: [],
        subcontractors: [],
      };
    }

    const relatedData = await this.getRelatedProjectDetailData(userId, projectId, timeouts);

    return {
      project,
      phases,
      ...relatedData,
    };
  }
}
