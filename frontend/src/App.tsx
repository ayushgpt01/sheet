import { TableVirtuoso } from "react-virtuoso";

function App() {
  return (
    <h1 className='text-3xl font-bold underline'>
      <TableVirtuoso
        style={{ height: "100vh" }}
        data={Array.from({ length: 100 }, (_, index) => ({
          name: `User ${index}`,
          description: `${index} description`,
        }))}
        itemContent={(index, user) => (
          <>
            <td style={{ minWidth: 150 }}>{index}</td>
            <td style={{ minWidth: 150 }}>{user.name}</td>
            <td style={{ minWidth: 150 }}>{user.description}</td>
          </>
        )}
      />
    </h1>
  );
}

export default App;
