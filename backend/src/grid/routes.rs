use super::{
    handlers::create_grid,
    types::{
        Cell, ColumnItem, CreateSheetPayload, Grid, Pagination, RowItem, SheetItem,
        UpdateCellPayload, UpdateSheetPayload,
    },
};
use crate::{
    grid::types::CellItem,
    http::error::{AppError, Result},
};
use axum::{
    Extension, Json, Router,
    extract::{Path, Query},
    routing::{delete, get, patch, post},
};
use sqlx::{PgPool, Postgres, QueryBuilder};
use std::collections::HashMap;

pub fn grid_router() -> Router {
    Router::new()
        .route("/api/sheets", get(get_sheets))
        .route("/api/sheets", post(create_sheet))
        .route("/api/sheets/{id}", patch(update_sheet))
        .route("/api/sheets/{id}", delete(delete_sheet))
        .route("/api/sheets/{id}", get(get_sheet_by_id))
        .route("/api/sheets/{id}/duplicate", post(duplicate_sheet))
        .route("/api/sheets/{id}/cell/{cell_id}", patch(update_cell))
}

async fn get_sheets(
    Extension(pool): Extension<PgPool>,
    pagination: Query<Pagination>,
) -> Result<Json<Vec<SheetItem>>> {
    let pagination: Pagination = pagination.0;

    let sheets = sqlx::query_as!(
        SheetItem,
        "SELECT * from sheets LIMIT $1 OFFSET $2",
        pagination.limit,
        pagination.start
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(sheets))
}

async fn create_sheet(
    Extension(pool): Extension<PgPool>,
    Json(payload): Json<CreateSheetPayload>,
) -> Result<Json<SheetItem>> {
    let mut tx = pool.begin().await?;

    let sheet = sqlx::query_as!(
        SheetItem,
        r#"
        INSERT INTO sheets (name)
        VALUES ($1)
        RETURNING id, name, created_at, updated_at
        "#,
        payload.name
    )
    .fetch_one(&mut *tx)
    .await?;

    let mut rows: Vec<RowItem> = vec![];
    let mut cols: Vec<ColumnItem> = vec![];

    if payload.row_count > 0 {
        let mut row_builder: QueryBuilder<Postgres> =
            QueryBuilder::new("INSERT INTO rows (sheet_id, row_index) ");

        row_builder.push_values(1..=payload.row_count, |mut b, i| {
            b.push_bind(sheet.id).push_bind(i as i32);
        });
        row_builder.push(" RETURNING id, sheet_id, row_index, height");

        rows = row_builder
            .build_query_as::<RowItem>()
            .fetch_all(&mut *tx)
            .await?;
    }

    if payload.col_count > 0 {
        let mut col_builder: QueryBuilder<Postgres> =
            QueryBuilder::new("INSERT INTO columns (sheet_id, column_index) ");

        col_builder.push_values(1..=payload.col_count, |mut b, i| {
            b.push_bind(sheet.id).push_bind(i as i32);
        });
        col_builder.push(" RETURNING id, sheet_id, column_index, width");

        cols = col_builder
            .build_query_as::<ColumnItem>()
            .fetch_all(&mut *tx)
            .await?;
    }

    const CELL_INSERT_CHUNK_SIZE: usize = 5000;

    if !rows.is_empty() && !cols.is_empty() {
        let total_cells = rows.len() * cols.len();
        let mut cell_data = Vec::with_capacity(total_cells);

        for row in &rows {
            for col in &cols {
                cell_data.push((sheet.id, row.id, col.id));
            }
        }

        for chunk in cell_data.chunks(CELL_INSERT_CHUNK_SIZE) {
            let mut cell_builder: QueryBuilder<Postgres> =
                QueryBuilder::new("INSERT INTO cells (sheet_id, row_id, column_id) ");

            cell_builder.push_values(chunk.iter(), |mut b, (sheet_id, row_id, col_id)| {
                b.push_bind(*sheet_id).push_bind(*row_id).push_bind(*col_id);
            });

            cell_builder.build().execute(&mut *tx).await?;
        }
    }

    tx.commit().await?;

    Ok(Json(sheet))
}

async fn delete_sheet(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<i64>,
) -> Result<Json<bool>> {
    let exists = sqlx::query_scalar!("SELECT EXISTS(SELECT 1 FROM sheets WHERE id = $1)", id)
        .fetch_one(&pool)
        .await?;

    if !exists.unwrap_or(false) {
        return Err(AppError::NotFound);
    }

    sqlx::query!("DELETE FROM sheets WHERE id = $1", id)
        .execute(&pool)
        .await?;

    Ok(Json(true))
}

async fn update_sheet(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<i64>,
    Json(payload): Json<UpdateSheetPayload>,
) -> Result<Json<bool>> {
    let exists = sqlx::query_scalar!("SELECT EXISTS(SELECT 1 FROM sheets WHERE id = $1)", id)
        .fetch_one(&pool)
        .await?;

    if !exists.unwrap_or(false) {
        return Err(AppError::NotFound);
    }

    sqlx::query!(
        "UPDATE sheets SET name = $1 WHERE id = $2",
        payload.name,
        id
    )
    .execute(&pool)
    .await?;

    Ok(Json(true))
}

