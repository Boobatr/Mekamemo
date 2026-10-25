import { resetPageScrollAfterEditing } from './resetPageScroll';

function setup(scrollY: number, activeTag: string | null) {
  let focusOut: () => void = () => {};
  const source = {
    addEventListener: (_type: 'focusout', listener: () => void) => {
      focusOut = listener;
    },
    activeElement: activeTag ? { tagName: activeTag } : null,
  };
  const target = { scrollY, scrollTo: jest.fn() };
  resetPageScrollAfterEditing(source, target, 150);
  return { source, target, focusOut: () => focusOut() };
}

describe('resetPageScrollAfterEditing', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('puts a scrolled page back to the top once editing is over', () => {
    const { target, focusOut } = setup(180, 'BODY');

    focusOut();
    expect(target.scrollTo).not.toHaveBeenCalled(); // not before the delay
    jest.advanceTimersByTime(150);

    expect(target.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('does nothing when the page was not scrolled', () => {
    const { target, focusOut } = setup(0, 'BODY');

    focusOut();
    jest.advanceTimersByTime(300);

    expect(target.scrollTo).not.toHaveBeenCalled();
  });

  it('leaves the page alone when focus just moved to another field', () => {
    const { target, focusOut } = setup(180, 'INPUT');

    focusOut();
    jest.advanceTimersByTime(300);

    expect(target.scrollTo).not.toHaveBeenCalled();
  });
});
