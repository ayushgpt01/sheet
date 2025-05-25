// Paintable rectangle for grid cells, rows, columns or any rectangle container
type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// Type of the paintable row
type IRow = {
  rowId: number;
} & Rect;

// Type of the paintable column
type IColumn = {
  columnId: number;
} & Rect;

// Type of paintable cell
type ICell = {
  cellId: string;
  rowId: number;
  columnId: number;
} & Rect;

// Type of the entire paintable grid
type Grid = { rows: IRow[]; columns: IColumn[]; cells: ICell[] };

type SelectionRange = {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
};

// Used for toolbar currently active styles
type ActiveStyleConfig = {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  underline: boolean;
  color: string;
  font: string;
  size: string;
  background: string;
};

// Any directional use type like insert rows, columns
const enum Direction {
  Top = "top",
  Bottom = "bottom",
  Left = "left",
  Right = "right",
}

// For later use of dynamic config
type IConfig = {
  lineWidth: number;
  strokeStyle: string;
  cellHeight: number;
  cellWidth: number;
  colWidth: number;
  defaultFont: string;
  defaultFontSize: string;
  scrollBarSize: number;
  scrollThumbSize: number;
  rowHeight: number;
  customFonts: string[];
  fonts: Record<string, string>;
  scale: number[];
  fontSizes: string[];
};

// Types for API's
type RowDetails = {
  id: number;
  rowIndex: number;
  height: number;
};

type ColumnDetails = {
  id: number;
  columnIndex: number;
  width: number;
};

type CellDetails = {
  id: number;
  rowIndex: number;
  columnIndex: number;
  width: number;
  height: number;
  value?: string | null;
  formula?: string | null;
  background?: string | null;
};

type Sheet = {
  rows: RowDetails[];
  columns: ColumnDetails[];
  cells: CellDetails[];
};

type SheetsListItem = {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
};
