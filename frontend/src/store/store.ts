import { create, type StateCreator } from "zustand";
import { devtools, persist } from "zustand/middleware";

interface SheetState {
  bears: number;
  increase: (by: number) => void;
}

const createSheetSlice: StateCreator<SheetState, [], [], SheetState> = (
  set
) => ({
  bears: 0,
  increase: (by) => set((state) => ({ bears: state.bears + by })),
});

export type StoreState = SheetState;

export const useSheetStore = create<StoreState>()(
  devtools(
    persist(
      (...a) => ({
        ...createSheetSlice(...a),
      }),
      { name: "sheetStore" }
    )
  )
);
