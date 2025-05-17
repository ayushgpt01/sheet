use crate::{config::Config, http::router::api_router};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

pub async fn serve(config: Config) {
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    println!("Server running at http://{}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    let app = api_router().layer(CorsLayer::permissive());
    axum::serve(listener, app).await.unwrap();
}
