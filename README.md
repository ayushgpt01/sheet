# Sheet – A Google Sheets-like Spreadsheet - WIP

**Sheet** is a high-performance, modern web-based spreadsheet application inspired by Google Sheets, built from scratch to deeply understand the architecture, performance, and complexity behind such real-time collaborative tools.

## Purpose

This project is a personal learning and upskilling endeavor to explore:

- Spreadsheet engine internals
- Formula evaluation and dependency tracking
- Real-time synchronization patterns
- Frontend performance (100k+ cells)
- Interfacing between Go, Rust, and WebAssembly

## Tech Stack

| Layer          | Technology                                                               |
| -------------- | ------------------------------------------------------------------------ |
| Frontend       | React (Vite) + TypeScript                                                |
| Virtualization | React Virtuoso (may later switch to WebGL/OpenGL-based custom renderer)  |
| Backend        | Go (REST + WebSocket API)                                                |
| Formula Engine | Initially in JS (MVP) → Rust (FFI for backend, WebAssembly for frontend) |
| Database       | PostgreSQL                                                               |
| Optimizations  | Web Workers, WasmGC, FFI, optimistic updates, dependency graphs          |

## Architecture Overview

### Local-First Interaction

- **Optimistic UI updates** are applied as soon as a cell is changed.
- A **Formula Engine** runs in the browser to immediately recompute dependent cells.
- Dependency tracking is handled through a **local graph**, ensuring snappy updates without backend lag.

### Backend Responsibilities

- Go server handles:
  - Cell/sheet persistence (PostgreSQL)
  - REST APIs for sheet management
  - FFI callout to Rust formula engine for backend-side verification
  - WebSocket-based multi-user sync (future)

### Formula Engine Design

A pluggable interface allows different implementations depending on the environment:

```ts
interface FormulaEngine {
  evaluate(cellId: string): ComputedValue;
  recalculate(startCell: string): void;
  setCell(cellId: string, value: RawInput): void;
}
```

#### Engine Versions

| Environment | Implementation                      |
| ----------- | ----------------------------------- |
| Frontend    | JS (MVP), Wasm (Rust)               |
| Backend     | Rust library (FFI via CGO or cbind) |

## Data Model (PostgreSQL)

```sql
-- Sheets
CREATE TABLE sheets (
  id UUID PRIMARY KEY,
  name TEXT,
  owner_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Cells
CREATE TABLE cells (
  sheet_id UUID REFERENCES sheets(id),
  row INT,
  col INT,
  raw_value TEXT,
  computed_value TEXT,
  type TEXT,
  PRIMARY KEY(sheet_id, row, col)
);
```

> Optionally, JSONB can be used to store sheet content for rapid prototyping.

## Roadmap

See [`TODO.md`](./TODO.md) for detailed implementation phases and milestones.

## Future Plans

- Formula engine in WebAssembly (Rust or Go) for near-native performance
- Web Workers to keep evaluation off the main thread
- Real-time sync via WebSocket
- Undo/redo and versioning support
- Sheet export/import (CSV, Excel)

## License

MIT — This project is a personal learning exercise. Contributions welcome after MVP stabilization. See [`LICENSE.md`](./LICENSE.md)
