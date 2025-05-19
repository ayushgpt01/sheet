export function lastItem<K, V>(mapOrSet: Map<K, V>) {
  const iterator = mapOrSet.values();
  let i = 1;
  while (i++ < mapOrSet.size && iterator.next()) {
    /* empty */
  }
  return iterator.next().value;
}

export function isInRange(
  selectedRange: SelectionRange | null,
  rowId: number,
  columnId: number
): boolean {
  if (!selectedRange) return false;

  return (
    selectedRange.startCol <= columnId &&
    selectedRange.endCol >= columnId &&
    selectedRange.startRow <= rowId &&
    selectedRange.endRow >= rowId
  );
}
