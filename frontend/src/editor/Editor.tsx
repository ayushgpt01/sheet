import { Fragment, useMemo } from "react";

const getColumnLetter = (colIndex: number) => {
  let temp,
    letter = "";
  while (colIndex >= 0) {
    temp = colIndex % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
};

export default function Editor({ numRows = 100, numCols = 26 }) {
  const columnHeaders = useMemo(() => {
    return Array.from({ length: numCols }, (_, i) => getColumnLetter(i));
  }, [numCols]);

  const rowHeaders = useMemo(() => {
    return Array.from({ length: numRows }, (_, i) => i + 1);
  }, [numRows]);

  const gridStyle = {
    gridTemplateColumns: `minmax(95px, auto) repeat(${numCols}, minmax(100px, 1fr))`,
    gridAutoRows: "20px",
  };

  return (
    <div
      className='w-full h-[calc(100vh-119px)] overflow-auto border border-gray-300 
      rounded-md shadow-lg bg-gray-300 text-[13px]'
    >
      <div className='grid relative' style={gridStyle}>
        <div
          className='sticky top-0 left-0 z-30 bg-gray-200 border-r border-b
          border-gray-300 w-[95px] text-center font-semibold p-2'
        ></div>

        {columnHeaders.map((letter, colIdx) => (
          <div
            key={`col-header-${colIdx}`}
            className='sticky top-0 z-20 bg-white text-center font-semibold
            border-r border-b border-gray-300 flex items-center p-2
            justify-center'
          >
            {letter}
          </div>
        ))}

        {rowHeaders.map((rowNum, rowIdx) => (
          <Fragment key={`row-${rowIdx}`}>
            <div
              className='sticky left-0 z-10 bg-white text-center p-2
              font-semibold border-r border-b border-gray-300 min-w-[93.8px] flex 
              items-center justify-center'
            >
              {rowNum}
            </div>

            {columnHeaders.map((_, colIdx) => (
              <div
                key={`cell-${rowIdx}-${colIdx}`}
                className='bg-white border-r border-b border-gray-300 
                text-center flex items-center justify-center overflow-hidden'
              >
                {/* <input
                  type='text'
                  className='w-full h-full p-[5px] box-border text-sm outline-none 
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  aria-label={`Cell ${columnHeaders[colIdx]}${rowNum}`}
                /> */}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
