export function clicksLabel(n: number): string {
  return `${n.toLocaleString('pt-BR')} ${n === 1 ? 'clique' : 'cliques'}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

// '2026-10-12' → '12/10' (sem passar por Date, para não sofrer com fuso)
export function formatDay(day: string): string {
  const [, month, date] = day.split('-');
  return `${date}/${month}`;
}
