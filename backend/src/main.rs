use clap::Parser;
use dotenv::dotenv;
use sheeter::config::Config;
use sheeter::http;

#[tokio::main]
async fn main() {
    dotenv().ok();
    let config = Config::parse();
    http::server::serve(config).await;
}
