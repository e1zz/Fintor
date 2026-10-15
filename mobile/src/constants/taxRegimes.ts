import type { TaxRegimeCode } from '../api/endpoints';

export const TAX_REGIMES: { code: TaxRegimeCode; label: string; description: string }[] = [
  {
    code: 'resico_pf',
    label: 'RESICO Individual',
    description: 'Simplified trust regime for individuals',
  },
  {
    code: 'resico_pm',
    label: 'RESICO Corporate',
    description: 'Simplified trust regime for companies',
  },
  {
    code: 'pfae',
    label: 'Individual Business Activity',
    description: 'Business and commercial activities',
  },
  {
    code: 'professional_fees',
    label: 'Professional Fees',
    description: 'Independent professional services',
  },
];

export const REGIME_LABELS: Record<string, string> = Object.fromEntries(
  TAX_REGIMES.map((r) => [r.code, r.label]),
);
