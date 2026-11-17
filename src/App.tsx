import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppShell, ConfirmDialog, EmptyState, ToastProvider, useToast } from './components/ui'
import { VersionFooter } from './components/VersionFooter'
import { sampleAssumptions, sampleMembers, sampleReferrals } from './config/seed'
import type { AppData } from './config/types'
import { usePersistentState } from './lib/storage'
import { formatDateTime } from './lib/format'
import { MembersPage } from './pages/MembersPage'
import { SignupPage } from './pages/SignupPage'
import { RulesPage } from './pages/RulesPage'
import { EconomicsPage } from './pages/EconomicsPage'
import { DataPage } from './pages/DataPage'

const TABS = [
  { id: 'members', label: 'Thành viên', icon: <span aria-hidden>👥</span> },
  { id: 'signup', label: 'Đăng ký', icon: <span aria-hidden>📝</span> },
  { id: 'rules', label: 'Thể lệ', icon: <span aria-hidden>📜</span> },
  { id: 'economics', label: 'Kinh tế', icon: <span aria-hidden>📈</span> },
  { id: 'data', label: 'Dữ liệu', icon: <span aria-hidden>💾</span> },
]

/** Đọc #tab?ma=CODE từ địa chỉ. */
function readHash() {
  const raw = window.location.hash.replace(/^#/, '')
  const [tab, query] = raw.split('?')
  const code = new URLSearchParams(query ?? '').get('ma') ?? ''
  return { tab: TABS.some((t) => t.id === tab) ? tab : 'members', code }
}

const sampleData = (): AppData => ({
  members: sampleMembers,
  referrals: sampleReferrals,
  assumptions: sampleAssumptions,
  source: { kind: 'sample', at: new Date().toISOString(), edited: false },
})

export type Store = {
  data: AppData
  update: (fn: (d: AppData) => AppData) => void
}

function Inner() {
  const toast = useToast()
  const [data, setData] = usePersistentState<AppData | null>('referral-data', null)
  const [{ tab, code }, setRoute] = useState(readHash)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [askSample, setAskSample] = useState(false)

  useEffect(() => {
    const onHash = () => setRoute(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = useCallback((id: string, c = '') => {
    const h = `#${id}${c ? `?ma=${encodeURIComponent(c)}` : ''}`
    if (window.location.hash !== h) window.history.replaceState(null, '', h)
    setRoute({ tab: id, code: c })
    window.scrollTo({ top: 0 })
  }, [])

  const update = useCallback(
    (fn: (d: AppData) => AppData) => setData((d) => (d ? { ...fn(d), source: { ...d.source, edited: true } } : d)),
    [setData],
  )

  const doLoadSample = () => {
    setData(sampleData())
    setSelectedId('KD-001')
    setAskSample(false)
    toast('Đã nạp dữ liệu mẫu BTC: 8 thành viên, 12 lượt giới thiệu')
  }
  const loadSample = () => (data ? setAskSample(true) : doLoadSample())

  const sourceLabel = useMemo(() => {
    if (!data) return <span className="badge">Chưa có dữ liệu</span>
    const s = data.source
    const text = s.kind === 'sample' ? 'Dữ liệu mẫu BTC' : s.kind === 'upload' ? `Dữ liệu thật — tải lên ${formatDateTime(s.at)}` : 'Dữ liệu thật — nhập tay'
    return (
      <>
        <span className={`badge ${s.kind === 'sample' ? 'src-sample' : 'src-real'}`}>{text}</span>
        {s.edited && <span className="badge changed">đã chỉnh</span>}
        <span className="badge sim">Mô phỏng</span>
        <span className="desktop-only">· Dữ liệu lưu trên máy này</span>
      </>
    )
  }, [data])

  const empty = (
    <EmptyState
      title="Chưa có dữ liệu"
      text="Nạp bộ dữ liệu mẫu của Ban tổ chức (8 thành viên, 12 lượt giới thiệu ở đủ trạng thái) hoặc nạp dữ liệu thật của bạn."
      actions={
        <>
          <button type="button" className="btn btn-primary btn-block" data-action="load-sample" onClick={loadSample}>
            Nạp dữ liệu mẫu BTC
          </button>
          <button type="button" className="btn btn-block" data-action="load-real" onClick={() => go('data')}>
            Nạp dữ liệu thật
          </button>
        </>
      }
    />
  )

  const store: Store | null = data ? { data, update } : null

  return (
    <AppShell title="Giới thiệu khách – Hosting & Domain" logo={<img className="brand-logo" src="./logo.jpg" alt="Logo RAUMA" width="44" height="44" />} subtitle={sourceLabel} tabs={TABS} active={tab} onTab={(id) => go(id)} footer={<VersionFooter />}>
      {tab === 'rules' ? (
        <RulesPage assumptions={data?.assumptions ?? sampleAssumptions} />
      ) : tab === 'data' ? (
        <DataPage data={data} setData={setData} onLoadSample={loadSample} />
      ) : !store ? (
        empty
      ) : tab === 'members' ? (
        <MembersPage store={store} selectedId={selectedId ?? store.data.members[0]?.id ?? null} onSelect={setSelectedId} />
      ) : tab === 'signup' ? (
        <SignupPage store={store} initialCode={code} onViewMember={(id) => { setSelectedId(id); go('members') }} />
      ) : (
        <EconomicsPage store={store} />
      )}
      <ConfirmDialog
        open={askSample}
        title="Nạp lại dữ liệu mẫu BTC?"
        text="Toàn bộ thành viên, lượt giới thiệu và giả định hiện tại sẽ được thay bằng dữ liệu mẫu BTC."
        confirmLabel="Nạp dữ liệu mẫu"
        danger
        onConfirm={doLoadSample}
        onCancel={() => setAskSample(false)}
      />
    </AppShell>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Inner />
    </ToastProvider>
  )
}
