/** True when the page is opened as the public Telegram Mini App (no admin login needed). */
export function detectMiniApp(): boolean {
  if (typeof window === 'undefined') return false;
  const { pathname, search } = window.location;
  return (
    pathname.includes('mini-modasr-arz') ||
    pathname.startsWith('/miniapp') ||
    pathname.startsWith('/app') ||
    search.includes('view=miniapp') ||
    search.includes('app=mini-modasr-arz') ||
    search.includes('secret=mini-modasr-arz') ||
    search.includes('tgWebApp') ||
    Boolean((window as any).Telegram?.WebApp?.initData)
  );
}
