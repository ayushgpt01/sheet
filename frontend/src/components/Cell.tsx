import { useSheetStore } from "@/store/store";

export default function Cell({
  colIdx,
  rowIdx,
}: {
  rowIdx: number;
  colIdx: number;
}) {
  const data = useSheetStore((s) => s.sheet?.[`${rowIdx}|${colIdx}`]);
  if (rowIdx === 28 && colIdx === 0) {
    console.log(data, "data");
  }

  return (
    <div
      className='bg-white border-r border-b border-gray-300 text-center flex 
      items-center justify-center overflow-hidden'
      data-col={colIdx}
      data-row={rowIdx}
    >
      {data}
      {/* <input
        type='text'
        className='w-full h-full p-[5px] box-border text-sm outline-none 
        focus:ring-2 focus:ring-blue-500 focus:border-transparent'
        aria-label={`Cell ${columnHeaders[colIdx]}${rowNum}`}
      /> */}
    </div>
  );
}
