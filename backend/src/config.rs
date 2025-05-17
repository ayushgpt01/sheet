#[derive(clap::Parser)]
pub struct Config {
    #[clap(long, env)]
    pub port: u16,

    #[clap(long, env)]
    pub database_url: String,
}
