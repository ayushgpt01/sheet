use crate::grid::routes::grid_router;
use axum::Router;

pub fn api_router() -> Router {
    grid_router()
}
