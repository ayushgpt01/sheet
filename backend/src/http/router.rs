use axum::{Json, Router, routing::get};
use serde::{Deserialize, Serialize};

pub fn api_router() -> Router {
    Router::new().route("/api/grid", get(get_grid))
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Row {
    pub row_id: u32,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Column {
    pub column_id: u32,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Cell {
    pub cell_id: String,
    pub row_id: u32,
    pub column_id: u32,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Grid {
    pub rows: Vec<Row>,
    pub columns: Vec<Column>,
    pub cells: Vec<Cell>,
}

async fn get_grid() -> Result<Json<Grid>, String> {
    let grid = Grid {
        rows: vec![Row {
            row_id: 1,
            x: 0.0,
            y: 10.0,
            width: 100.0,
            height: 20.0,
        }],
        columns: vec![Column {
            column_id: 101,
            x: 5.0,
            y: 0.0,
            width: 15.0,
            height: 50.0,
        }],
        cells: vec![Cell {
            cell_id: "A1".to_string(),
            row_id: 1,
            column_id: 101,
            x: 5.0,
            y: 10.0,
            width: 15.0,
            height: 20.0,
        }],
    };

    Ok(Json(grid))
}
