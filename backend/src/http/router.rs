use super::error::AppError;
use crate::grid::routes::grid_router;
use axum::Router;

pub fn api_router() -> Router {
    Router::new().merge(grid_router()).fallback(handler_404)
}

async fn handler_404() -> AppError {
    AppError::NotFound
}
