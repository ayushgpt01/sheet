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

export function getColumnLetter(colIndex: number): string {
  let letter = "";
  while (colIndex > 0) {
    const rem = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    colIndex = Math.floor((colIndex - 1) / 26);
  }
  return letter;
}

export function getCellName(cellId: string): string {
  const [col, row] = cellId.split(",").map(Number);

  return `${getColumnLetter(col)}${row}`;
}
