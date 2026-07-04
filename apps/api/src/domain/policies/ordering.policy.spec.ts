import { validateMoveAnchors, type RankedItem } from './ordering.policy';

const items: RankedItem[] = [
  { id: 'moving', scopeId: 'column-a' },
  { id: 'before', scopeId: 'column-a' },
  { id: 'after', scopeId: 'column-a' },
  { id: 'elsewhere', scopeId: 'column-b' },
];

describe('validateMoveAnchors', () => {
  it('accepts an empty destination and valid neighboring anchors', () => {
    expect(validateMoveAnchors(items[0], undefined, undefined, items)).toEqual({
      valid: true,
    });
    expect(validateMoveAnchors(items[0], 'before', 'after', items)).toEqual({
      valid: true,
    });
  });

  it.each([
    ['DUPLICATE_MOVE_ANCHOR', 'before', 'before'],
    ['SELF_MOVE_ANCHOR', 'moving', undefined],
    ['MOVE_ANCHOR_NOT_FOUND', 'missing', undefined],
    ['CROSS_SCOPE_MOVE_ANCHOR', 'elsewhere', undefined],
  ])('rejects %s', (code, beforeId, afterId) => {
    expect(
      validateMoveAnchors(items[0], beforeId, afterId, items),
    ).toMatchObject({ code, valid: false });
  });
});
