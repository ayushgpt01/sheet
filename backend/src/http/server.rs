use crate::{config::Config, http::router::api_router};
use axum::Extension;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;

pub async fn serve(config: Config) {
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    println!("Server running at http://{}", addr);

    let db_pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to database");

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    let app = api_router()
        .layer(Extension(db_pool))
        .layer(CorsLayer::permissive());
    axum::serve(listener, app).await.unwrap();
}
