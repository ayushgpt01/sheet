use crate::grid::routes::grid_router;
use axum::Router;

pub fn api_router() -> Router {
    Router::new().merge(grid_router())
}
