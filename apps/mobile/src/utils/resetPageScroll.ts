interface FocusSource {
  addEventListener(type: 'focusout', listener: () => void): void;
  activeElement: { tagName?: string; isContentEditable?: boolean } | null;
}

interface ScrollTarget {
  scrollY: number;
  scrollTo(x: number, y: number): void;
}

const isEditing = (element: FocusSource['activeElement']) =>
  Boolean(element?.isContentEditable) || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName ?? '');

/**
 * The app fills the screen and scrolls inside itself, but on phones the browser also scrolls the
 * whole page to reveal a field while the keyboard is open, and sometimes leaves it there: the top
 * bar (and its back button) then sits under the browser's own bar. Put the page back as soon as
 * editing ends.
 */
export function resetPageScrollAfterEditing(source: FocusSource, target: ScrollTarget, delayMs = 150): void {
  source.addEventListener('focusout', () => {
    // Tabbing from one field to the next also fires focusout: leave the page alone then, the
    // browser is showing the new field.
    setTimeout(() => {
      if (!isEditing(source.activeElement) && target.scrollY !== 0) target.scrollTo(0, 0);
    }, delayMs);
  });
}
