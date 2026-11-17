import { useMemo, useState } from 'react'
import type { Store } from '../App'
import { KpiCard, SplitLayout, StickyActions, useToast } from '../components/ui'
import { services, STATUS } from '../config/seed'
import type { Referral } from '../config/types'
import { checkSignup, confirmPayment, createReferral, findByCode, isValidPhone, PHONE_ERROR } from '../lib/calc/referrals'
import { formatVnd } from '../lib/format'
import { StatusBadge, todayVN } from '../lib/view'

export function SignupPage({ store, initialCode, onViewMember }: { store: Store; initialCode: string; onViewMember: (id: string) => void }) {
  const toast = useToast()
  const { members, referrals, assumptions: a } = store.data
  const [code, setCode] = useState(initialCode.toUpperCase())
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [service, setService] = useState(services[1].name)
  const [touched, setTouched] = useState(false)
  const [lastId, setLastId] = useState<string | null>(null)

  const owner = code.trim() ? findByCode(members, code) : undefined
  const price = services.find((s) => s.name === service)!.price
  const discount = Math.min(a.newReward, price)
  const check = useMemo(() => checkSignup(members, referrals, code, phone, name), [members, referrals, code, phone, name])
  const last = referrals.find((r) => r.id === lastId) ?? null
  const phoneBad = phone.trim() !== '' && (touched || phone.replace(/\D/g, '').length >= 10) && !isValidPhone(phone)

  const submit = () => {
    setTouched(true)
    const res = createReferral(members, referrals, { code, customerName: name, customerId: phone, service, revenue: price, date: todayVN() })
    if ('error' in res) return toast(res.error, 'bad')
    store.update((d) => ({ ...d, referrals: [...d.referrals, res.referral] }))
    setLastId(res.referral.id)
    const r = res.referral
    if (r.status === STATUS.waitingPayment) toast(`Đã ghi nhận ${r.id} cho ${owner?.name} — chờ thanh toán`)
    else toast(`${r.id}: ${r.status} — ${r.note}`, 'bad')
    setName('')
    setPhone('')
    setTouched(false)
  }

  const pay = (r: Referral) => {
    store.update((d) => ({ ...d, referrals: d.referrals.map((x) => (x.id === r.id ? confirmPayment(x, a) : x)) }))
    toast(`${r.id}: thanh toán thành công · khách giảm ${formatVnd(a.newReward)} · người giới thiệu +${formatVnd(a.referrerReward)}`)
  }

  const warn = check.ok && check.status !== STATUS.waitingPayment ? `Lượt này sẽ bị ghi "${check.status}": ${check.note}. Không cộng ưu đãi.` : null

  return (
    <SplitLayout
      main={
        <section className="card form-card">
          <h2>Đăng ký dịch vụ qua mã giới thiệu</h2>
          <p className="hint">Form giả lập: người được giới thiệu đăng ký hosting/domain ngay trong app.</p>
          <div className={`field${touched && !owner ? ' invalid' : ''}`}>
            <label htmlFor="s-code">Mã giới thiệu</label>
            <input id="s-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="VD: REF-MA01" autoComplete="off" />
            {code.trim() && (owner ? <div className="hint ok">✓ Người giới thiệu: <b>{owner.name}</b> ({owner.id})</div> : <div className="error">Mã giới thiệu không tồn tại</div>)}
          </div>
          <div className={`field${touched && !name.trim() ? ' invalid' : ''}`}>
            <label htmlFor="s-name">Họ tên khách</label>
            <input id="s-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
            {touched && !name.trim() && <div className="error">Nhập họ tên khách</div>}
          </div>
          <div className={`field${(touched && !phone.trim()) || phoneBad ? ' invalid' : ''}`}>
            <label htmlFor="s-phone">Số điện thoại / mã định danh khách</label>
            <input id="s-phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="off" placeholder="VD: 0912345678" />
            {touched && !phone.trim() ? <div className="error">Nhập số điện thoại</div> : phoneBad ? <div className="error">{PHONE_ERROR}</div> : <div className="hint">Dùng để phát hiện tự giới thiệu và khách trùng.</div>}
          </div>
          <fieldset className="choice-list">
            <legend>Dịch vụ</legend>
            {services.map((s) => (
              <button key={s.name} type="button" className="choice" aria-pressed={s.name === service} onClick={() => setService(s.name)}>
                <span>{s.name}</span>
                <span className="num">{formatVnd(s.price)}/{s.unit}</span>
              </button>
            ))}
          </fieldset>
          {warn && <div className="alert warn" role="status">⚠️ {warn}</div>}
          <StickyActions>
            <button type="button" className="btn btn-primary" onClick={submit}>Đăng ký dịch vụ</button>
          </StickyActions>
        </section>
      }
      aside={
        <>
          <div className="kpis">
            <KpiCard label="Giá đơn đầu tiên" value={formatVnd(price)} hint={`${service} · /${services.find((s) => s.name === service)!.unit}`} />
            <KpiCard
              label="Khách phải trả"
              value={formatVnd(price - (owner ? discount : 0))}
              tone="good"
              hint={owner ? `Đã giảm ${formatVnd(discount)}` : 'Nhập mã để được giảm'}
              explain={[`Phải trả = Giá − Ưu đãi khách mới`, `= ${formatVnd(price)} − ${formatVnd(owner ? discount : 0)}`, `= ${formatVnd(price - (owner ? discount : 0))}`, 'Ưu đãi chỉ áp dụng khi thanh toán thành công.']}
            />
          </div>
          {owner && <p className="hint">Khi bạn thanh toán thành công, {owner.name} nhận {formatVnd(a.referrerReward)} ưu đãi.</p>}
          {last && (
            <div className="card last-card">
              <h3>Lượt vừa ghi nhận</h3>
              <div className="row-between"><span>{last.id} · {last.customerName}</span><StatusBadge status={last.status} /></div>
              <div className="hint">{last.service} · {formatVnd(last.revenue)} · {last.note}</div>
              <div className="btn-row">
                {last.status === STATUS.waitingPayment && <button type="button" className="btn btn-primary" onClick={() => pay(last)}>Mô phỏng thanh toán</button>}
                <button type="button" className="btn" onClick={() => onViewMember(last.memberId)}>Xem trang người giới thiệu</button>
              </div>
            </div>
          )}
        </>
      }
    />
  )
}
