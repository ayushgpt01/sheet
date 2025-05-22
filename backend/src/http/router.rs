use crate::grid::{handlers::create_grid, types::Grid};
use axum::{Extension, Json, Router, routing::get};
use sqlx::PgPool;

pub fn api_router() -> Router {
    Router::new()
        .route("/api/grid", get(get_grid))
        .route("/test", get(test))
}

async fn get_grid() -> Result<Json<Grid>, String> {
    let grid = create_grid();

    Ok(Json(grid))
}

async fn test(Extension(pool): Extension<PgPool>) -> Result<Json<Vec<String>>, String> {
    let rows = sqlx::query!("SELECT * FROM sheets")
        .fetch_all(&pool)
        .await
        .unwrap();

    let usernames: Vec<String> = rows.into_iter().map(|r| r.name).collect();
    Ok(Json(usernames))
}
