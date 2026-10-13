import type { DailyClicks } from '../api/client';
import { clicksLabel, formatDay } from '../lib/format';

const WIDTH = 600;
const HEIGHT = 160;
const AXIS_GAP = 20; // espaço para as datas embaixo

export function DailyChart({ days }: { days: DailyClicks[] }) {
  const max = Math.max(1, ...days.map((d) => d.clicks));
  const plotHeight = HEIGHT - AXIS_GAP;
  const slot = WIDTH / days.length;
  const barWidth = slot * 0.7;
  const first = days[0]?.day ?? '';
  const last = days[days.length - 1]?.day ?? '';

  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Cliques por dia de ${formatDay(first)} a ${formatDay(last)}; máximo de ${max} em um dia`}
      >
        <line x1={0} y1={plotHeight} x2={WIDTH} y2={plotHeight} className="axis" />
        {days.map((d, i) => {
          const height = (d.clicks / max) * (plotHeight - 4);
          return (
            <rect
              key={d.day}
              className="bar"
              x={i * slot + (slot - barWidth) / 2}
              y={plotHeight - height}
              width={barWidth}
              height={height}
              data-day={d.day}
              data-clicks={d.clicks}
            >
              <title>{`${formatDay(d.day)}: ${clicksLabel(d.clicks)}`}</title>
            </rect>
          );
        })}
        <text x={0} y={HEIGHT - 4} className="tick">{formatDay(first)}</text>
        <text x={WIDTH} y={HEIGHT - 4} className="tick" textAnchor="end">{formatDay(last)}</text>
      </svg>
    </figure>
  );
}
