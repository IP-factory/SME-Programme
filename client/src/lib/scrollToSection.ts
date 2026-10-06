/**
 * Scrolls to a section on the page, clear of the sticky header. Done by hand rather than with the
 * browser's anchor jump or scrollIntoView, which some embedding hosts (such as the claude.ai preview
 * frame) intercept or ignore. Falls back to setting the scroll position directly.
 */
export function scrollToSection(id: string) {
  const target = id === "top" ? 0 : document.getElementById(id)?.getBoundingClientRect().top;
  if (target === undefined) return false;
  const header = document.querySelector("header")?.getBoundingClientRect().height ?? 0;
  const top = id === "top" ? 0 : Math.max(0, target + window.scrollY - header + 1);
  const before = window.scrollY;
  try {
    window.scrollTo({ top, behavior: "smooth" });
  } catch {
    // Older hosts: fall through to the direct set below.
  }
  window.setTimeout(() => {
    if (Math.abs(window.scrollY - before) < 2 && Math.abs(top - before) > 2) {
      document.documentElement.scrollTop = top;
      document.body.scrollTop = top;
    }
  }, 120);
  return true;
}

/** Click handler for same-page links ("#how"): scrolls instead of jumping. */
export function onSectionLinkClick(event: { preventDefault: () => void; currentTarget: { getAttribute: (name: string) => string | null } }) {
  const id = event.currentTarget.getAttribute("href")?.replace(/^#/, "");
  if (id && scrollToSection(id)) event.preventDefault();
}
