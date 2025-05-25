import Sheet from "@/components/Sheet";
import SheetsList from "@/components/SheetsList";
import Toolbar from "@/components/Toolbar";
import { Navigate, Route, Routes } from "react-router";

export default function App() {
  return (
    <main className='h-screen overflow-hidden'>
      <Routes>
        {/* TODO - Remove this route */}
        <Route index element={<Navigate to={"/sheet/1"} />} />
        <Route
          path='/sheet/:sheetId'
          element={
            <main className='h-screen overflow-hidden'>
              <Toolbar />
              <Sheet />
              <SheetsList />
            </main>
          }
        />
      </Routes>
    </main>
  );
}
