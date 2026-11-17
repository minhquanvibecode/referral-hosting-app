// Bộ thành phần giao diện dùng chung — tối ưu song song cho di động (< 768px) và desktop (≥ 768px).
// CSS đi kèm nằm trong base.css. Chép vào src/components/ui.tsx.
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'

/* ---------- Khung trang ---------- */
export type TabItem = { id: string; label: string; icon?: ReactNode }

/** Khung app: header → thanh tab (đáy trên di động, đầu trang trên desktop) → nội dung → chân trang. */
export function AppShell(props: {
  title: string
  subtitle?: ReactNode // ví dụ nhãn nguồn dữ liệu
  tabs: TabItem[]
  active: string
  onTab: (id: string) => void
  footer?: ReactNode // <VersionFooter />
  children: ReactNode
}) {
  return (
    <>
      <header className="app-header">
        <h1>{props.title}</h1>
        {props.subtitle && <div className="data-source">{props.subtitle}</div>}
      </header>
      <nav className="tabbar" aria-label="Điều hướng chính">
        {props.tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            data-tab={t.id}
            aria-current={props.active === t.id ? 'page' : undefined}
            onClick={() => {
              props.onTab(t.id)
              window.scrollTo({ top: 0 })
            }}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
      <main className="app-main">
        {props.children}
        {props.footer}
      </main>
    </>
  )
}

/** Desktop: nhập bên trái, kết quả dính bên phải. Di động: kết quả (gọn) lên trên, nhập bên dưới. */
export function SplitLayout({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <div className="split">
      <div className="split-main">{main}</div>
      <aside className="split-aside">{aside}</aside>
    </div>
  )
}

/* ---------- Số liệu ---------- */
type Tone = 'good' | 'bad' | 'warn' | 'neutral'

export function KpiCard({ label, value, tone = 'neutral', hint, explain }: { label: string; value: ReactNode; tone?: Tone; hint?: ReactNode; explain?: string[] }) {
  return (
    <div className={`kpi tone-${tone}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint && <div className="hint">{hint}</div>}
      {explain && <Explain lines={explain} />}
    </div>
  )
}

/** Khối "Cách tính": công thức chữ → số thật → kết quả → lý do làm tròn. */
export function Explain({ lines, title = 'Cách tính' }: { lines: string[]; title?: string }) {
  return (
    <details className="how">
      <summary>{title}</summary>
      <div className="how-body">
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </details>
  )
}

/* ---------- Nhập liệu ---------- */
export function NumberField(props: {
  label: string
  value: number
  onChange: (v: number) => void
  unit?: string
  min?: number
  max?: number
  integer?: boolean
  hint?: string
  defaultValue?: number // giá trị BTC → hiện nhãn "đã chỉnh" + nút ↺ khi khác
  format?: (v: number) => string // hiển thị khi không gõ (vd 20.000)
}) {
  const id = useId()
  const [text, setText] = useState(() => (props.format ? props.format(props.value) : String(props.value)))
  const [error, setError] = useState<string | null>(null)
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(props.format ? props.format(props.value) : String(props.value))
  }, [props.value, props.format])

  const parse = (raw: string) => {
    const s = raw.trim()
    if (s === '') return { error: 'Không được để trống' }
    const n = props.integer ? Number(s.replace(/[.\s]/g, '')) : Number(s.replace(/\s/g, '').replace(',', '.'))
    if (!Number.isFinite(n)) return { error: 'Phải là số' }
    if (props.integer && !Number.isInteger(n)) return { error: 'Phải là số nguyên' }
    if (props.min !== undefined && n < props.min) return { error: `Phải ≥ ${props.min.toLocaleString('vi-VN')}` }
    if (props.max !== undefined && n > props.max) return { error: `Phải ≤ ${props.max.toLocaleString('vi-VN')}` }
    return { value: n }
  }
  const changed = props.defaultValue !== undefined && props.value !== props.defaultValue

  return (
    <div className={`field${error ? ' invalid' : ''}${changed ? ' changed' : ''}`}>
      <label htmlFor={id}>
        {props.label} {changed && <span className="badge changed">đã chỉnh</span>}
      </label>
      <div className="control">
        <input
          id={id}
          inputMode={props.integer ? 'numeric' : 'decimal'}
          value={text}
          aria-invalid={!!error}
          aria-describedby={error || props.hint ? `${id}-msg` : undefined}
          onFocus={() => {
            focused.current = true
            setText(String(props.value))
          }}
          onBlur={() => {
            focused.current = false
            if (!error) setText(props.format ? props.format(props.value) : String(props.value))
          }}
          onChange={(e) => {
            setText(e.target.value)
            const r = parse(e.target.value)
            setError(r.error ?? null)
            if (r.value !== undefined) props.onChange(r.value)
          }}
        />
        {props.unit && <span className="unit">{props.unit}</span>}
        {changed && (
          <button type="button" className="btn btn-icon" aria-label={`Trả ${props.label} về giá trị BTC`} onClick={() => { setError(null); props.onChange(props.defaultValue!) }}>
            ↺
          </button>
        )}
      </div>
      {(error || props.hint) && (
        <div id={`${id}-msg`} className={error ? 'error' : 'hint'}>
          {error ?? props.hint}
        </div>
      )}
    </div>
  )
}

/** Chọn một trong vài lựa chọn (kịch bản, sản phẩm). */
export function SegmentedControl<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ---------- Danh sách ---------- */
export type Column<T> = { key: string; header: string; render?: (row: T) => ReactNode; align?: 'left' | 'right'; primary?: boolean }

/** Desktop: bảng. Di động: mỗi dòng một thẻ (cột primary làm tiêu đề thẻ). */
export function ResponsiveTable<T>({ columns, rows, rowKey, actions, empty = 'Chưa có dữ liệu.', caption }: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; actions?: (row: T) => ReactNode; empty?: string; caption?: string }) {
  const cell = (c: Column<T>, r: T) => (c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? ''))
  if (!rows.length) return <p className="hint">{empty}</p>
  const primary = columns.find((c) => c.primary) ?? columns[0]
  return (
    <>
      <div className="table-wrap rt-table">
        <table>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={c.align === 'right' ? 'num' : undefined}>{c.header}</th>
              ))}
              {actions && <th className="num">Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)}>
                {columns.map((c) => (
                  <td key={c.key} className={c.align === 'right' ? 'num' : undefined}>{cell(c, r)}</td>
                ))}
                {actions && <td className="num">{actions(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="rt-cards">
        {rows.map((r) => (
          <li key={rowKey(r)} className="rt-card">
            <div className="rt-title">{cell(primary, r)}</div>
            <dl>
              {columns.filter((c) => c !== primary).map((c) => (
                <div key={c.key}>
                  <dt>{c.header}</dt>
                  <dd className={c.align === 'right' ? 'num' : undefined}>{cell(c, r)}</dd>
                </div>
              ))}
            </dl>
            {actions && <div className="btn-row">{actions(r)}</div>}
          </li>
        ))}
      </ul>
    </>
  )
}

/* ---------- Hành động & trạng thái ---------- */
/** Di động: thanh nút dính ngay trên thanh tab. Desktop: hàng nút cuối form, căn phải. */
export function StickyActions({ children }: { children: ReactNode }) {
  return <div className="sticky-actions">{children}</div>
}

export function EmptyState({ title, text, actions }: { title: string; text?: string; actions: ReactNode }) {
  return (
    <section className="card empty">
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      <div className="empty-actions">{actions}</div>
    </section>
  )
}

/* ---------- Toast ---------- */
type ToastMsg = { id: number; text: string; tone: Tone }
const ToastCtx = createContext<(text: string, tone?: Tone) => void>(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastMsg[]>([])
  const show = useCallback((text: string, tone: Tone = 'good') => {
    const id = Date.now() + Math.random()
    setItems((xs) => [...xs.slice(-2), { id, text, tone }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), 2800)
  }, [])
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast tone-${t.tone}`}>{t.text}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ---------- Hộp thoại xác nhận ---------- */
/** Di động: bottom sheet. Desktop: hộp thoại giữa màn hình. Esc / bấm nền để huỷ. */
export function ConfirmDialog(props: { open: boolean; title: string; text?: ReactNode; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void; children?: ReactNode }) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const { open, onCancel } = props
  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onCancel])
  if (!open) return null
  return (
    <div className="dialog-backdrop" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h3 id="dlg-title">{props.title}</h3>
        {props.text && <div className="dialog-text">{props.text}</div>}
        {props.children}
        <div className="dialog-actions">
          <button type="button" className="btn" onClick={onCancel}>{props.cancelLabel ?? 'Huỷ'}</button>
          <button ref={confirmRef} type="button" data-action="confirm" className={`btn ${props.danger ? 'btn-danger-solid' : 'btn-primary'}`} onClick={props.onConfirm}>
            {props.confirmLabel ?? 'Đồng ý'}
          </button>
        </div>
      </div>
    </div>
  )
}
