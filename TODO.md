# TODO – Sheet Implementation Plan

## Backend

- [x] Add logging
- [x] Add error handling
- [x] Build Routes
- [ ] Add sheet delete/create/update routes

## Frontend

- [x] Add sheets List
- [ ] Add sheet create, duplicate, rename and delete handling
- [ ] Connect mutations to sheet
- [ ] Add basic toolbar and formula engine

## Formula Engine

- [ ] Write basic functions
- [ ] Connect frontend to formula engine
- [ ] Update backend update cell with formula engine

## ✅ Phase 1: MVP Setup

- [x] Decide architecture: React (Vite) + Go (HTTP) + Rust (Formula Engine) + Postgres
- [x] Create project structure:
  - [x] React frontend (Vite)
  - [x] Go backend (API + orchestration)
  - [x] Rust crate for formula engine (FFI-ready)
- [ ] Design Postgres schema (sheets, cells: raw + computed)
- [ ] Define `FormulaEngine` interface (frontend and backend-compatible)
- [ ] Build core React UI with basic grid and virtualization (React Virtuoso)
- [ ] Enable cell editing (raw value input)
- [ ] Evaluate formulas on frontend using initial JS engine
- [ ] Maintain dependency graph on frontend
- [ ] Trigger dependent recalculation on change
- [ ] Perform optimistic UI updates
- [ ] Send PATCH request to backend for persistence
- [ ] Backend applies same formula engine (via Rust FFI)
- [ ] Fetch full sheet data on load from backend

## 🔄 Phase 2: Backend Logic

- [ ] Implement Go REST API:
  - [ ] `GET /sheets/:id`
  - [ ] `PATCH /sheets/:id/cells`
  - [ ] `POST /sheets`
- [ ] Integrate Rust formula engine via FFI (CDylib)
- [ ] Mirror frontend calculation logic on backend
- [ ] Validate formula inputs and handle dependency invalidation
- [ ] Store both raw and computed values in Postgres
- [ ] Backend returns corrected data if client-side mismatch found

## 🧪 Phase 3: Performance & Scaling

- [ ] Move frontend formula engine into Web Worker (JS)
- [ ] Batch evaluation updates in throttled intervals
- [ ] Explore switching from React Virtuoso to WebGL/OpenGL renderer for large sheets (optional)

## 🔧 Phase 4: WebAssembly Formula Engine

- [ ] Compile Rust formula engine to Wasm using `wasm-pack`
- [ ] Integrate Wasm-based `FormulaEngine` into frontend
- [ ] Interface-swap between JS and Wasm engines
- [ ] Benchmark latency and computation cost against JS version

## 🌐 Phase 5: Collaboration & Sync

- [ ] Add Go WebSocket server for real-time updates
- [ ] Broadcast cell updates to all clients of a sheet
- [ ] Use optimistic update with eventual consistency or CRDT-style merging

## 📦 Phase 6: Quality of Life

- [ ] Sheet creation, renaming, and deletion in UI
- [ ] Undo/redo stack on frontend
- [ ] Export sheet to CSV
- [ ] Import sheet from CSV
