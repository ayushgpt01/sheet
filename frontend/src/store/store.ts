import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface SheetState {
  sheet: Record<string, string>;
  createSheet: (cols: number, rows: number, defaultValue?: string) => void;
  updateValue: (val: string, colIdx: number, rowIdx: number) => void;
}

export const useSheetStore = create<SheetState>()(
  devtools(
    immer((set) => ({
      sheet: {},
      createSheet: (cols, rows, defaultValue) =>
        set((state) => {
          for (let colIdx = 0; colIdx < cols; colIdx++) {
            for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
              state.sheet[`${colIdx}|${rowIdx}`] = defaultValue ?? "";
            }
          }
          console.log(state.sheet);
        }),
      updateValue: (val, colIdx, rowIdx) =>
        set((state) => {
          state.sheet[`${colIdx}|${rowIdx}`] = val;
        }),
    }))
  )
);
