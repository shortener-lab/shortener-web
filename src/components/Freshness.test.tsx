import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Freshness } from './Freshness';

const NOW = new Date('2026-10-13T14:32:40.000Z');
const computedAt = '2026-10-13T14:32:10.000Z';
const hora = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'medium' }).format(new Date(computedAt));

describe('Freshness', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('mostra quando foi calculado e quanto falta, contando a partir da chegada', () => {
    render(<Freshness computedAt={computedAt} refreshInSeconds={30} receivedAt={NOW.getTime()} />);
    expect(screen.getByText(hora)).toHaveAttribute('dateTime', computedAt);
    expect(screen.getByText('próxima atualização em 30 s')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(12_000));
    expect(screen.getByText('próxima atualização em 18 s')).toBeInTheDocument();
  });

  it('no fim mostra "atualizando…"', () => {
    render(<Freshness computedAt={computedAt} refreshInSeconds={5} receivedAt={NOW.getTime()} />);
    act(() => vi.advanceTimersByTime(6_000));
    expect(screen.getByText('atualizando…')).toBeInTheDocument();
  });
});
