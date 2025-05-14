import Editor from "@/editor/Editor";
import Toolbar from "@/components/Toolbar";
import SheetsList from "@/components/SheetsList";

function App() {
  return (
    <main className='h-screen'>
      <Toolbar />
      <Editor />
      <SheetsList />
    </main>
  );
}

export default App;
