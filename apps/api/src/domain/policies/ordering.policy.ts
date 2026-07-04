export interface RankedItem {
  id: string;
  scopeId: string;
}

export type OrderingValidation =
  | { valid: true }
  | { code: string; reason: string; valid: false };

function invalid(code: string, reason: string): OrderingValidation {
  return { code, reason, valid: false };
}

export function validateMoveAnchors(
  movingItem: RankedItem,
  beforeId: string | undefined,
  afterId: string | undefined,
  items: RankedItem[],
): OrderingValidation {
  if (!beforeId && !afterId) return { valid: true };
  if (beforeId && afterId && beforeId === afterId) {
    return invalid(
      'DUPLICATE_MOVE_ANCHOR',
      'Before and after anchors must be different.',
    );
  }
  if (beforeId === movingItem.id || afterId === movingItem.id) {
    return invalid('SELF_MOVE_ANCHOR', 'An item cannot anchor to itself.');
  }

  const anchors = [beforeId, afterId].filter(
    (id): id is string => id !== undefined,
  );
  for (const anchorId of anchors) {
    const anchor = items.find((item) => item.id === anchorId);
    if (!anchor) {
      return invalid('MOVE_ANCHOR_NOT_FOUND', 'A move anchor was not found.');
    }
    if (anchor.scopeId !== movingItem.scopeId) {
      return invalid(
        'CROSS_SCOPE_MOVE_ANCHOR',
        'Move anchors must belong to the destination scope.',
      );
    }
  }

  return { valid: true };
}
