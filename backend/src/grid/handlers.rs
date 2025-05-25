use super::types::{Cell, Column, ColumnItem, Grid, Row, RowItem};

pub fn create_grid(rows: Vec<RowItem>, cols: Vec<ColumnItem>, cells: Vec<Cell>) -> Grid {
    Grid {
        rows: rows
            .iter()
            .map(|val| Row {
                id: val.id,
                height: val.height,
                row_index: val.row_index,
            })
            .collect(),
        columns: cols
            .iter()
            .map(|val| Column {
                id: val.id,
                column_index: val.column_index,
                width: val.width,
            })
            .collect(),
        cells: cells,
    }
}
