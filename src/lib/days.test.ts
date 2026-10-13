import { describe, expect, it } from 'vitest';
import { lastNDays } from './days';

const today = new Date('2026-10-12T23:30:00Z');

describe('lastNDays', () => {
  it('devolve 30 dias terminando hoje (UTC), com zero onde não houve clique', () => {
    const days = lastNDays(
      [
        { day: '2026-10-12', clicks: 3 },
        { day: '2026-09-13', clicks: 1 },
      ],
      today,
    );
    expect(days).toHaveLength(30);
    expect(days[0]).toEqual({ day: '2026-09-13', clicks: 1 });
    expect(days[1]).toEqual({ day: '2026-09-14', clicks: 0 });
    expect(days[29]).toEqual({ day: '2026-10-12', clicks: 3 });
  });

  it('ignora dias fora da janela', () => {
    const days = lastNDays([{ day: '2026-09-12', clicks: 9 }], today);
    expect(days.reduce((sum, d) => sum + d.clicks, 0)).toBe(0);
  });
});
