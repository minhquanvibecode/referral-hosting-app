import { useMemo } from 'react'
import { Explain, ResponsiveTable, SegmentedControl } from '../components/ui'
import { services } from '../config/seed'
import type { Assumptions } from '../config/types'
import { feasibility, sensitivity, serviceChecks, type ServiceCheck } from '../lib/calc/economics'
import { formatVnd } from '../lib/format'

export const TARGETS = ['2', '3', '4'] as const
export type Target = (typeof TARGETS)[number]

const signed = (n: number) => (n === 0 ? '0 đ' : `${n > 0 ? '+' : '−'}${formatVnd(Math.abs(n))}`)
const times = (r: number | null) => (r === null ? '—' : `${r.toFixed(2).replace('.', ',')} lần`)
const LEVEL_TEXT: Record<ServiceCheck['level'], string> = { good: 'Đạt mục tiêu', warn: 'Cần gia hạn mới bù', bad: 'Lỗ tháng đầu' }
const LEVEL_CLASS: Record<ServiceCheck['level'], string> = { good: 'st-converted', warn: 'st-pending', bad: 'st-rejected' }

/** Ngưỡng ưu đãi khả thi: tính ngược mức ưu đãi tối đa từ mục tiêu DT/CP và chi phí quảng cáo. */
export function FeasibilityCard({ a, target, onTarget }: { a: Assumptions; target: Target; onTarget: (t: Target) => void }) {
  const T = Number(target)
  const f = useMemo(() => feasibility(a, T), [a, T])
  const checks = useMemo(() => serviceChecks(services, a, T), [a, T])
  const pct = f.max > 0 ? Math.min(100, (f.current / f.max) * 100) : 100
  const tone = !f.ok ? 'bad' : f.headroom === 0 ? 'warn' : 'good'
  const verdict = !f.ok
    ? `Vượt ngưỡng ${formatVnd(-f.headroom)}/khách — giảm ưu đãi hoặc hạ mục tiêu.`
    : f.headroom === 0
      ? 'Đang dùng đúng mức tối đa — không nên tăng thêm.'
      : `Còn có thể tăng thêm ${formatVnd(f.headroom)}/khách mà vẫn đạt mục tiêu.`

  return (
    <section className="card insight" aria-labelledby="feas-title">
      <h2 id="feas-title">Ưu đãi tối đa còn khả thi</h2>
      <div className="insight-control">
        <span className="hint">Mục tiêu DT / CP ưu đãi</span>
        <SegmentedControl label="Mục tiêu doanh thu trên chi phí ưu đãi" value={target} onChange={onTarget} options={TARGETS.map((t) => ({ value: t, label: `≥ ${t} lần` }))} />
      </div>
      <div className="feas-figures">
        <div>
          <div className="hint">Đang dùng / khách</div>
          <div className={`feas-value tone-${tone}`}>{formatVnd(f.current)}</div>
        </div>
        <div>
          <div className="hint">Tối đa / khách</div>
          <div className="feas-value">{formatVnd(f.max)}</div>
        </div>
      </div>
      <div className={`meter tone-${tone}`} role="meter" aria-valuemin={0} aria-valuemax={f.max} aria-valuenow={f.current} aria-label="Ưu đãi đang dùng so với mức tối đa">
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className={`alert ${tone}`} role="status">{verdict}</div>
      <Explain lines={[
        'DT/CP = DT TB/khách ÷ Ưu đãi/khách (số khách triệt tiêu)',
        `Theo mục tiêu: ${formatVnd(a.revenuePerCustomer)} ÷ ${T} = ${formatVnd(f.maxByRatio)} (làm tròn xuống)`,
        `Theo quảng cáo: phải ≤ ${formatVnd(f.maxByAds)}/khách`,
        `Tối đa = min(${formatVnd(f.maxByRatio)}; ${formatVnd(f.maxByAds)}) = ${formatVnd(f.max)} — chặt hơn: ${f.binding === 'ratio' ? 'mục tiêu DT/CP' : 'chi phí quảng cáo'}`,
      ]} />
      <h3>Theo từng dịch vụ (giá tháng đầu ÷ ưu đãi 2 phía)</h3>
      <ResponsiveTable<ServiceCheck>
        caption="Kiểm tra ưu đãi theo dịch vụ"
        rows={checks}
        rowKey={(c) => c.name}
        columns={[
          { key: 'name', header: 'Dịch vụ', primary: true, render: (c) => <span className="nowrap">{c.name}</span> },
          { key: 'price', header: 'Giá', align: 'right', render: (c) => formatVnd(c.price) },
          { key: 'ratio', header: 'Giá ÷ ưu đãi', align: 'right', render: (c) => times(c.ratio) },
          { key: 'level', header: 'Đánh giá', render: (c) => <span className={`badge ${LEVEL_CLASS[c.level]}`}>{LEVEL_TEXT[c.level]}</span> },
        ]}
      />
      <p className="hint">Gợi ý: dịch vụ "Lỗ tháng đầu" chỉ nên áp ưu đãi khi mua kèm hosting.</p>
    </section>
  )
}

/** Độ nhạy: đổi từng giả định ±10%, xếp theo mức thay đổi doanh thu ròng. */
export function SensitivityCard({ a }: { a: Assumptions }) {
  const s = useMemo(() => sensitivity(a), [a])
  const maxImpact = Math.max(1, ...s.rows.map((r) => r.impact))
  const top = s.rows[0]
  return (
    <section className="card insight" aria-labelledby="sens-title">
      <h2 id="sens-title">Độ nhạy: giả định nào nguy hiểm nhất?</h2>
      <p className="hint">Đổi từng giả định ±10%, giữ nguyên các giả định khác, đo doanh thu ròng (DT − CP ưu đãi). Gốc: <b className="nowrap">{formatVnd(s.base)}</b>.</p>
      <ol className="sens-list">
        {s.rows.map((r, i) => {
          const gain = Math.max(r.up, r.down)
          const loss = Math.min(r.up, r.down)
          return (
            <li key={r.key} className="sens-row">
              <span className="sens-label">
                <span className={`sens-rank${i === 0 ? ' first' : ''}`}>{i + 1}</span>
                {r.label}
              </span>
              <span className="sens-bar" aria-hidden>
                <span className="sens-half neg"><i style={{ width: `${(Math.abs(loss) / maxImpact) * 100}%` }} /></span>
                <span className="sens-half pos"><i style={{ width: `${(gain / maxImpact) * 100}%` }} /></span>
              </span>
              <span className="sens-values">
                <span className="num negative">{signed(loss)}</span>
                <span className="num positive">{signed(gain)}</span>
              </span>
            </li>
          )
        })}
      </ol>
      <div className="legend">
        <span><i className="sw sw-cost" /> Doanh thu ròng giảm</span>
        <span><i className="sw sw-good" /> Doanh thu ròng tăng</span>
      </div>
      {top && top.impact > 0 && (
        <div className="alert warn" role="status">
          <b>{top.label}</b> ảnh hưởng mạnh nhất: lệch 10% làm doanh thu ròng thay đổi tới {formatVnd(top.impact)}. Nên kiểm chứng giả định này trước khi chạy chương trình.
        </div>
      )}
      <Explain lines={[
        'Thay đổi = Doanh thu ròng (giả định × 1,1 hoặc × 0,9) − Doanh thu ròng gốc',
        `Ví dụ ${top.label} +10%: ${signed(top.up)}; −10%: ${signed(top.down)}`,
        'Số khách làm tròn xuống ở từng bước nên tác động có thể không đối xứng.',
      ]} />
    </section>
  )
}
