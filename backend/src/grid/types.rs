use chrono::{DateTime, Utc};
use serde::{Deserialize, Deserializer, Serialize};
use sqlx::prelude::FromRow;

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Row {
    pub id: i64,
    pub row_index: i32,
    pub height: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Column {
    pub id: i64,
    pub column_index: i32,
    pub width: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Cell {
    pub id: i64,
    pub value: Option<String>,
    pub formula: Option<String>,
    pub row_index: i32,
    pub height: f64,
    pub column_index: i32,
    pub width: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Grid {
    pub rows: Vec<Row>,
    pub columns: Vec<Column>,
    pub cells: Vec<Cell>,
}

// ------------------ DATABASE TYPES ---------------------
#[derive(Debug, Deserialize)]
pub struct Pagination {
    #[serde(default)]
    pub start: i64,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

fn default_limit() -> i64 {
    100
}

#[derive(Debug, Deserialize)]
pub struct UpdateCellPayload {
    #[serde(default, deserialize_with = "deserialize_some")]
    pub value: Option<Option<String>>,
    #[serde(default, deserialize_with = "deserialize_some")]
    pub formula: Option<Option<String>>,
}

fn deserialize_some<'de, T, D>(deserializer: D) -> Result<Option<T>, D::Error>
where
    T: Deserialize<'de>,
    D: Deserializer<'de>,
{
    Deserialize::deserialize(deserializer).map(Some)
}

#[derive(Debug, Deserialize)]
pub struct CreateSheetPayload {
    pub name: String,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct SheetItem {
    pub id: i64,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct RowItem {
    pub id: i64,
    pub sheet_id: i64,
    pub row_index: i32,
    pub height: f64,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct ColumnItem {
    pub id: i64,
    pub sheet_id: i64,
    pub column_index: i32,
    pub width: f64,
}

#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct CellItem {
    pub id: i64,
    pub sheet_id: i64,
    pub row_id: i64,
    pub column_id: i64,
    pub value: Option<String>,
    pub formula: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}
