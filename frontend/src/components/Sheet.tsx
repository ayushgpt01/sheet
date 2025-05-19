import getGrid from "@/services/getGrid";
import { isInRange, lastItem } from "@/utils";
import { debounce } from "lodash";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

function getColumnLetter(colIndex: number): string {
  let letter = "";
  while (colIndex > 0) {
    const rem = (colIndex - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    colIndex = Math.floor((colIndex - 1) / 26);
  }
  return letter;
}

interface IRenderGrid {
  offsetX?: number;
  offsetY?: number;
  rowStart?: number;
  colStart?: number;
  width?: number;
  height?: number;
}

const CELL_WIDTH = 80;
const CELL_HEIGHT = 30;

export default function Sheet() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [grid, setGrid] = useState<Grid>({ cells: [], columns: [], rows: [] });
  const gridRows = useRef<Map<number, RowDetails>>(new Map());
  const [totalHeight, setTotalHeight] = useState(0);
  const [totalWidth, setTotalWidth] = useState(0);
  const gridColumns = useRef<Map<number, ColumnDetails>>(new Map());
  const gridCells = useRef<Map<string, CellDetails>>(new Map());
  const [loading, setLoading] = useState(false);

  // Selecting cell removes other selections. This is always present
  const [selectedCell, setSelectedCell] = useState<string>("1,1");
  // Selecting range also selects first cell in range
  const [selectedRange, setSelectedRange] = useState<SelectionRange | null>(
    null
  );
  // Selecting row also selects the entire row as range and first cell
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  // Selecting column also selects the entire column as range and first cell
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);

  const drawRectangle = useCallback(
    (ctx: CanvasRenderingContext2D, rect: Rect, bgColor: string = "#fff") => {
      ctx.save();
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.moveTo(rect.x, rect.y);
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      ctx.fill();
      ctx.restore();
    },
    []
  );

  const drawContent = useCallback(
    (ctx: CanvasRenderingContext2D, rect: Rect, content: string) => {
      ctx.save();
      ctx.fillStyle = "#000";
      ctx.font = `13px "Open Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(content, rect.x + rect.width / 2, rect.y + rect.height / 2);
      ctx.restore();
    },
    []
  );

  const drawHeaderRow = useCallback(
    (rows: IRow[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      if (!ctx) return;
      // Draw the headers
      for (const row of rows) {
        const isSelected =
          selectedRow === row.rowId ||
          (!selectedColumn && isInRange(selectedRange, row.rowId, 1));
        const bgColor = isSelected ? "#0957d2" : "#fff";
        drawRectangle(ctx, row, bgColor);
        ctx.save();
        ctx.strokeStyle = "#c4c7c5";
        ctx.lineWidth = 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isSelected ? "#fff" : "#000";
        ctx.font = `13px "Open Sans", sans-serif`;
        ctx.beginPath();
        ctx.moveTo(row.x, row.y + row.height);
        ctx.lineTo(row.x + row.width, row.y + row.height);
        ctx.stroke();
        ctx.fillText(
          row.rowId.toString(),
          row.x + row.width / 2,
          row.y + row.height / 2
        );
        ctx.restore();
      }

      ctx.save();
      ctx.strokeStyle = "#c4c7c5";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, CELL_HEIGHT);
      ctx.lineTo(0, canvas.clientHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CELL_WIDTH, CELL_HEIGHT);
      ctx.lineTo(CELL_WIDTH, canvas.clientHeight);
      ctx.stroke();
      ctx.restore();
    },
    [drawRectangle, selectedRange, selectedRow, selectedColumn]
  );

  const drawHeaderColumn = useCallback(
    (columns: IColumn[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      for (const column of columns) {
        const isSelected =
          selectedColumn === column.columnId ||
          (!selectedRow && isInRange(selectedRange, 1, column.columnId));
        const bgColor = isSelected ? "#0957d2" : "#fff";
        drawRectangle(ctx, column, bgColor);
        ctx.save();
        ctx.strokeStyle = "#c4c7c5";
        ctx.lineWidth = 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = isSelected ? "#fff" : "#000";
        ctx.font = `13px "Open Sans", sans-serif`;
        ctx.beginPath();
        ctx.moveTo(column.x + column.width, column.y);
        ctx.lineTo(column.x + column.width, column.y + column.height);
        ctx.stroke();
        ctx.fillText(
          getColumnLetter(column.columnId),
          column.x + column.width / 2,
          column.y + column.height / 2
        );
        ctx.restore();
      }
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = "#c4c7c5";
      ctx.lineWidth = 1.5;
      ctx.moveTo(CELL_WIDTH, CELL_HEIGHT);
      ctx.lineTo(canvas.clientWidth, CELL_HEIGHT);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CELL_WIDTH, 1);
      ctx.lineTo(canvas.clientWidth, 1);
      ctx.stroke();
      ctx.restore();
    },
    [drawRectangle, selectedColumn, selectedRange, selectedRow]
  );

  const drawEmptyBox = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#c4c7c5";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.fillRect(0, 0, CELL_WIDTH, CELL_HEIGHT);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.strokeRect(0, 1, CELL_WIDTH, CELL_HEIGHT - 1);
    ctx.stroke();
    ctx.restore();
  }, []);

  const drawCells = useCallback(
    (cells: ICell[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw the cells
      for (const cell of cells) {
        const text = gridCells.current.get(cell.cellId)?.text || "";
        const bgColor =
          gridCells.current.get(cell.cellId)?.background ?? undefined;
        drawRectangle(ctx, cell, bgColor);
        ctx.save();
        ctx.strokeStyle = "#c4c7c5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cell.x, cell.y + cell.height);
        ctx.lineTo(cell.x + cell.width, cell.y + cell.height);
        ctx.lineTo(cell.x + cell.width, cell.y);
        ctx.stroke();
        ctx.restore();
        drawContent(ctx, cell, text);
      }
    },
    [drawContent, drawRectangle]
  );

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    canvas.style.width = `${canvas.clientWidth}px`;
    canvas.style.height = `${canvas.clientHeight}px`;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    drawCells(grid.cells);
    drawHeaderRow(grid.rows);
    drawHeaderColumn(grid.columns);
    drawEmptyBox();
  }, [
    drawCells,
    drawEmptyBox,
    drawHeaderColumn,
    drawHeaderRow,
    grid.cells,
    grid.columns,
    grid.rows,
  ]);

  const renderGrid = useCallback(
    ({
      offsetX = 0,
      offsetY = 0,
      rowStart = 1,
      colStart = 1,
      width: canvasWidth,
      height: canvasHeight,
    }: IRenderGrid) => {
      const canvas = canvasRef.current;
      const rowData: IRow[] = [];
      const columnData: IColumn[] = [];
      const cellData: ICell[] = [];

      canvasWidth ??= canvas?.clientWidth || 10;
      canvasHeight ??= canvas?.clientHeight || 10;

      // Calculate the available drawing area for data content, excluding fixed headers.
      // These are used for more precise loop break conditions.
      const dataAreaHeight = canvasHeight - CELL_HEIGHT;
      const dataAreaWidth = canvasWidth - CELL_WIDTH;

      // --- Calculate Visible Row Headers (e.g., 1, 2, 3...) ---
      let currentAbsoluteRowTop = 0;
      // Sum heights of rows before rowStart to find the absolute top Y of rowStart
      for (let r = 1; r < rowStart; r++) {
        currentAbsoluteRowTop += gridRows.current.get(r)?.height || CELL_HEIGHT;
      }

      for (let i = rowStart; i <= gridRows.current.size; i++) {
        const height = gridRows.current.get(i)?.height || CELL_HEIGHT;
        const rowTopAbsolute = currentAbsoluteRowTop; // Absolute Y top of the current data row 'i'

        // If the data row is entirely above the scrolled viewport, skip its header
        if (rowTopAbsolute + height < offsetY) {
          currentAbsoluteRowTop += height;
          continue;
        }
        // If the top of the data row is such that its header would start at or beyond the bottom of the canvas's data area, stop
        // (rowTopAbsolute - offsetY) is the relative top of the data row content.
        // We stop if this relative top is >= dataAreaHeight.
        if (dataAreaHeight >= 0 && rowTopAbsolute - offsetY >= dataAreaHeight) {
          break;
        }
        // Fallback break if canvas is too small for dataAreaHeight to be positive
        if (dataAreaHeight < 0 && rowTopAbsolute >= offsetY) {
          // No space for rows if headers take all height
          break;
        }

        // Row headers are drawn in the strip x=[0, CELL_WIDTH], starting below the column header area (y=CELL_HEIGHT).
        rowData.push({
          y: rowTopAbsolute - offsetY + CELL_HEIGHT, // Canvas y for the row header
          x: 0, // Canvas x for the row header
          rowId: i,
          height,
          width: CELL_WIDTH,
        });
        currentAbsoluteRowTop += height;
      }

      // --- Calculate Visible Column Headers (e.g., A, B, C...) ---
      let currentAbsoluteColLeft = 0;
      // Sum widths of columns before colStart to find the absolute left X of colStart
      for (let c = 1; c < colStart; c++) {
        currentAbsoluteColLeft +=
          gridColumns.current.get(c)?.width || CELL_WIDTH;
      }

      for (let i = colStart; i <= gridColumns.current.size; i++) {
        const width = gridColumns.current.get(i)?.width || CELL_WIDTH;
        const colLeftAbsolute = currentAbsoluteColLeft; // Absolute X left of the current data column 'i'

        // If the data column is entirely to the left of the scrolled viewport, skip its header
        if (colLeftAbsolute + width < offsetX) {
          currentAbsoluteColLeft += width;
          continue;
        }
        // If the left of the data column is such that its header would start at or beyond the right of the canvas's data area, stop
        if (dataAreaWidth >= 0 && colLeftAbsolute - offsetX >= dataAreaWidth) {
          break;
        }
        // Fallback break if canvas is too small
        if (dataAreaWidth < 0 && colLeftAbsolute >= offsetX) {
          break;
        }

        // Column headers are drawn in the strip y=[0, CELL_HEIGHT], starting after the row header area (x=CELL_WIDTH).
        columnData.push({
          x: colLeftAbsolute - offsetX + CELL_WIDTH, // Canvas x for the column header
          y: 0, // Canvas y for the column header
          columnId: i,
          width,
          height: CELL_HEIGHT,
        });
        currentAbsoluteColLeft += width;
      }

      // --- Calculate Visible Cells ---
      // r_item.y is the canvas y for the top of the row header (already includes +CELL_HEIGHT).
      // c_item.x is the canvas x for the left of the column header (already includes +CELL_WIDTH).
      // These coordinates now directly define the top-left of the data cell area.
      for (const r_item of rowData) {
        for (const c_item of columnData) {
          const cellId = `${c_item.columnId},${r_item.rowId}`;
          cellData.push({
            x: c_item.x, // Use the already offset column header's x
            y: r_item.y, // Use the already offset row header's y
            rowId: r_item.rowId,
            columnId: c_item.columnId,
            width: c_item.width, // Data cell width is column width
            height: r_item.height, // Data cell height is row height
            cellId,
          });
        }
      }

      setGrid({ cells: cellData, columns: columnData, rows: rowData });
    },
    []
  );

  const findVisibleRow = useCallback((offsetY: number): number => {
    let acc = 0;
    for (let i = 1; i <= gridRows.current.size; i++) {
      const h = gridRows.current.get(i)?.height || CELL_HEIGHT;
      if (acc + h > offsetY) return i;
      acc += h;
    }
    return gridRows.current.size;
  }, []);

  const findVisibleCol = useCallback((offsetX: number): number => {
    let acc = 0;
    for (let i = 1; i <= gridColumns.current.size; i++) {
      const w = gridColumns.current.get(i)?.width || CELL_WIDTH;
      if (acc + w > offsetX) return i;
      acc += w;
    }
    return gridColumns.current.size;
  }, []);

  const findCellAt = useCallback(
    (x: number, y: number) => {
      const row = findVisibleRow(y);
      const column = findVisibleCol(x);
      if (row && column) return { row, column };

      return null;
    },
    [findVisibleCol, findVisibleRow]
  );

  const handleResizeGrid = useCallback(() => {
    if (!canvasRef.current || !gridContainerRef.current) return;
    const { clientWidth, clientHeight, scrollTop, scrollLeft } =
      gridContainerRef.current;

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = clientWidth;
    const canvasHeight = clientHeight;

    canvasRef.current.width = canvasWidth * dpr;
    canvasRef.current.height = canvasHeight * dpr;
    canvasRef.current.style.width = `${canvasWidth}px`;
    canvasRef.current.style.height = `${canvasHeight}px`;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvasWidth * dpr, canvasHeight * dpr);
      ctx.scale(dpr, dpr);
    }

    renderGrid({
      offsetX: scrollLeft,
      offsetY: scrollTop,
      rowStart: findVisibleRow(scrollTop),
      colStart: findVisibleCol(scrollLeft),
      width: canvasWidth,
      height: canvasHeight,
    });
    drawGrid();
  }, [drawGrid, findVisibleCol, findVisibleRow, renderGrid]);

  useEffect(() => {
    window.addEventListener("resize", handleResizeGrid);
    return () => {
      window.removeEventListener("resize", handleResizeGrid);
    };
  }, [handleResizeGrid]);

  useEffect(() => {
    const container = gridContainerRef.current;
    if (!container) return;

    const handleScroll = debounce(() => {
      const scrollLeft = container.scrollLeft;
      const scrollTop = container.scrollTop;

      renderGrid({
        offsetX: scrollLeft,
        offsetY: scrollTop,
        rowStart: findVisibleRow(scrollTop),
        colStart: findVisibleCol(scrollLeft),
      });
    }, 8);

    container.addEventListener("scroll", handleScroll);
    return () => {
      container.removeEventListener("scroll", handleScroll);
      handleScroll.cancel();
    };
  }, [drawGrid, findVisibleCol, findVisibleRow, renderGrid]);

  useLayoutEffect(() => {
    drawGrid();
  }, [grid, drawGrid]);

  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    setLoading(true);
    getGrid()
      .then((data) => {
        if (data) {
          gridCells.current = new Map();
          gridRows.current = new Map();
          gridColumns.current = new Map();
          let calculatedTotalHeight = CELL_HEIGHT;
          let calculatedTotalWidth = CELL_WIDTH;

          for (const cell of data.cells) {
            gridCells.current.set(cell.cellId, cell);
          }
          for (const column of data.columns) {
            gridColumns.current.set(column.columnId, column);
            calculatedTotalWidth += column.width;
          }
          for (const row of data.rows) {
            gridRows.current.set(row.rowId, row);
            calculatedTotalHeight += row.height;
          }

          setTotalWidth(calculatedTotalWidth);
          setTotalHeight(calculatedTotalHeight);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
      });
    initialized.current = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = gridContainerRef.current;
    if (!canvas || !container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      container.scrollLeft += event.deltaX;
      container.scrollTop += event.deltaY;
    };

    // const handlePointerDown = (e: PointerEvent) => {
    //   // Start selecting the range from current cell
    //   console.log(e);
    // };
    // const handlePointerUp = (e: PointerEvent) => {
    //   // Get the current position and update the range up till this cell in a rectangle
    //   console.log(e);
    // };

    canvas.addEventListener("wheel", handleWheel);
    // canvas.addEventListener("pointerdown", handlePointerDown);
    // canvas.addEventListener("pointerup", handlePointerUp);
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
      // canvas.removeEventListener("pointerdown", handlePointerDown);
      // canvas.removeEventListener("pointerup", handlePointerUp);
    };
  }, [findCellAt, findVisibleCol, findVisibleRow]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = gridContainerRef.current;
    if (!canvas || !container) return;

    const handleClick = (e: MouseEvent) => {
      const x = e.offsetX;
      const y = e.offsetY;
      const endRow = lastItem(gridRows.current)?.rowId ?? 1;
      const endCol = lastItem(gridColumns.current)?.columnId ?? 1;

      setSelectedRange(null);
      setSelectedColumn(null);
      setSelectedRow(null);

      if (x <= CELL_WIDTH && y <= CELL_HEIGHT) {
        // Empty Box click - select all
        setSelectedRange({
          startRow: 1,
          startCol: 1,
          endRow,
          endCol,
        });
        setSelectedCell("1,1");
      } else if (x <= CELL_WIDTH) {
        // Row click
        const adjustedY = y + container.scrollTop - CELL_HEIGHT;
        const row = findVisibleRow(adjustedY);
        if (row) {
          setSelectedRow(row);
          setSelectedCell(`1,${row}`);
          setSelectedRange({
            startRow: row,
            endRow: row,
            startCol: 1,
            endCol,
          });
        }
      } else if (y <= CELL_HEIGHT) {
        // Column click
        const adjustedX = x + container.scrollLeft - CELL_WIDTH;
        const column = findVisibleCol(adjustedX);
        if (column) {
          setSelectedColumn(column);
          setSelectedCell(`${column},1`);
          setSelectedRange({
            startRow: 1,
            endRow,
            startCol: column,
            endCol: column,
          });
        }
      } else {
        // Cell click
        const adjustedX = x + container.scrollLeft - CELL_WIDTH;
        const adjustedY = y + container.scrollTop - CELL_HEIGHT;
        const cell = findCellAt(adjustedX, adjustedY);
        if (cell) {
          setSelectedCell(`${cell.column},${cell.row}`);
        }
      }
    };

    canvas.addEventListener("click", handleClick);
    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [findCellAt, findVisibleCol, findVisibleRow]);

  const layoutDone = useRef(false);
  // Ensures handleResizeGrid runs AFTER the DOM has potentially updated with the new
  // totalWidth/Height, allowing scrollbars to appear and clientWidth/Height to be accurate.
  useLayoutEffect(() => {
    if (
      !layoutDone.current &&
      !loading &&
      totalWidth > 0 &&
      totalHeight > 0 &&
      gridContainerRef.current
    ) {
      handleResizeGrid();
      layoutDone.current = true;
    }
  }, [totalWidth, totalHeight, loading, handleResizeGrid]);

  return (
    <div className='relative select-none'>
      <div
        ref={gridContainerRef}
        className='overflow-auto w-full h-[calc(100vh-119px)] border border-gray-300 bg-white'
      >
        {loading ? (
          <div className='relative w-full h-full flex justify-center items-center'>
            <span className='absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-light-green font-medium'>
              Loading...
            </span>
          </div>
        ) : null}
        <div
          style={{
            width: totalWidth,
            height: totalHeight,
          }}
        />
      </div>
      <canvas ref={canvasRef} className='absolute top-0 left-0' />
    </div>
  );
}
