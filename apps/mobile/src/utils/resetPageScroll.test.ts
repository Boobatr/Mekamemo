import { resetPageScrollAfterEditing } from './resetPageScroll';

interface FakeElement {
  scrollLeft: number;
  scrollTop: number;
  parentElement: FakeElement | null;
  overflow: string;
}

const element = (overflow: string, parentElement: FakeElement | null = null, scrollLeft = 0, scrollTop = 0): FakeElement => ({
  scrollLeft,
  scrollTop,
  parentElement,
  overflow,
});

function setup(scrollY: number, activeTag: string | null, blurred: FakeElement) {
  let focusOut: (event: { target: unknown }) => void = () => {};
  const source = {
    addEventListener: (_type: 'focusout', listener: (event: { target: unknown }) => void) => {
      focusOut = listener;
    },
    activeElement: activeTag ? { tagName: activeTag } : null,
  };
  const target = {
    scrollY,
    scrollTo: jest.fn(),
    getComputedStyle: (el: FakeElement) => ({ overflowX: el.overflow, overflowY: el.overflow }),
  };
  resetPageScrollAfterEditing(source, target as never, 150);
  return { source, target, focusOut: () => focusOut({ target: blurred }) };
}

describe('resetPageScrollAfterEditing', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('puts a scrolled page back to the top once editing is over', () => {
    const { target, focusOut } = setup(180, 'BODY', element('visible'));

    focusOut();
    expect(target.scrollTo).not.toHaveBeenCalled(); // not before the delay
    jest.advanceTimersByTime(150);

    expect(target.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('does nothing when nothing was scrolled', () => {
    const { target, focusOut } = setup(0, 'BODY', element('visible'));

    focusOut();
    jest.advanceTimersByTime(300);

    expect(target.scrollTo).not.toHaveBeenCalled();
  });

  it('leaves everything alone when focus just moved to another field', () => {
    const container = element('hidden', null, 79, 0);
    const { target, focusOut } = setup(180, 'INPUT', element('visible', container));

    focusOut();
    jest.advanceTimersByTime(300);

    expect(target.scrollTo).not.toHaveBeenCalled();
    expect(container.scrollLeft).toBe(79);
  });

  it('scrolls back a screen container that the browser shifted to reveal the field (overflow hidden)', () => {
    const container = element('hidden', null, 79, 12);
    const field = element('visible', element('visible', container));
    const { focusOut } = setup(0, 'BODY', field);

    focusOut();
    jest.advanceTimersByTime(150);

    expect(container.scrollLeft).toBe(0);
    expect(container.scrollTop).toBe(0);
  });

  it('does not touch a list that is meant to scroll (overflow auto)', () => {
    const list = element('auto', null, 0, 400);
    const { focusOut } = setup(0, 'BODY', element('visible', list));

    focusOut();
    jest.advanceTimersByTime(150);

    expect(list.scrollTop).toBe(400);
  });
});
