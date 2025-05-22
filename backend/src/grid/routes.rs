use super::{handlers::create_grid, types::Grid};
use crate::http::error::Result;
use axum::{Extension, Json, Router, routing::get};
use sqlx::PgPool;

pub fn grid_router() -> Router {
    Router::new().route("/api/grid", get(get_grid))
}

// TODO - Need to implement these endpoints
// GET /api/sheets?start=0&limit=100
// GET /api/sheets/:id
// PATCH /api/sheets/:id/cell/:cellId - {value, ...}
// POST /api/sheets

async fn get_grid() -> Result<Json<Grid>> {
    let grid = create_grid();

    Ok(Json(grid))
}

async fn test(Extension(pool): Extension<PgPool>) -> Result<Json<Vec<String>>> {
    let rows = sqlx::query!("SELECT * FROM sheets")
        .fetch_all(&pool)
        .await?;

    let usernames: Vec<String> = rows.into_iter().map(|r| r.name).collect();
    Ok(Json(usernames))
}
