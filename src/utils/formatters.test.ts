import { formatCurrency, formatPercentage } from './formatters';

describe('formatCurrency', () => {
  it('shows cents by default', () => {
    expect(formatCurrency(1260000)).toBe('$1,260,000.00');
  });

  it('can drop the cents for a narrow tile', () => {
    expect(formatCurrency(1260000, 0)).toBe('$1,260,000');
    expect(formatCurrency(909200.4, 0)).toBe('$909,200');
  });
});

describe('formatPercentage', () => {
  it('expects a fraction, so 10.09 percent is passed as 0.1009', () => {
    expect(formatPercentage(0.1009)).toBe('10.1%');
    expect(formatPercentage(1.2)).toBe('120%');
  });
});
