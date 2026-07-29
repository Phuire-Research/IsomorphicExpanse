/**
 * usePelb — CDBL · Photonic-External-Link-Bridge composable (Diamond RAR · W7)
 *
 * Extracted verbatim from CadmiumBulletin.vue:75-96 (the PELB `handleArticleClick`). A single
 * shared external-link intercept reused by EVERY article-rendering surface (the folded
 * TopicBulletin in CadmiumResearchFrontier AND CadmiumResearchBulletin) — no duplicated logic.
 *
 * PELB · intercept anchor clicks inside a rendered (v-html) article. If the click target (or an
 * ancestor) is an `<a href="http(s)://…">` AND the Electron bridge (`window.scs`) is present, open
 * the URL externally (the user's default browser · NOT the Electron window) and prevent in-window
 * navigation. On the web SSR client `window.scs` is undefined → the handler no-ops → the link
 * follows normally. Chain: anchor → window.scs.openUrl → preload `scs:open-url` → main
 * shell.openExternal (default browser). The `^https?://` gate guards the external open.
 *
 * Citation: CadmiumBulletin.vue:75-96 (verbatim PELB) · RAR-DIAMOND-WGB.md §W7 (CDBL).
 */
export function usePelb(): { handleExternalLinkClick: (e: MouseEvent) => void } {
  function handleExternalLinkClick(e: MouseEvent): void {
    const path = e.composedPath ? e.composedPath() : [];
    let anchor: HTMLAnchorElement | null = null;
    for (const node of path) {
      if (node instanceof HTMLAnchorElement) {
        anchor = node;
        break;
      }
    }
    if (!anchor) {
      const target = e.target;
      if (target instanceof HTMLAnchorElement) anchor = target;
    }
    if (!anchor) return;
    const href = anchor.href;
    if (!href || !/^https?:\/\//i.test(href)) return;
    const bridge = (window as unknown as { scs?: { openUrl?: (url: string) => void } }).scs;
    if (bridge && typeof bridge.openUrl === 'function') {
      e.preventDefault();
      bridge.openUrl(href);
    }
  }

  return { handleExternalLinkClick };
}
