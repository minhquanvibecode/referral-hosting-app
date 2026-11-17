import { useMemo } from 'react'
import type { Store } from '../App'
import { Explain, KpiCard, NumberField, ResponsiveTable, SplitLayout, StickyActions, useToast } from '../components/ui'
import { sampleAssumptions as D } from '../config/seed'
import type { Assumptions } from '../config/types'
import { monthly, project, scenario, SCENARIOS, type MonthRow } from '../lib/calc/economics'
import { programStats } from '../lib/calc/referrals'
import { formatNumber, formatPercent, formatVnd } from '../lib/format'
import { programSummary } from '../lib/summary'
import { copyText, fromPct, toPct } from '../lib/view'
import { MonthlyChart } from './MonthlyChart'

const money = (v: number) => formatNumber(v, 0)
const ratioText = (r: number | null) => (r === null ? 'Không tính được' : `${formatNumber(r)} lần`)

export function EconomicsPage({ store }: { store: Store }) {
  const toast = useToast()
  const a = store.data.assumptions
  const set = (k: keyof Assumptions) => (v: number) => store.update((d) => ({ ...d, assumptions: { ...d.assumptions, [k]: v } }))
  const setPct = (k: keyof Assumptions) => (v: number) => set(k)(fromPct(v))

  const p = useMemo(() => project(a), [a])
  const months = useMemo(() => monthly(a), [a])
  const scen = useMemo(() => SCENARIOS.map((s) => ({ ...s, p: project(scenario(a, s.factor)) })), [a])
  const actual = useMemo(() => programStats(store.data.referrals), [store.data.referrals])
  const last = months[months.length - 1]

  const copySummary = async () => {
    const ok = await copyText(programSummary(a, actual, window.location.href.split('#')[0]))
    toast(ok ? 'Đã sao chép tóm tắt chương trình — dán vào Zalo/Email' : 'Không sao chép được', ok ? 'good' : 'bad')
  }

  const pctField = (k: keyof Assumptions, label: string, hint?: string) => (
    <NumberField label={label} value={toPct(a[k])} defaultValue={toPct(D[k])} onChange={setPct(k)} unit="%" min={0} max={100} hint={hint} />
  )
  const moneyField = (k: keyof Assumptions, label: string, unit: string, hint?: string) => (
    <NumberField label={label} value={a[k]} defaultValue={D[k]} onChange={set(k)} unit={unit} min={0} integer format={money} hint={hint} />
  )

  return (
    <div className="stack">
      <SplitLayout
        main={
          <>
            <section className="card">
              <h2>Giả định dự phóng <span className="badge src-sample">BTC</span></h2>
              <div className="fields-2">
                <NumberField label="Số thành viên hiện có" value={a.members} defaultValue={D.members} onChange={set('members')} unit="thành viên" min={0} integer format={money} />
                {pctField('participation', 'Tỉ lệ tham gia giới thiệu')}
                <NumberField label="Số lượt giới thiệu mỗi người" value={a.referralsPerMember} defaultValue={D.referralsPerMember} onChange={set('referralsPerMember')} unit="lượt" min={0} max={100} />
                {pctField('conversion', 'Tỉ lệ chuyển đổi', 'Khách được giới thiệu trở thành khách trả phí')}
                {moneyField('revenuePerCustomer', 'Doanh thu TB mỗi khách', 'đ/tháng')}
                {moneyField('adCostPerCustomer', 'Chi phí quảng cáo mỗi khách', 'đ/khách', 'Mốc so sánh')}
              </div>
            </section>
            <section className="card">
              <h2>Mức ưu đãi (thể lệ) <span className="badge src-sample">BTC</span></h2>
              <div className="fields-2">
                {moneyField('referrerReward', 'Ưu đãi người giới thiệu', 'đ/khách')}
                {moneyField('newReward', 'Ưu đãi khách mới', 'đ/khách')}
              </div>
            </section>
            <section className="card">
              <h2>Giả định của đội <span className="badge">Đội</span></h2>
              <div className="fields-2">
                {moneyField('tier2Reward', 'Ưu đãi tầng 2', 'đ/khách')}
                {pctField('tier2Share', 'Tỉ lệ khách mới có tầng 2', 'Mặc định 0% để khớp ví dụ BTC')}
                {pctField('retention', 'Tỉ lệ giữ chân mỗi tháng', 'Dùng cho biểu đồ theo tháng')}
                <NumberField label="Số tháng dự phóng" value={a.months} defaultValue={D.months} onChange={set('months')} unit="tháng" min={1} max={36} integer />
              </div>
            </section>
          </>
        }
        aside={
          <>
            <div className="kpis">
              <KpiCard label="Khách hàng mới" value={`${p.newCustomers} khách`} explain={[
                'Thành viên tham gia = Số thành viên × Tỉ lệ tham gia',
                `= ${money(a.members)} × ${formatPercent(a.participation)} = ${p.participants} người`,
                'Khách tiềm năng = Thành viên tham gia × Lượt/người',
                `= ${p.participants} × ${formatNumber(a.referralsPerMember)} = ${p.potential} khách`,
                'Khách mới = Khách tiềm năng × Tỉ lệ chuyển đổi',
                `= ${p.potential} × ${formatPercent(a.conversion)} = ${p.newCustomers} khách`,
                'Mỗi bước làm tròn xuống (không đếm nửa người).',
              ]} />
              <KpiCard label="Doanh thu dự kiến" value={formatVnd(p.revenue)} tone="good" hint="tháng đầu" explain={[
                'Doanh thu = Khách mới × DT TB/khách', `= ${p.newCustomers} × ${formatVnd(a.revenuePerCustomer)}`, `= ${formatVnd(p.revenue)}`,
              ]} />
              <KpiCard label="Tổng chi phí ưu đãi" value={formatVnd(p.totalCost)} tone="bad" explain={[
                'Ưu đãi/khách = Người giới thiệu + Khách mới + Tầng 2 × Tỉ lệ tầng 2',
                `= ${formatVnd(a.referrerReward)} + ${formatVnd(a.newReward)} + ${formatVnd(a.tier2Reward)} × ${formatPercent(a.tier2Share)} = ${formatVnd(p.rewardPerCustomer)}`,
                `Tổng = ${p.newCustomers} × ${formatVnd(p.rewardPerCustomer)} = ${formatVnd(p.totalCost)}`,
              ]} />
              <KpiCard label="Doanh thu / chi phí ưu đãi" value={ratioText(p.ratio)} tone={p.ratio === null ? 'warn' : p.ratio >= 1 ? 'good' : 'bad'} explain={[
                'Tỉ lệ = Doanh thu ÷ Tổng chi phí ưu đãi', `= ${formatVnd(p.revenue)} ÷ ${formatVnd(p.totalCost)}`, `= ${ratioText(p.ratio)} (2 chữ số thập phân)`,
                p.ratio === null ? 'Chi phí = 0 → không chia được.' : `Mỗi 1 đ ưu đãi mang về ${formatNumber(p.ratio)} đ doanh thu tháng đầu.`,
              ]} />
            </div>
            <div className="card compare">
              <div className="row-between"><span>Chi phí referral / khách</span><b className="num">{formatVnd(p.rewardPerCustomer)}</b></div>
              <div className="row-between"><span>Chi phí quảng cáo / khách</span><b className="num">{formatVnd(p.adCost)}</b></div>
              <div className="row-between"><span>Tiết kiệm / khách</span><b className={`num ${p.savingPerCustomer >= 0 ? 'positive' : 'negative'}`}>{p.savingPerCustomer >= 0 ? '+' : ''}{formatVnd(p.savingPerCustomer)}</b></div>
              <div className="row-between"><span>Tổng tiết kiệm ({p.newCustomers} khách)</span><b className={`num ${p.totalSaving >= 0 ? 'positive' : 'negative'}`}>{formatVnd(p.totalSaving)}</b></div>
              <Explain lines={['Tiết kiệm/khách = Chi phí quảng cáo − Ưu đãi/khách', `= ${formatVnd(p.adCost)} − ${formatVnd(p.rewardPerCustomer)} = ${formatVnd(p.savingPerCustomer)}`]} />
            </div>
            <StickyActions>
              <button type="button" className="btn btn-primary" onClick={copySummary}>Sao chép tóm tắt chương trình</button>
            </StickyActions>
          </>
        }
      />

      <section className="card">
        <h2>Kịch bản</h2>
        <p className="hint">Thận trọng / Tốt: nhân tỉ lệ tham gia và tỉ lệ chuyển đổi với 0,5 / 1,5 (tối đa 100%).</p>
        <div className="scen-grid">
          {scen.map((s) => (
            <div key={s.key} className={`scen ${s.key === 'base' ? 'scen-base' : ''}`}>
              <h3>{s.label}</h3>
              <div className="row-between"><span>Khách mới</span><b className="num">{s.p.newCustomers}</b></div>
              <div className="row-between"><span>Doanh thu</span><b className="num">{formatVnd(s.p.revenue)}</b></div>
              <div className="row-between"><span>Chi phí ưu đãi</span><b className="num">{formatVnd(s.p.totalCost)}</b></div>
              <div className="row-between"><span>DT / CP</span><b className="num">{ratioText(s.p.ratio)}</b></div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Dự phóng {months.length} tháng</h2>
        <div className="kpis kpis-3">
          <KpiCard label={`Doanh thu lũy kế ${months.length} tháng`} value={formatVnd(last.cumRevenue)} tone="good" />
          <KpiCard label="Chi phí ưu đãi lũy kế" value={formatVnd(last.cumCost)} tone="bad" />
          <KpiCard label="DT / CP lũy kế" value={ratioText(last.cumCost > 0 ? last.cumRevenue / last.cumCost : null)} />
        </div>
        <MonthlyChart rows={months} />
        <Explain lines={[
          'Giả định: mỗi tháng chương trình mang về đúng số khách mới như tháng đầu.',
          `Khách đang dùng tháng t = Khách tháng (t−1) × ${formatPercent(a.retention)} giữ chân + ${p.newCustomers} khách mới`,
          `Doanh thu tháng t = Khách đang dùng × ${formatVnd(a.revenuePerCustomer)}`,
          `Chi phí ưu đãi tháng t = ${p.newCustomers} khách mới × ${formatVnd(p.rewardPerCustomer)} = ${formatVnd(p.totalCost)} (chỉ trả 1 lần/khách)`,
          `Ví dụ tháng 2: ${p.newCustomers} × ${formatPercent(a.retention)} + ${p.newCustomers} = ${formatNumber(months[1]?.active ?? 0, 1)} khách → ${formatVnd(months[1]?.revenue ?? 0)}`,
        ]} />
        <details className="how">
          <summary>Bảng số liệu theo tháng</summary>
          <ResponsiveTable<MonthRow>
            caption="Dự phóng theo tháng"
            rows={months}
            rowKey={(r) => String(r.month)}
            columns={[
              { key: 'month', header: 'Tháng', primary: true, render: (r) => `Tháng ${r.month}` },
              { key: 'active', header: 'Khách đang dùng', align: 'right', render: (r) => formatNumber(r.active, 1) },
              { key: 'revenue', header: 'Doanh thu', align: 'right', render: (r) => formatVnd(r.revenue) },
              { key: 'cost', header: 'Chi phí ưu đãi', align: 'right', render: (r) => formatVnd(r.cost) },
              { key: 'cumRevenue', header: 'DT lũy kế', align: 'right', render: (r) => formatVnd(r.cumRevenue) },
            ]}
          />
        </details>
      </section>

      <section className="card">
        <h2>Thực tế đã ghi nhận (từ danh sách lượt)</h2>
        <div className="kpis">
          <KpiCard label="Lượt giới thiệu" value={`${actual.total} lượt`} hint={`${actual.pending} đang chờ · ${actual.rejected} hủy/không hợp lệ/trùng`} />
          <KpiCard label="Đã chuyển đổi" value={`${actual.converted} khách`} tone="good" hint={`Tỉ lệ ${actual.total ? formatPercent(actual.converted / actual.total) : '0%'}`} />
          <KpiCard label="Doanh thu tháng đầu" value={formatVnd(actual.revenue)} tone="good" />
          <KpiCard label="Ưu đãi đã chi" value={formatVnd(actual.rewards)} hint={`DT/CP: ${ratioText(actual.ratio)}`} explain={[
            'Ưu đãi đã chi = Σ TongUuDai của lượt "Đã chuyển đổi"', `= ${formatVnd(actual.referrerRewards)} (người giới thiệu) + ${formatVnd(actual.newRewards)} (khách mới)`, `= ${formatVnd(actual.rewards)}`,
          ]} />
        </div>
      </section>
    </div>
  )
}
