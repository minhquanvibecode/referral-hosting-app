import type { MonthRow } from '../lib/calc/economics'
import { formatVnd } from '../lib/format'

const short = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1).replace('.', ',')} tỷ` : n >= 1e6 ? `${Math.round(n / 1e6)} tr` : `${Math.round(n / 1e3)} k`)

/** Cột: doanh thu tháng (xanh) và chi phí ưu đãi tháng (đỏ). SVG tự vẽ, co giãn theo chiều ngang. */
export function MonthlyChart({ rows }: { rows: MonthRow[] }) {
  const W = 640
  const H = 260
  const pad = { l: 52, r: 8, t: 12, b: 28 }
  const max = Math.max(1, ...rows.map((r) => Math.max(r.revenue, r.cost)))
  const step = (W - pad.l - pad.r) / rows.length
  const bw = Math.max(3, step * 0.36)
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max)
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Biểu đồ doanh thu và chi phí ưu đãi theo tháng">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="grid" />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="axis">{short(t)}</text>
          </g>
        ))}
        {rows.map((r, i) => {
          const x = pad.l + i * step + step / 2
          return (
            <g key={r.month}>
              <rect x={x - bw} y={y(r.revenue)} width={bw} height={y(0) - y(r.revenue)} className="bar-rev" rx="2">
                <title>{`Tháng ${r.month}: doanh thu ${formatVnd(r.revenue)}`}</title>
              </rect>
              <rect x={x} y={y(r.cost)} width={bw} height={y(0) - y(r.cost)} className="bar-cost" rx="2">
                <title>{`Tháng ${r.month}: chi phí ưu đãi ${formatVnd(r.cost)}`}</title>
              </rect>
              {(rows.length <= 12 || i % 3 === 0) && <text x={x} y={H - 8} textAnchor="middle" className="axis">T{r.month}</text>}
            </g>
          )
        })}
      </svg>
      <figcaption className="legend">
        <span><i className="sw sw-rev" /> Doanh thu tháng</span>
        <span><i className="sw sw-cost" /> Chi phí ưu đãi tháng</span>
      </figcaption>
    </figure>
  )
}
