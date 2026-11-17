import { useMemo, useState } from 'react'
import type { Store } from '../App'
import { ConfirmDialog, KpiCard, ResponsiveTable, StickyActions, useToast } from '../components/ui'
import type { Referral } from '../config/types'
import { PENDING_STATUSES } from '../config/seed'
import { cancelReferral, confirmPayment, createMember, isValidPhone, memberStats, PHONE_ERROR } from '../lib/calc/referrals'
import { formatVnd } from '../lib/format'
import { copyText, fmtDate, referralLink, StatusBadge, todayVN } from '../lib/view'

export function MembersPage({ store, selectedId, onSelect }: { store: Store; selectedId: string | null; onSelect: (id: string) => void }) {
  const toast = useToast()
  const { members, referrals, assumptions: a } = store.data
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', referredBy: '' })
  const [formError, setFormError] = useState('')

  const allStats = useMemo(() => new Map(members.map((m) => [m.id, memberStats(m, members, referrals, a.tier2Reward)])), [members, referrals, a.tier2Reward])
  const member = members.find((m) => m.id === selectedId) ?? members[0]
  const stats = member ? allStats.get(member.id)! : null
  const mine = useMemo(() => (member ? referrals.filter((r) => r.memberId === member.id).sort((x, y) => y.date.localeCompare(x.date)) : []), [member, referrals])
  const filtered = members.filter((m) => !q.trim() || `${m.name} ${m.code} ${m.id} ${m.phone}`.toLowerCase().includes(q.trim().toLowerCase()))

  const setRef = (r: Referral, next: Referral, msg: string) => {
    store.update((d) => ({ ...d, referrals: d.referrals.map((x) => (x.id === r.id ? next : x)) }))
    toast(msg)
  }

  const submit = () => {
    const res = createMember(members, { ...form, joinedAt: todayVN() })
    if ('error' in res) return setFormError(res.error)
    store.update((d) => ({ ...d, members: [...d.members, res.member] }))
    onSelect(res.member.id)
    setOpen(false)
    setForm({ name: '', phone: '', referredBy: '' })
    setFormError('')
    toast(`Đã đăng ký thành viên ${res.member.name} · mã ${res.member.code}`)
  }

  const copyLink = async (code: string) => toast((await copyText(referralLink(code))) ? 'Đã sao chép link giới thiệu' : 'Không sao chép được — hãy chép tay', 'good')

  return (
    <div className="members-layout">
      <section className="ml-track">
        {members.length > 1 && (
          <div className="field mobile-only">
            <label htmlFor="member-pick">Đang xem thành viên</label>
            <select id="member-pick" value={member?.id} onChange={(e) => onSelect(e.target.value)}>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.code}</option>)}
            </select>
          </div>
        )}
        {member && stats ? (
          <>
            <div className="card member-card">
              <div className="mc-top">
                <div>
                  <div className="mc-name">{member.name}</div>
                  <div className="hint">{member.id} · tham gia {fmtDate(member.joinedAt)}</div>
                </div>
                <span className={`badge tier tier-${stats.tier === 'Vàng' ? 'gold' : stats.tier === 'Bạc' ? 'silver' : 'base'}`}>Hạng {stats.tier}</span>
              </div>
              <div className="mc-code-label">Mã giới thiệu</div>
              <div className="mc-code">{member.code}</div>
              <div className="mc-link">{referralLink(member.code)}</div>
              <div className="btn-row">
                <button type="button" className="btn btn-primary" onClick={() => copyLink(member.code)}>Sao chép link</button>
                <button type="button" className="btn" onClick={() => { window.location.href = referralLink(member.code) }}>Mở form bằng link</button>
              </div>
            </div>
            <div className="kpis">
              <KpiCard label="Khách đã giới thiệu" value={`${stats.total} khách`} hint={`${stats.rejected} bị hủy / không hợp lệ / trùng`} />
              <KpiCard label="Đã chuyển đổi" value={`${stats.converted} khách`} tone="good" hint={`Doanh thu ${formatVnd(stats.convertedRevenue)}`} />
              <KpiCard label="Đang chờ" value={`${stats.pending} khách`} tone={stats.pending ? 'warn' : 'neutral'} hint="Chưa cộng ưu đãi" />
              <KpiCard
                label="Tổng ưu đãi đã nhận"
                value={formatVnd(stats.totalReward)}
                tone="good"
                explain={[
                  'Tổng ưu đãi = Σ ưu đãi người giới thiệu của lượt "Đã chuyển đổi" + ưu đãi tầng 2',
                  `= ${formatVnd(stats.directReward)} (${stats.converted} lượt) + ${stats.tier2Count} lượt gián tiếp × ${formatVnd(a.tier2Reward)}`,
                  `= ${formatVnd(stats.totalReward)}`,
                  'Lượt đang chờ, đã hủy, không hợp lệ, trùng: 0 đ.',
                ]}
              />
            </div>
            <div className="card">
              <h2>Danh sách khách đã giới thiệu</h2>
              <ResponsiveTable<Referral>
                caption="Lượt giới thiệu của thành viên"
                rows={mine}
                rowKey={(r) => r.id}
                empty="Chưa giới thiệu khách nào. Gửi link ở trên cho bạn bè."
                columns={[
                  { key: 'customerName', header: 'Khách', primary: true, render: (r) => <span className="cell-main" title={r.note}>{r.customerName} <span className="hint">· {r.id}</span><span className="hint cell-sub mobile-only">{r.note}</span></span> },
                  { key: 'service', header: 'Dịch vụ', render: (r) => <span className="nowrap">{r.service}</span> },
                  { key: 'date', header: 'Ngày', render: (r) => <span className="nowrap">{fmtDate(r.date)}</span> },
                  { key: 'status', header: 'Trạng thái', render: (r) => <StatusBadge status={r.status} /> },
                  { key: 'referrerReward', header: 'Ưu đãi nhận', align: 'right', render: (r) => formatVnd(r.referrerReward) },
                ]}
                actions={(r) =>
                  PENDING_STATUSES.includes(r.status) ? (
                    <span className="act">
                      <button type="button" className="btn btn-sm btn-primary" onClick={() => setRef(r, confirmPayment(r, a), `${r.id}: thanh toán thành công, cộng ${formatVnd(a.referrerReward)} cho ${member.name}`)}>Xác nhận thanh toán</button>
                      <button type="button" className="btn btn-sm" onClick={() => setRef(r, cancelReferral(r), `${r.id}: đã hủy`)}>Hủy</button>
                    </span>
                  ) : null
                }
              />
              <p className="hint">"Xác nhận thanh toán" mô phỏng khách thanh toán thành công → chuyển "Đã chuyển đổi" và cộng ưu đãi cho cả hai phía.</p>
            </div>
          </>
        ) : (
          <div className="card"><p>Chưa có thành viên. Bấm "Đăng ký thành viên".</p></div>
        )}
      </section>

      <section className="ml-list card">
        <h2>Thành viên ({members.length})</h2>
        <div className="field">
          <label htmlFor="member-search">Tìm theo tên, mã, SĐT</label>
          <input id="member-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="VD: Mai An hoặc REF-MA01" />
        </div>
        <ul className="member-list">
          {filtered.map((m) => {
            const s = allStats.get(m.id)!
            return (
              <li key={m.id}>
                <button type="button" aria-pressed={m.id === member?.id} onClick={() => { onSelect(m.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                  <span className="mi-name">{m.name}<span className="hint"> · {m.code}</span></span>
                  <span className="mi-meta">{s.converted}/{s.total} · {formatVnd(s.totalReward)}</span>
                </button>
              </li>
            )
          })}
          {!filtered.length && <li className="hint">Không tìm thấy thành viên.</li>}
        </ul>
        <StickyActions>
          <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>+ Đăng ký thành viên</button>
        </StickyActions>
      </section>

      <ConfirmDialog
        open={open}
        title="Đăng ký thành viên"
        text="Mỗi thành viên nhận một mã và link giới thiệu riêng."
        confirmLabel="Đăng ký"
        onConfirm={submit}
        onCancel={() => { setOpen(false); setFormError('') }}
      >
        <div className="field">
          <label htmlFor="m-name">Họ tên</label>
          <input id="m-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="off" />
        </div>
        <div className="field">
          <label htmlFor="m-phone">Số điện thoại (dùng để chống tự giới thiệu)</label>
          <input id="m-phone" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="off" placeholder="VD: 0912345678" aria-invalid={formError === PHONE_ERROR || (form.phone.replace(/\D/g, '').length >= 10 && !isValidPhone(form.phone))} />
          {(formError === PHONE_ERROR || (form.phone.replace(/\D/g, '').length >= 10 && !isValidPhone(form.phone))) && <div className="error">{PHONE_ERROR}</div>}
        </div>
        <div className="field">
          <label htmlFor="m-ref">Mã người giới thiệu bạn (không bắt buộc — tầng 2)</label>
          <input id="m-ref" value={form.referredBy} onChange={(e) => setForm({ ...form, referredBy: e.target.value.toUpperCase() })} autoComplete="off" placeholder="VD: REF-MA01" />
        </div>
        {formError && formError !== PHONE_ERROR && <div className="error" role="alert">{formError}</div>}
      </ConfirmDialog>
    </div>
  )
}
