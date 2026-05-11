import {
  getAttachmentDisplay,
  getInitialBidFormData,
  sortVersionsByNumberDesc,
} from './displayUtils';
import { Bid, BidVersion } from '../../../types';

const baseBid: Bid = {
  id: 'bid-1',
  userId: 'user-1',
  projectId: 'project-1',
  projectName: 'Hillside Remodel',
  status: 'submitted',
  totalAmount: 1000,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
};

describe('BidDetails display utils', () => {
  test('sorts versions descending without mutating input', () => {
    const versions = [
      { id: 'v1', versionNumber: 1, createdAt: new Date(), totalAmount: 100, lineItems: [] },
      { id: 'v3', versionNumber: 3, createdAt: new Date(), totalAmount: 300, lineItems: [] },
      { id: 'v2', versionNumber: 2, createdAt: new Date(), totalAmount: 200, lineItems: [] },
    ] as BidVersion[];

    expect(sortVersionsByNumberDesc(versions).map(version => version.id)).toEqual(['v3', 'v2', 'v1']);
    expect(versions.map(version => version.id)).toEqual(['v1', 'v3', 'v2']);
  });

  test('normalizes attachment labels and urls', () => {
    expect(getAttachmentDisplay('https://example.com/bid.pdf')).toEqual({
      name: 'https://example.com/bid.pdf',
      url: 'https://example.com/bid.pdf',
    });
    expect(getAttachmentDisplay({ name: 'Plan Set', url: 'https://example.com/plans.pdf' })).toEqual({
      name: 'Plan Set',
      url: 'https://example.com/plans.pdf',
    });
  });

  test('maps bid data into reusable form initial data', () => {
    const formData = getInitialBidFormData({
      ...baseBid,
      title: 'Framing bid',
      subcontractorId: 'sub-1',
      subcontractorName: 'Framing Co',
      phaseId: 'phase-1',
      phaseName: 'Framing',
      scope: 'Frame addition',
      paymentSchedule: [
        {
          id: 'deposit',
          name: 'Deposit',
          percentage: 20,
          amount: 200,
          status: 'paid',
        },
        {
          id: 'installment',
          name: 'Installment',
          percentage: 80,
          amount: 800,
          status: 'pending',
          description: 'After inspection',
        },
      ],
      attachments: [{ name: 'Scope', url: 'https://example.com/scope.pdf' }],
      tags: ['framing'],
    });

    expect(formData).toMatchObject({
      title: 'Framing bid',
      subcontractorId: 'sub-1',
      phaseId: 'phase-1',
      status: 'submitted',
      attachments: ['https://example.com/scope.pdf'],
      tags: ['framing'],
      paymentTerms: {
        downPaymentPercent: 20,
        downPaymentAmount: 200,
        installments: [
          expect.objectContaining({
            id: 'installment',
            name: 'Installment',
            percent: 80,
            milestoneDescription: 'After inspection',
          }),
        ],
      },
    });
  });
});
