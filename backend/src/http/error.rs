use axum::{
    Json,
    body::Body,
    http::{Response, StatusCode},
    response::IntoResponse,
};
use std::{borrow::Cow, collections::HashMap};

#[derive(thiserror::Error, Debug)]
pub enum AppError {
    // Status Code 400
    #[error("error in request body")]
    BadRequest {
        errors: HashMap<Cow<'static, str>, Vec<Cow<'static, str>>>,
    },
    // Status Code 404
    #[error("request path not found")]
    NotFound,
    // Status Code 500
    #[error("an error occured with database")]
    Sqlx(#[from] sqlx::Error),
    // Status Code 500
    #[error("an internal server occured")]
    InternalServerError,
}

impl AppError {
    pub fn process_bad_request<K, V>(errors: impl IntoIterator<Item = (K, V)>) -> Self
    where
        K: Into<Cow<'static, str>>,
        V: Into<Cow<'static, str>>,
    {
        let mut error_map = HashMap::new();

        for (key, val) in errors {
            error_map
                .entry(key.into())
                .or_insert_with(Vec::new)
                .push(val.into());
        }

        Self::BadRequest { errors: error_map }
    }

    fn status_code(&self) -> StatusCode {
        match self {
            Self::BadRequest { .. } => StatusCode::BAD_REQUEST,
            Self::InternalServerError | Self::Sqlx(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::NotFound => StatusCode::NOT_FOUND,
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response<Body> {
        match self {
            Self::BadRequest { errors } => {
                #[derive(serde::Serialize)]
                struct Errors {
                    errors: HashMap<Cow<'static, str>, Vec<Cow<'static, str>>>,
                }

                return (StatusCode::BAD_REQUEST, Json(Errors { errors })).into_response();
            }
            Self::Sqlx(ref e) => {
                tracing::error!("SQLx error: {:?}", e);
            }
            _ => (),
        };

        (self.status_code(), self.to_string()).into_response()
    }
}

pub type Result<T, E = AppError> = std::result::Result<T, E>;
