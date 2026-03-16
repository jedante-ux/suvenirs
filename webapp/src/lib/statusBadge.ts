export type QuoteStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'QUOTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

const STATUS_COLORS: Record<QuoteStatus, string> = {
  PENDING:   'bg-amber-100 text-amber-800 border border-amber-200',
  CONTACTED: 'bg-primary/10 text-primary border border-primary/20',
  QUOTED:    'bg-secondary text-secondary-foreground border border-secondary/50',
  APPROVED:  'bg-emerald-100 text-emerald-800 border border-emerald-200',
  REJECTED:  'bg-destructive/10 text-destructive border border-destructive/20',
  COMPLETED: 'bg-muted text-muted-foreground border border-border',
};

const STATUS_LABELS: Record<QuoteStatus, string> = {
  PENDING:   'Pendiente',
  CONTACTED: 'Contactado',
  QUOTED:    'Cotizado',
  APPROVED:  'Aprobado',
  REJECTED:  'Rechazado',
  COMPLETED: 'Completado',
};

export const QUOTE_STATUSES: QuoteStatus[] = [
  'PENDING',
  'CONTACTED',
  'QUOTED',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
];

export function getStatusBadgeClass(status: string): string {
  return STATUS_COLORS[status as QuoteStatus] ?? 'bg-muted text-muted-foreground border border-border';
}

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as QuoteStatus] ?? status;
}
