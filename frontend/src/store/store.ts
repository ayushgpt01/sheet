import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface SheetState {
  sheet: string[][];
  createSheet: (cols: number, rows: number) => void;
  updateValue: (val: string, colIdx: number, rowIdx: number) => void;
}

export const useSheetStore = create<SheetState>()(
  devtools(
    immer((set) => ({
      sheet: [[]],
      createSheet: (cols, rows) =>
        set((state) => {
          state.sheet = Array(cols).fill(Array(rows).fill(""));
        }),
      updateValue: (val, colIdx, rowIdx) =>
        set((state) => {
          if (!state.sheet[colIdx]) state.sheet[colIdx] = [];
          state.sheet[colIdx][rowIdx] = val;
        }),
    }))
  )
);
