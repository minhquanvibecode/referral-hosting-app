// Nạp/xuất dữ liệu bằng file Excel theo cấu trúc khai báo trong src/config/dataSchema.ts.
// Cài: npm i https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
// Thư viện Excel (~400 KB) chỉ tải khi người dùng bấm tải/nạp file → app mở nhanh.
// validateValue / validateRows không cần thư viện, dùng đồng bộ cho form nhập tay.
import type { WorkBook } from 'xlsx'

let xlsxPromise: Promise<typeof import('xlsx')> | null = null
export const loadXLSX = () => (xlsxPromise ??= import('xlsx'))

export type ColType = 'text' | 'int' | 'money' | 'number' | 'percent'

export type Column = {
  key: string
  header: string // tiêu đề trong Excel, kèm đơn vị: "Giá bán/phần (đ)"
  type: ColType
  required?: boolean
  min?: number
  max?: number // percent: tính theo tỷ lệ (1 = 100%)
  width?: number // độ rộng cột Excel (ký tự)
}

export type SheetSpec = {
  key: string // khoá trong object dữ liệu: "products"
  sheet: string // tên sheet: "Sản phẩm"
  columns: Column[]
  minRows?: number
}

export type Row = Record<string, string | number>
export type Dataset = Record<string, Row[]>
export type ImportError = { sheet: string; row?: number; column?: string; message: string }

const norm = (s: unknown) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
const isBlank = (v: unknown) => v === undefined || v === null || String(v).trim() === ''

/** Kiểm tra + chuẩn hoá một ô. percent trả về tỷ lệ (55 → 0.55). */
export function validateValue(col: Column, raw: unknown): { value?: string | number; error?: string } {
  if (isBlank(raw)) return col.required ? { error: 'không được để trống' } : { value: col.type === 'text' ? '' : 0 }
  if (col.type === 'text') return { value: String(raw).trim() }

  let n: number
  if (typeof raw === 'number') n = raw
  else {
    const s = String(raw).trim()
    if (col.type === 'percent') {
      const hasPct = s.includes('%')
      const v = Number(s.replace('%', '').replace(',', '.').replace(/\s/g, ''))
      n = hasPct ? v / 100 : v
    } else if (col.type === 'number') {
      n = Number(s.replace(/\s/g, '').replace(',', '.'))
    } else {
      const cleaned = s.replace(/[^\d-]/g, '') // "20.000 đ" → 20000
      n = cleaned === '' || cleaned === '-' ? NaN : Number(cleaned)
    }
  }
  if (!Number.isFinite(n)) return { error: 'phải là số' }
  if (col.type === 'percent' && n > 1) n = n / 100
  if ((col.type === 'int' || col.type === 'money') && !Number.isInteger(n)) return { error: 'phải là số nguyên' }

  const shown = (x: number) => (col.type === 'percent' ? `${x * 100}%` : x.toLocaleString('vi-VN'))
  if (col.min !== undefined && n < col.min) return { error: `phải ≥ ${shown(col.min)}` }
  if (col.max !== undefined && n > col.max) return { error: `phải ≤ ${shown(col.max)}` }
  return { value: n }
}

/** Kiểm tra danh sách dòng (dùng cho form nhập tay, dữ liệu mẫu và file tải lên). firstRow = số dòng Excel của phần tử đầu. */
export function validateRows(spec: SheetSpec, rows: Record<string, unknown>[], firstRow = 2) {
  const errors: ImportError[] = []
  const out: Row[] = []
  rows.forEach((r, i) => {
    const row: Row = {}
    for (const col of spec.columns) {
      const res = validateValue(col, r[col.key])
      if (res.error) errors.push({ sheet: spec.sheet, row: firstRow + i, column: col.header, message: res.error })
      else row[col.key] = res.value!
    }
    out.push(row)
  })
  if (spec.minRows && rows.length < spec.minRows)
    errors.push({ sheet: spec.sheet, message: `cần ít nhất ${spec.minRows} dòng dữ liệu` })
  return { rows: out, errors }
}

