const KEY = 'hoa-visitor-id';

/**
 * A random id kept in localStorage so repeat page views from the same
 * browser count as one "visitor" rather than one per page. Not tied
 * to any account or personal info — just a random string.
 */
export function getVisitorId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // Private browsing / storage blocked — this visit still gets
    // counted, just not linked to any future visit from this browser.
    return crypto.randomUUID();
  }
}
