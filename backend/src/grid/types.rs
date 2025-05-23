use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Row {
    pub row_id: u32,
    pub height: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Column {
    pub column_id: u32,
    pub width: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Cell {
    pub cell_id: String,
    pub row_id: u32,
    pub column_id: u32,
    pub text: Option<String>,
    pub background: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Grid {
    pub rows: Vec<Row>,
    pub columns: Vec<Column>,
    pub cells: Vec<Cell>,
}
