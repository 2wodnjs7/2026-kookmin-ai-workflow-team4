export function getScrollBehavior(): ScrollBehavior {
  if (typeof window === 'undefined') return 'auto';
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
}

export function scrollToElementId(id: string): boolean {
  const element = document.getElementById(id);
  if (!element) return false;

  element.scrollIntoView({
    behavior: getScrollBehavior(),
    block: 'start',
  });
  return true;
}

export function scrollToHash(hash: string): boolean {
  const id = hash.replace(/^#/, '');
  if (!id) return false;
  return scrollToElementId(id);
}
