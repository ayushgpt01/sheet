import getGrid from "@/services/getGrid";
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
  const totalHeight = useRef(0);
  const totalWidth = useRef(0);
  const gridColumns = useRef<Map<number, ColumnDetails>>(new Map());
  const gridCells = useRef<Map<string, CellDetails>>(new Map());
  const [loading, setLoading] = useState(false);

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

      canvasWidth ??= canvas?.width || 10;
      canvasHeight ??= canvas?.height || 10;

      let accY = gridRows.current.get(1)?.height || CELL_HEIGHT;
      for (let i = rowStart; i <= gridRows.current.size; i++) {
        const height = gridRows.current.get(i)?.height || CELL_HEIGHT;
        accY += height;
        const rowTop = accY - height;

        // Skip rows above the current scroll
        if (rowTop + height < offsetY) continue;

        // Stop if row starts below the canvas viewport
        if (rowTop > offsetY + canvasHeight) break;

        rowData.push({
          y: rowTop - offsetY,
          x: 0,
          rowId: i,
          height,
          width: CELL_WIDTH,
        });
      }

      let accX = gridColumns.current.get(0)?.width || CELL_WIDTH;
      for (let i = colStart; i <= gridColumns.current.size; i++) {
        const width = gridColumns.current.get(i)?.width || CELL_WIDTH;
        accX += width;
        const colLeft = accX - width;

        if (colLeft + width < offsetX) continue;
        if (colLeft > offsetX + canvasWidth) break;

        columnData.push({
          x: colLeft - offsetX,
          y: 0,
          columnId: i,
          width,
          height: CELL_HEIGHT,
        });
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

  const handleResizeGrid = useCallback(() => {
    if (!canvasRef.current || !gridContainerRef.current) return;
    const { clientWidth, clientHeight, scrollTop, scrollLeft } =
      gridContainerRef.current;

    const scrollbarWidth = 16;
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = clientWidth - scrollbarWidth;
    const canvasHeight = clientHeight - scrollbarWidth;

    canvasRef.current.width = canvasWidth * dpr;
    canvasRef.current.height = canvasHeight * dpr;
    canvasRef.current.style.width = `${canvasWidth}px`;
    canvasRef.current.style.height = `${canvasHeight}px`;

    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.scale(dpr, dpr);
    }

    renderGrid({
      offsetX: scrollLeft,
      offsetY: scrollTop,
      rowStart: findVisibleRow(scrollTop),
      colStart: findVisibleCol(scrollLeft),
      width: canvasWidth * dpr,
      height: canvasHeight * dpr,
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
  }, [findVisibleCol, findVisibleRow, renderGrid]);

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
          totalHeight.current = 0;
          totalWidth.current = 0;

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

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = gridContainerRef.current;
    if (!canvas || !container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      container.scrollLeft += event.deltaX;
      container.scrollTop += event.deltaY;
    };

    canvas.addEventListener("wheel", handleWheel);
    return () => {
      canvas.removeEventListener("wheel", handleWheel);
    };
  }, []);

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
            width: totalWidth.current,
            height: totalHeight.current,
          }}
        />
      </div>
      <canvas ref={canvasRef} className='absolute top-0 left-0' />
    </div>
  );
}
