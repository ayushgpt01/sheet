import getGrid from "@/services/getGrid";
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

const CELL_WIDTH = 80;
const CELL_HEIGHT = 30;

export default function Sheet() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gridContainerRef = useRef<HTMLDivElement | null>(null);
  const [grid, setGrid] = useState<Grid>({ cells: [], columns: [], rows: [] });
  const [loading, setLoading] = useState(false);

  const drawRectangle = useCallback(
    (ctx: CanvasRenderingContext2D, rect: Rect) => {
      ctx.save();
      ctx.fillStyle = "#fff";
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
        drawRectangle(ctx, cell);
        drawContent(ctx, cell, "Demo Text");
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

  useEffect(() => {
    const handleResizeGrid = () => {
      if (!canvasRef.current || !gridContainerRef.current) return;
      const { clientWidth, clientHeight } = gridContainerRef.current;
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = clientWidth * dpr;
      canvasRef.current.height = clientHeight * dpr;
      canvasRef.current.style.width = `${clientWidth}px`;
      canvasRef.current.style.height = `${clientHeight}px`;
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, clientWidth, clientHeight);
        ctx.scale(dpr, dpr);
      }

      drawGrid();
    };

    window.addEventListener("resize", handleResizeGrid);
    return () => {
      window.removeEventListener("resize", handleResizeGrid);
    };
  }, [drawGrid]);

  useLayoutEffect(() => {
    drawGrid();
  }, [drawGrid]);

  useEffect(() => {
    setLoading(true);
    getGrid()
      .then((data) => {
        setGrid(data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div
      ref={gridContainerRef}
      className='overflow-auto border border-gray-300 bg-white w-full h-[calc(100vh-119px)]'
    >
      {loading ? (
        <div className='w-full h-full flex items-center justify-center'>
          Loading...
        </div>
      ) : (
        <canvas ref={canvasRef} className='w-full h-full' />
      )}
    </div>
  );
}
