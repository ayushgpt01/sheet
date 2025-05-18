import getGrid from "@/services/getGrid";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import ScrollBar from "./ScrollBar";

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
const SCROLL_BAR_SIZE = 12;
const SCROLL_THUMB_SIZE = 48;
const SCROLL_STEP = 30;

export default function Sheet() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [grid, setGrid] = useState<Grid>({ cells: [], columns: [], rows: [] });
  const gridRows = useRef<Map<number, RowDetails>>(new Map());
  const totalHeight = useRef(0);
  const totalWidth = useRef(0);
  const gridColumns = useRef<Map<number, ColumnDetails>>(new Map());
  const gridCells = useRef<Map<string, CellDetails>>(new Map());
  const [loading, setLoading] = useState(false);
  const verticalScroll = useRef<HTMLDivElement | null>(null);
  const horizontalScroll = useRef<HTMLDivElement | null>(null);
  const scrollPosition = useRef({
    top: 0,
    left: 0,
  });

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
        // Draw rectangle
        drawRectangle(ctx, row);
        ctx.save();
        ctx.strokeStyle = "#c4c7c5";
        ctx.lineWidth = 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000";
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
    [drawRectangle]
  );

  const drawHeaderColumn = useCallback(
    (columns: IColumn[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      for (const column of columns) {
        drawRectangle(ctx, column);
        ctx.save();
        ctx.strokeStyle = "#c4c7c5";
        ctx.lineWidth = 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#000";
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
    [drawRectangle]
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
        drawContent(ctx, cell, text);
        ctx.save();
        ctx.strokeStyle = "#c4c7c5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cell.x, cell.y + cell.height);
        ctx.lineTo(cell.x + cell.width, cell.y + cell.height);
        ctx.lineTo(cell.x + cell.width, cell.y);
        ctx.stroke();
        ctx.restore();
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
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
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
      offsetX = CELL_WIDTH,
      offsetY = CELL_HEIGHT,
      rowStart = 1,
      colStart = 1,
      width: canvasWidth,
      height: canvasHeight,
    }: IRenderGrid) => {
      const canvas = canvasRef.current;
      const rowData: IRow[] = [];
      const columnData: IColumn[] = [];
      const cellData: ICell[] = [];

      canvasWidth ??= canvas?.width || 10;
      canvasHeight ??= canvas?.height || 10;

      for (
        let i = rowStart, y = offsetY;
        y < canvasHeight && i <= gridRows.current.size;
        i++
      ) {
        const height = gridRows.current.get(i)?.height || CELL_HEIGHT;
        if (y + height > 0) {
          rowData.push({ y, x: 0, rowId: i, height, width: CELL_WIDTH });
        }
        y += height;
      }

      for (let i = colStart, x = offsetX; i <= gridColumns.current.size; i++) {
        const width = gridColumns.current.get(i)?.width || CELL_WIDTH;
        if (x >= canvasWidth) break;
        if (x + width > 0) {
          columnData.push({ x, y: 0, columnId: i, width, height: CELL_HEIGHT });
        }
        x += width;
      }

      for (const { rowId, height, y } of rowData) {
        for (const { width, x, columnId } of columnData) {
          const cellId = `${columnId},${rowId}`;
          cellData.push({ x, y, rowId, columnId, width, height, cellId });
        }
      }

      setGrid({ cells: cellData, columns: columnData, rows: rowData });
    },
    []
  );

  const updateCanvasDimensions = useCallback(() => {
    if (!canvasRef.current || !gridContainerRef.current) return;
    const { clientWidth, clientHeight } = gridContainerRef.current;
    const dpr = window.devicePixelRatio || 1;

    canvasRef.current.width = clientWidth * dpr;
    canvasRef.current.height = clientHeight * dpr;
    canvasRef.current.style.width = `${clientWidth}px`;
    canvasRef.current.style.height = `${clientHeight}px`;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, clientWidth, clientHeight);
      ctx.scale(dpr, dpr);
    }

    renderGrid({ width: clientWidth * dpr, height: clientHeight * dpr });
    drawGrid();
  }, [drawGrid, renderGrid]);

  const handleResizeGrid = useCallback(() => {
    updateCanvasDimensions();
  }, [updateCanvasDimensions]);

  const handleVerticalScroll = (rawDeltaY: number) => {
    if (!gridContainerRef.current || !grid.rows.length || !grid.columns.length)
      return;

    const deltaY = Math.sign(rawDeltaY) * SCROLL_STEP;
    const { clientHeight } = gridContainerRef.current;

    let { rowId, y } = grid.rows[0];
    const { columnId, x } = grid.columns[0];

    // Clamp scroll
    const maxScrollTop = Math.max(0, totalHeight.current - clientHeight);
    const scrollTop = Math.min(
      Math.max(0, scrollPosition.current.top + deltaY),
      maxScrollTop
    );

    scrollPosition.current.top = scrollTop;

    if (deltaY < 0) {
      // Scroll upwards
      y += -deltaY;
      rowId--;

      while (rowId > 0 && y > CELL_HEIGHT) {
        y -= gridRows.current.get(rowId)?.height || CELL_HEIGHT;
        rowId--;
      }

      const offsetY = Math.min(CELL_HEIGHT, y);

      renderGrid({
        offsetX: x,
        offsetY,
        rowStart: rowId + 1,
        colStart: columnId,
      });
    } else {
      // Scroll downwards
      renderGrid({
        offsetX: x,
        offsetY: y + -deltaY,
        rowStart: rowId,
        colStart: columnId,
      });
    }

    if (verticalScroll.current) {
      const scrollRatio = scrollTop / maxScrollTop;
      const trackHeight = clientHeight - (SCROLL_BAR_SIZE - SCROLL_THUMB_SIZE);
      verticalScroll.current.style.top = `${scrollRatio * trackHeight}px`;
    }
  };

  const handleHorizontalScroll = (rawDeltaX: number) => {
    if (!gridContainerRef.current || !grid.rows.length || !grid.columns.length)
      return;

    const { clientWidth } = gridContainerRef.current;
    const { rowId, y } = grid.rows[0];
    let { x } = grid.columns[0];

    // Total width of all columns
    const maxScrollLeft = Math.max(0, totalWidth.current - clientWidth);

    // Scale deltaX based on how much we can scroll vs visible
    const scrollRatio = maxScrollLeft / (clientWidth - SCROLL_THUMB_SIZE);
    const deltaX = rawDeltaX * scrollRatio;

    let scrollLeft = scrollPosition.current.left + deltaX;

    // Clamp scrollLeft
    scrollLeft = Math.min(Math.max(0, scrollLeft), maxScrollLeft);
    scrollPosition.current.left = scrollLeft;

    // Determine which column to start rendering from after scroll
    let accumulatedWidth = 0;
    let startColumnId = 1;
    for (let i = 1; i <= gridColumns.current.size; i++) {
      const colWidth = gridColumns.current.get(i)?.width || CELL_WIDTH;

      if (accumulatedWidth + colWidth > scrollLeft) {
        startColumnId = i;
        x = accumulatedWidth;
        break;
      }
      accumulatedWidth += colWidth;
    }

    renderGrid({
      offsetX: scrollLeft - x < CELL_WIDTH ? CELL_WIDTH : scrollLeft - x,
      offsetY: y,
      rowStart: rowId,
      colStart: startColumnId,
    });

    // Move the scrollbar thumb
    if (horizontalScroll.current) {
      const thumbTravelWidth = clientWidth - SCROLL_THUMB_SIZE;
      const scrollRatio = scrollLeft / maxScrollLeft;
      horizontalScroll.current.style.left = `${
        scrollRatio * thumbTravelWidth
      }px`;
    }
  };

  const handleScroll: React.WheelEventHandler<HTMLDivElement> = (event) => {
    const { deltaX, deltaY } = event;

    if (deltaX === 0) handleVerticalScroll(deltaY);
    else handleHorizontalScroll(deltaX);
  };

  useEffect(() => {
    window.addEventListener("resize", handleResizeGrid);
    return () => {
      window.removeEventListener("resize", handleResizeGrid);
    };
  }, [handleResizeGrid]);

  useLayoutEffect(() => {
    drawGrid();
  }, [drawGrid]);

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
          totalHeight.current = data.columns[0]?.width ?? 0;
          totalWidth.current = data.rows[0]?.height ?? 0;

          for (const cell of data.cells) {
            gridCells.current.set(cell.cellId, cell);
          }
          for (const column of data.columns) {
            gridColumns.current.set(column.columnId, column);
            totalWidth.current += column.width;
          }
          for (const row of data.rows) {
            gridRows.current.set(row.rowId, row);
            totalHeight.current += row.height;
          }

          handleResizeGrid();
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
      });
    initialized.current = true;
  }, [handleResizeGrid]);

  return (
    <div
      ref={gridContainerRef}
      onWheel={handleScroll}
      className='relative overflow-hidden border border-gray-300 bg-white w-full h-[calc(100vh-119px)] select-none'
    >
      {loading ? (
        <div className='relative w-full h-full flex justify-center items-center'>
          <div className='loader'>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <span className='absolute top-[62%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-light-green font-medium'>
            Loading...
          </span>
        </div>
      ) : null}
      <canvas ref={canvasRef} className='w-full h-full' />
      <ScrollBar
        thumbRef={verticalScroll}
        axis='y'
        onScroll={handleVerticalScroll}
      />
      <ScrollBar
        thumbRef={horizontalScroll}
        axis='x'
        onScroll={handleHorizontalScroll}
      />
    </div>
  );
}
