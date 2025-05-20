import Sheet from "@/components/Sheet";
import Toolbar from "@/components/Toolbar";
import SheetsList from "@/components/SheetsList";

export default function App() {
  return (
    <main className='h-screen overflow-hidden'>
      <Toolbar />
      <Sheet />
      <SheetsList />
    </main>
  );
}
