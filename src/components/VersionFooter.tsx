// Chân trang phiên bản: giám khảo đối chiếu bản demo với commit trong repo.
// Đặt cuối nội dung trang (trên thanh tab), hiện ở mọi tab.
import { formatDateTime } from '../lib/format'

declare const __APP_COMMIT__: string
declare const __APP_BUILD_TIME__: string
declare const __APP_REPO__: string

export function VersionFooter() {
  const hash = __APP_COMMIT__.replace('+sua', '')
  const link = __APP_REPO__ && hash !== 'chua-commit' ? `${__APP_REPO__}/commit/${hash}` : undefined
  return (
    <footer className="version" data-version={__APP_COMMIT__}>
      Phiên bản{' '}
      {link ? (
        <a href={link} target="_blank" rel="noreferrer">
          {__APP_COMMIT__}
        </a>
      ) : (
        <span>{__APP_COMMIT__}</span>
      )}{' '}
      · build {formatDateTime(__APP_BUILD_TIME__)}
    </footer>
  )
}
