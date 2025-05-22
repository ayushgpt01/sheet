use crate::{config::Config, http::router::api_router};
use axum::Extension;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::EnvFilter;

pub async fn serve(config: Config) {
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    println!("Server running at http://{}", addr);

    let db_pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to database");

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .or_else(|_| EnvFilter::try_new("sheeter=info,tower_http=debug"))
                .unwrap(),
        )
        .init();

    let app = api_router()
        .layer(Extension(db_pool))
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .expect("Failed to create TCP Listener");

    axum::serve(listener, app)
        .await
        .expect("Failed to start axum server");
}
