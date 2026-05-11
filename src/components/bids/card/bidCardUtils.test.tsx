import {
  getPaymentProgress,
  getPaymentSchedule,
  getUpcomingPayment,
  isDeadlineClose,
} from './bidCardUtils';
import { Bid } from '../../../types';

const baseBid: Bid = {
  id: 'bid-1',
  userId: 'user-1',
  projectId: 'project-1',
  status: 'submitted',
  totalAmount: 1000,
  createdAt: new Date('2026-05-01T00:00:00.000Z'),
  updatedAt: new Date('2026-05-01T00:00:00.000Z'),
};

describe('bidCardUtils', () => {
  test('calculates payment progress from schedule when explicit progress is absent', () => {
    const bid: Bid = {
      ...baseBid,
      paymentSchedule: [
        {
          id: 'paid',
          name: 'Deposit',
          percentage: 25,
          amount: 250,
          status: 'paid',
        },
        {
          id: 'pending',
          name: 'Rough-in',
          percentage: 50,
          amount: 0,
          status: 'pending',
        },
      ],
    };

    expect(getPaymentProgress(bid)).toEqual({
      percentage: 25,
      paid: 250,
      pending: 500,
      remaining: 750,
    });
  });

  test('normalizes schedule amounts and upcoming payment selection', () => {
    const bid: Bid = {
      ...baseBid,
      paymentSchedule: [
        {
          id: 'later',
          name: 'Later',
          percentage: 30,
          amount: 0,
          dueDate: new Date('2026-05-20T00:00:00.000Z'),
          status: 'pending',
        },
        {
          id: 'soon',
          name: 'Soon',
          percentage: 20,
          amount: 0,
          dueDate: new Date('2026-05-15T00:00:00.000Z'),
          status: 'pending',
        },
      ],
    };

    const schedule = getPaymentSchedule(bid);

    expect(schedule[0]).toMatchObject({
      amount: 300,
      paid: false,
      pending: true,
    });
    expect(getUpcomingPayment(schedule, new Date('2026-05-11T00:00:00.000Z'))?.id).toBe('soon');
  });

  test('detects bid deadlines within three days', () => {
    expect(isDeadlineClose(new Date('2026-05-13T00:00:00.000Z'), new Date('2026-05-11T00:00:00.000Z'))).toBe(true);
    expect(isDeadlineClose(new Date('2026-05-20T00:00:00.000Z'), new Date('2026-05-11T00:00:00.000Z'))).toBe(false);
    expect(isDeadlineClose('not-a-date', new Date('2026-05-11T00:00:00.000Z'))).toBe(false);
  });
});
