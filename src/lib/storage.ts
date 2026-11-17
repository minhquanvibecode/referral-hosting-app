import { useEffect, useState } from 'react'

// Lưu trữ localStorage an toàn: mọi đọc/ghi bọc try/catch, có phiên bản dữ liệu.
// Đổi cấu trúc dữ liệu → tăng VERSION, dữ liệu cũ bị bỏ qua và app dùng dữ liệu mẫu.
const VERSION = 1
const PREFIX = 'exam-app'

type Envelope<T> = { v: number; savedAt: string; data: T }

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PREFIX}:${key}`)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Envelope<T>
    return parsed.v === VERSION ? parsed.data : fallback
  } catch {
    return fallback
  }
}

export function save<T>(key: string, data: T): boolean {
  try {
    const env: Envelope<T> = { v: VERSION, savedAt: new Date().toISOString(), data }
    localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(env))
    return true
  } catch {
    return false // chế độ ẩn danh / bộ nhớ đầy: app vẫn chạy, chỉ không lưu
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(`${PREFIX}:${key}`)
  } catch {
    /* bỏ qua */
  }
}

/** Hook React: state tự lưu vào localStorage. */
export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => load(key, fallback))
  useEffect(() => {
    save(key, value)
  }, [key, value])
  return [value, setValue] as const
}
