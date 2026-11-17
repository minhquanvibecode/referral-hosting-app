import { useState } from 'react'
import { ConfirmDialog, useToast } from '../components/ui'
import { dataSchema, excelGuide, fromDataset, toDataset } from '../config/dataSchema'
import { sampleAssumptions } from '../config/seed'
import type { AppData } from '../config/types'
import { downloadWorkbook, fileStamp, formatImportError, readWorkbookFile, type ImportError } from '../lib/excel'

type Preview = { data: Omit<AppData, 'source'>; name: string }

export function DataPage({ data, setData, onLoadSample }: { data: AppData | null; setData: (d: AppData | null) => void; onLoadSample: () => void }) {
  const toast = useToast()
  const [errors, setErrors] = useState<ImportError[]>([])
  const [preview, setPreview] = useState<Preview | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState<null | 'upload' | 'manual' | 'clear'>(null)

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setErrors([])
    setPreview(null)
    const res = await readWorkbookFile(file, dataSchema)
    setBusy(false)
    if (res.errors.length || !res.data) return setErrors(res.errors)
    setPreview({ data: fromDataset(res.data, sampleAssumptions), name: file.name })
  }

  const apply = (kind: 'upload' | 'manual' | 'clear') => {
    if (kind === 'clear') {
      setData(null)
      toast('Đã xoá toàn bộ dữ liệu trên máy này')
    } else if (kind === 'manual') {
      setData({ members: [], referrals: [], assumptions: sampleAssumptions, source: { kind: 'manual', at: new Date().toISOString(), edited: false } })
      toast('Bắt đầu nhập tay: vào tab Thành viên để đăng ký thành viên đầu tiên')
    } else if (preview) {
      setData({ ...preview.data, source: { kind: 'upload', at: new Date().toISOString(), edited: false } })
      toast(`Đã nạp ${preview.data.members.length} thành viên, ${preview.data.referrals.length} lượt từ ${preview.name}`)
      setPreview(null)
    }
    setConfirm(null)
  }
  const ask = (kind: 'upload' | 'manual' | 'clear') => (data ? setConfirm(kind) : apply(kind))

  return (
    <div className="grid-2">
      <div className="stack">
        <section className="card">
          <h2>Dữ liệu mẫu của Ban tổ chức</h2>
          <p className="hint">8 thành viên (KD_ThanhVien), 12 lượt giới thiệu ở các trạng thái: đã chuyển đổi, đang chờ thanh toán, đang xử lý, đang rà soát, đã hủy, tự giới thiệu, trùng (KD_GioiThieu) và giả định dự phóng (KD_GiaDinh).</p>
          <button type="button" className="btn btn-primary btn-block" data-action="load-sample" onClick={onLoadSample}>Nạp dữ liệu mẫu BTC</button>
        </section>
        <section className="card">
          <h2>Tải dữ liệu hiện tại</h2>
          <p className="hint">Xuất đúng mẫu Excel (3 sheet) để sao lưu hoặc sửa rồi tải lên lại. Trên iPhone chọn "Lưu vào Tệp".</p>
          <button type="button" className="btn btn-block" disabled={!data} onClick={() => data && downloadWorkbook(dataSchema, toDataset(data.members, data.referrals, data.assumptions), `gioi-thieu-hosting-du-lieu-${fileStamp()}.xlsx`, excelGuide)}>
            Tải dữ liệu hiện tại (.xlsx)
          </button>
          <button type="button" className="btn btn-block btn-danger" disabled={!data} onClick={() => setConfirm('clear')}>Xoá toàn bộ dữ liệu</button>
        </section>
      </div>
      <div className="stack">
        <section className="card">
          <h2>Nạp dữ liệu thật</h2>
          <h3>Cách 1 — File Excel</h3>
          <ol className="steps">
            <li><button type="button" className="btn" onClick={() => downloadWorkbook(dataSchema, null, 'gioi-thieu-hosting-mau.xlsx', excelGuide)}>Tải file Excel mẫu</button></li>
            <li>Điền 3 sheet KD_ThanhVien, KD_GioiThieu, KD_GiaDinh (có thể dùng nguyên file BTC).</li>
            <li>
              <label className="btn file-btn">
                {busy ? 'Đang đọc file…' : 'Tải file lên (.xlsx, .xls, .csv)'}
                <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
              </label>
            </li>
          </ol>
          {errors.length > 0 && (
            <div className="import-errors" role="alert">
              <b>File có {errors.length} lỗi, chưa nạp gì:</b>
              <ul>{errors.map((e, i) => <li key={i}>{formatImportError(e)}</li>)}</ul>
            </div>
          )}
          {preview && (
            <div className="import-preview">
              <p>Sẽ nạp <b>{preview.data.members.length} thành viên</b> · <b>{preview.data.referrals.length} lượt giới thiệu</b> · giả định từ "{preview.name}".</p>
              <div className="btn-row">
                <button type="button" className="btn btn-primary" onClick={() => ask('upload')}>Xác nhận nạp</button>
                <button type="button" className="btn" onClick={() => setPreview(null)}>Huỷ</button>
              </div>
            </div>
          )}
          <h3>Cách 2 — Nhập trực tiếp trên app</h3>
          <p className="hint">Bắt đầu với danh sách trống + giả định BTC, rồi: đăng ký thành viên ở tab <b>Thành viên</b>, ghi lượt ở tab <b>Đăng ký DV</b>, sửa giả định ở tab <b>Kinh tế</b>.</p>
          <button type="button" className="btn btn-block" onClick={() => ask('manual')}>Bắt đầu nhập tay</button>
        </section>
      </div>
      <ConfirmDialog
        open={confirm !== null}
        title={confirm === 'clear' ? 'Xoá toàn bộ dữ liệu?' : 'Thay dữ liệu hiện tại?'}
        text={confirm === 'clear' ? 'Thành viên, lượt giới thiệu và giả định trên máy này sẽ bị xoá. Không hoàn tác được.' : 'Toàn bộ thành viên, lượt giới thiệu và giả định hiện tại sẽ được thay thế.'}
        confirmLabel={confirm === 'clear' ? 'Xoá' : 'Thay dữ liệu'}
        danger
        onConfirm={() => confirm && apply(confirm)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  )
}
