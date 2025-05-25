CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. sheets
CREATE TABLE sheets (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. rows
CREATE TABLE rows (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sheet_id bigint NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  height DOUBLE PRECISION NOT NULL DEFAULT 24.0,
  UNIQUE (sheet_id, row_index)
);

-- 3. columns
CREATE TABLE columns (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sheet_id bigint NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  column_index INTEGER NOT NULL,
  width DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  UNIQUE (sheet_id, column_index)
);

-- 4. cells
CREATE TABLE cells (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sheet_id bigint NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  row_id bigint NOT NULL REFERENCES rows(id) ON DELETE CASCADE,
  column_id bigint NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  value TEXT,
  formula TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (sheet_id, row_id, column_id)
);

CREATE TRIGGER update_cells_updated_at
BEFORE UPDATE ON cells
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX ON rows(sheet_id);
CREATE INDEX ON columns(sheet_id);
CREATE INDEX ON cells(sheet_id);
CREATE INDEX ON cells(row_id);
CREATE INDEX ON cells(column_id);
