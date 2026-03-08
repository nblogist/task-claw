use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;

pub async fn init_pool() -> PgPool {
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set (e.g. postgres://user:pass@host:5432/dbname)");

    if !database_url.starts_with("postgres://") && !database_url.starts_with("postgresql://") {
        panic!(
            "DATABASE_URL must start with postgres:// or postgresql:// (got: '{}...')",
            &database_url[..database_url.len().min(20)]
        );
    }

    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&database_url)
        .await
        .unwrap_or_else(|e| panic!("Failed to connect to database: {}", e));

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .unwrap_or_else(|e| panic!("Failed to run database migrations: {}", e));

    pool
}
