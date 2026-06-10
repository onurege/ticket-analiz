/**
 * Pareto kümülatif % hesabı.
 */
export type ParetoItem = { label: string; count: number; cumPct: number };

export function computePareto(counts: Record<string, number>, top = 15): ParetoItem[] {
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, top);
  const total = sorted.reduce((s, [, n]) => s + n, 0);
  let acc = 0;
  return sorted.map(([label, count]) => {
    acc += count;
    return { label, count, cumPct: Math.round((acc / total) * 1000) / 10 };
  });
}