/** Đọc workbook đã mở → dữ liệu hoặc danh sách lỗi (tất cả hoặc không gì cả). */
export async function parseWorkbook(wb: WorkBook, specs: SheetSpec[]): Promise<{ data?: Dataset; errors: ImportError[] }> {
  const XLSX = await loadXLSX()
  const errors: ImportError[] = []
  const data: Dataset = {}
  const sheetByName = new Map(wb.SheetNames.map((n) => [norm(n), n]))

  for (const spec of specs) {
    const name = sheetByName.get(norm(spec.sheet)) ?? (specs.length === 1 ? wb.SheetNames.find((n) => norm(n) !== 'hướng dẫn') : undefined)
    if (!name) {
      errors.push({ sheet: spec.sheet, message: 'thiếu sheet này trong file' })
      continue
    }
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], { header: 1, raw: true, defval: '' })
    // Tìm dòng tiêu đề trong 15 dòng đầu (file BTC có dòng tiêu đề lớn + mô tả phía trên)
    let headerIdx = 0
    let best = -1
    matrix.slice(0, 15).forEach((cells, i) => {
      const hs = (cells ?? []).map(norm)
      const hit = spec.columns.filter((c) => hs.includes(norm(c.header)) || hs.includes(norm(c.key))).length
      if (hit > best) { best = hit; headerIdx = i }
    })
    const header = (matrix[headerIdx] ?? []).map(norm)
    const colIndex = new Map<string, number>()
    for (const col of spec.columns) {
      const idx = header.findIndex((h) => h === norm(col.header) || h === norm(col.key))
      if (idx === -1) {
        if (col.required) errors.push({ sheet: spec.sheet, row: headerIdx + 1, column: col.header, message: 'thiếu cột này (không đổi tên tiêu đề cột)' })
      } else colIndex.set(col.key, idx)
    }
    const rows: Record<string, unknown>[] = []
    const rowNumbers: number[] = []
    matrix.slice(headerIdx + 1).forEach((cells, i) => {
      if (!cells || cells.every(isBlank)) return
      const r: Record<string, unknown> = {}
      for (const [key, idx] of colIndex) r[key] = cells[idx]
      rows.push(r)
      rowNumbers.push(i + headerIdx + 2)
    })
    const res = validateRows(spec, rows)
    // đổi số dòng về đúng dòng Excel (đã bỏ dòng trống)
    for (const e of res.errors) if (e.row !== undefined) e.row = rowNumbers[e.row - 2]
    errors.push(...res.errors)
    data[spec.key] = res.rows
  }
  return errors.length ? { errors } : { data, errors }
}

/** Đọc file người dùng chọn (.xlsx, .xls, .csv). */
export async function readWorkbookFile(file: File, specs: SheetSpec[]) {
  try {
    const XLSX = await loadXLSX()
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    return await parseWorkbook(wb, specs)
  } catch {
    return { errors: [{ sheet: file.name, message: 'không đọc được file — hãy dùng file Excel mẫu (.xlsx)' }] as ImportError[] }
  }
}

/** Tạo workbook: sheet "Hướng dẫn" + mỗi bảng một sheet. data = null → file mẫu trống. */
export async function buildWorkbook(specs: SheetSpec[], data: Dataset | null, guide: string[]): Promise<WorkBook> {
  const XLSX = await loadXLSX()
  const wb = XLSX.utils.book_new()
  const guideWs = XLSX.utils.aoa_to_sheet([['Hướng dẫn'], ...guide.map((g) => [g])])
  guideWs['!cols'] = [{ wch: 90 }]
  XLSX.utils.book_append_sheet(wb, guideWs, 'Hướng dẫn')
  for (const spec of specs) {
    const rows = (data?.[spec.key] ?? []).map((r) =>
      spec.columns.map((c) => (c.type === 'percent' ? Math.round(Number(r[c.key]) * 10000) / 100 : r[c.key])),
    )
    const ws = XLSX.utils.aoa_to_sheet([spec.columns.map((c) => c.header), ...rows])
    ws['!cols'] = spec.columns.map((c) => ({ wch: c.width ?? Math.max(14, c.header.length + 2) }))
    XLSX.utils.book_append_sheet(wb, ws, spec.sheet.slice(0, 31))
  }
  return wb
}

/** Tải xuống trình duyệt. */
export async function downloadWorkbook(specs: SheetSpec[], data: Dataset | null, fileName: string, guide: string[]) {
  const XLSX = await loadXLSX()
  XLSX.writeFile(await buildWorkbook(specs, data, guide), fileName)
}

/** Gộp lỗi thành câu tiếng Việt để hiển thị. */
export const formatImportError = (e: ImportError) =>
  `Sheet "${e.sheet}"${e.row ? `, dòng ${e.row}` : ''}${e.column ? `, cột "${e.column}"` : ''}: ${e.message}.`

/** Hậu tố thời gian cho tên file: 20261117-1055 (giờ Việt Nam). */
export function fileStamp(d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  )
  return `${p.year}${p.month}${p.day}-${p.hour}${p.minute}`
}
