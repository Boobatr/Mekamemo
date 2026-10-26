interface Scrollable {
  scrollLeft: number;
  scrollTop: number;
  parentElement: Scrollable | null;
}

interface FocusEventLike {
  target: unknown;
}

interface FocusSource {
  addEventListener(type: 'focusout', listener: (event: FocusEventLike) => void): void;
  activeElement: { tagName?: string; isContentEditable?: boolean } | null;
}

interface ScrollTarget {
  scrollY: number;
  scrollTo(x: number, y: number): void;
  getComputedStyle(element: never): { overflowX: string; overflowY: string };
}

const isEditing = (element: FocusSource['activeElement']) =>
  Boolean(element?.isContentEditable) || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element?.tagName ?? '');

/**
 * The app fills the screen and scrolls inside itself, but on phones the browser also scrolls to
 * reveal a field while the keyboard is open, and sometimes leaves things there: the whole page, and
 * the screen containers (which are \`overflow: hidden\`, so the user can't scroll them back). The top
 * bar with its back button, or the left edge of the screen, then sits out of sight. Put everything
 * back as soon as editing ends. Lists that are meant to scroll (\`overflow: auto\`) are left alone.
 */
export function resetPageScrollAfterEditing(source: FocusSource, target: ScrollTarget, delayMs = 150): void {
  source.addEventListener('focusout', (event) => {
    // Tabbing from one field to the next also fires focusout: leave things alone then, the
    // browser is showing the new field.
    setTimeout(() => {
      if (isEditing(source.activeElement)) return;
      if (target.scrollY !== 0) target.scrollTo(0, 0);

      for (let element = event.target as Scrollable | null; element; element = element.parentElement) {
        if (element.scrollLeft === 0 && element.scrollTop === 0) continue;
        const style = target.getComputedStyle(element as never);
        if (style.overflowX === 'hidden' && element.scrollLeft !== 0) element.scrollLeft = 0;
        if (style.overflowY === 'hidden' && element.scrollTop !== 0) element.scrollTop = 0;
      }
    }, delayMs);
  });
}
