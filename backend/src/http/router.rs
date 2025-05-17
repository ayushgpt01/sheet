use crate::grid::{handlers::create_grid, types::Grid};
use axum::{Json, Router, routing::get};

pub fn api_router() -> Router {
    Router::new().route("/api/grid", get(get_grid))
}

async fn get_grid() -> Result<Json<Grid>, String> {
    let grid = create_grid();

    Ok(Json(grid))
}
