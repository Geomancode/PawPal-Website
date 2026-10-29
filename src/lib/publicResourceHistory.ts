import { stripLocalePrefix } from "../i18n/routing";

export function isPublicResourcePath(pathname: string) {
  return /^\/(post|user|tag|pet)\/[^/]+\/?$/.test(stripLocalePrefix(pathname));
}

/** Revalidate restored public resources, including their serialized metadata. */
export function watchPublicResourceHistory(browser: Window) {
  const locationKey = () => browser.location.pathname + browser.location.search;
  let currentLocation = locationKey();
  let reloading = false;
  let disposed = false;
  const reload = (event: Event) => {
    event.stopImmediatePropagation();
    if (reloading) return;
    reloading = true;
    browser.location.reload();
  };
  const onPopState = (event: PopStateEvent) => {
    if (isPublicResourcePath(browser.location.pathname) && locationKey() !== currentLocation) {
      reload(event);
      return;
    }
    currentLocation = locationKey();
  };
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted && isPublicResourcePath(browser.location.pathname)) reload(event);
  };
  browser.addEventListener("popstate", onPopState, true);
  browser.addEventListener("pageshow", onPageShow, true);
  return {
    // Window-target events run listeners in registration order. Next may commit
    // its restoration first. Microtasks can run between native listeners, so
    // retain the previous URL until the next browser task.
    update() {
      setTimeout(() => {
        if (!disposed && !reloading) currentLocation = locationKey();
      });
    },
    dispose() {
      disposed = true;
      browser.removeEventListener("popstate", onPopState, true);
      browser.removeEventListener("pageshow", onPageShow, true);
    },
  };
}