async fn duplicate_sheet(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<i64>,
) -> Result<Json<SheetItem>> {
    let mut tux = pool.begin().await?;

    let orignal_sheet = sqlx::query_as!(SheetItem, "SELECT * FROM sheets WHERE id = $1", id)
        .fetch_optional(&mut *tux)
        .await?
        .ok_or(AppError::NotFound)?;

    let new_sheet = sqlx::query_as!(
        SheetItem,
        r#"INSERT INTO sheets (name) 
        VALUES ($1) 
        RETURNING id, name, created_at, updated_at "#,
        format!("{} (Copy)", orignal_sheet.name)
    )
    .fetch_one(&mut *tux)
    .await?;

    let new_sheet_id = new_sheet.id;
    let original_rows = sqlx::query_as!(
        RowItem,
        "SELECT * FROM rows WHERE sheet_id = $1 ORDER BY row_index",
        id
    )
    .fetch_all(&pool)
    .await?;

    let mut row_qb: QueryBuilder<Postgres> =
        QueryBuilder::new("INSERT INTO rows (sheet_id, row_index, height) ");

    row_qb.push_values(&original_rows, |mut b, row| {
        b.push_bind(new_sheet_id)
            .push_bind(row.row_index)
            .push_bind(row.height);
    });

    let new_row_ids: Vec<i64> = row_qb
        .push(" RETURNING id")
        .build_query_scalar()
        .fetch_all(&mut *tux)
        .await?;

    let row_id_map: HashMap<i64, i64> = original_rows
        .iter()
        .zip(new_row_ids.iter())
        .map(|(orig, new)| (orig.id, *new))
        .collect();

    let original_columns = sqlx::query_as!(
        ColumnItem,
        "SELECT * FROM columns WHERE sheet_id = $1 ORDER BY column_index",
        id
    )
    .fetch_all(&pool)
    .await?;

    let mut col_qb: QueryBuilder<Postgres> =
        QueryBuilder::new("INSERT INTO columns (sheet_id, column_index, width) ");

    col_qb.push_values(&original_columns, |mut b, col| {
        b.push_bind(new_sheet_id)
            .push_bind(col.column_index)
            .push_bind(col.width);
    });

    let new_col_ids: Vec<i64> = col_qb
        .push(" RETURNING id")
        .build_query_scalar()
        .fetch_all(&mut *tux)
        .await?;

    let col_id_map: HashMap<i64, i64> = original_columns
        .iter()
        .zip(new_col_ids.iter())
        .map(|(orig, new)| (orig.id, *new))
        .collect();

    let original_cells = sqlx::query_as!(CellItem, "SELECT * FROM cells WHERE sheet_id = $1", id)
        .fetch_all(&pool)
        .await?;

    let chunk_size = 5000;
    let mut bindings = Vec::with_capacity(original_cells.len());

    for cell in &original_cells {
        let new_row_id = *row_id_map
            .get(&cell.row_id)
            .ok_or_else(|| AppError::InternalServerError)?;

        let new_col_id = *col_id_map
            .get(&cell.column_id)
            .ok_or_else(|| AppError::InternalServerError)?;

        bindings.push((
            new_row_id,
            new_col_id,
            cell.value.as_deref(),
            cell.formula.as_deref(),
        ));
    }

    for chunk in bindings.chunks(chunk_size) {
        let mut cell_qb: QueryBuilder<Postgres> =
            QueryBuilder::new("INSERT INTO cells (sheet_id, row_id, column_id, value, formula) ");

        cell_qb.push_values(chunk, |mut b, (row_id, col_id, value, formula)| {
            b.push_bind(new_sheet_id)
                .push_bind(row_id)
                .push_bind(col_id)
                .push_bind(value)
                .push_bind(formula);
        });
    }

    tux.commit().await?;

    Ok(Json(new_sheet))
}

async fn get_sheet_by_id(
    Extension(pool): Extension<PgPool>,
    Path(id): Path<i64>,
) -> Result<Json<Grid>> {
    let exists = sqlx::query_scalar!("SELECT EXISTS(SELECT 1 FROM sheets WHERE id = $1)", id)
        .fetch_one(&pool)
        .await?;

    if !exists.unwrap_or(false) {
        return Err(AppError::NotFound);
    }

    let rows = sqlx::query_as!(RowItem, "SELECT * FROM rows WHERE sheet_id = $1", id)
        .fetch_all(&pool)
        .await?;

    let cols = sqlx::query_as!(ColumnItem, "SELECT * from columns WHERE sheet_id = $1", id)
        .fetch_all(&pool)
        .await?;

    let cells = sqlx::query_as!(
        Cell,
        r#"
        SELECT 
            cells.id,
            cells.value,
            cells.formula,
            rows.row_index,
            rows.height,
            columns.column_index,
            columns.width
        FROM cells
        INNER JOIN rows ON cells.row_id = rows.id
        INNER JOIN columns ON cells.column_id = columns.id
        WHERE cells.sheet_id = $1
        "#,
        id
    )
    .fetch_all(&pool)
    .await?;

    Ok(Json(create_grid(rows, cols, cells)))
}

async fn update_cell(
    Extension(pool): Extension<PgPool>,
    Path((id, cell_id)): Path<(i64, i64)>,
    Json(payload): Json<UpdateCellPayload>,
) -> Result<Json<bool>> {
    let exists = sqlx::query_scalar!(
        "SELECT EXISTS(SELECT 1 FROM cells WHERE id = $1 AND sheet_id = $2)",
        cell_id,
        id
    )
    .fetch_one(&pool)
    .await?;

    if !exists.unwrap_or(false) {
        return Err(AppError::NotFound);
    }

    let mut builder: QueryBuilder<Postgres> = QueryBuilder::new("UPDATE cells SET ");
    let mut first = true;

    if let Some(value) = payload.value {
        if !first {
            builder.push(", ");
        }
        builder.push("value = ");
        builder.push_bind(value);
        first = false;
    }

    if let Some(formula) = payload.formula {
        if !first {
            builder.push(", ");
        }
        builder.push("formula = ");
        builder.push_bind(formula);
    }

    builder.push(" WHERE id = ");
    builder.push_bind(cell_id);

    let query = builder.build();
    query.execute(&pool).await?;

    Ok(Json(true))
}
