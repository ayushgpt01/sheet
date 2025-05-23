use super::types::{Cell, Column, Grid, Row};
use crate::constants;

fn create_rows() -> Vec<Row> {
    (1..=constants::ROW_COUNT)
        .map(|index| Row {
            row_id: (index as u32),
            height: (constants::CELL_HEIGHT as f64),
        })
        .collect()
}

fn create_columns() -> Vec<Column> {
    (1..=constants::COLUMN_COUNT)
        .map(|index| Column {
            column_id: (index as u32),
            width: (constants::CELL_WIDTH as f64),
        })
        .collect()
}

fn create_cells() -> Vec<Cell> {
    let mut vector: Vec<Cell> =
        Vec::with_capacity((constants::ROW_COUNT * (constants::COLUMN_COUNT as u16)).into());

    for col in 1..=constants::COLUMN_COUNT {
        for row in 1..=constants::ROW_COUNT {
            vector.push(Cell {
                cell_id: format!("{},{}", col, row),
                row_id: (row as u32),
                column_id: (col as u32),
                text: Option::None,
                background: Option::None,
            });
        }
    }

    vector
}

pub fn create_grid() -> Grid {
    Grid {
        rows: create_rows(),
        columns: create_columns(),
        cells: create_cells(),
    }
}
