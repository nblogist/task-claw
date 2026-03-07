use rocket::response::content::RawJson;

static OPENAPI_SPEC: &str = include_str!("../../openapi.json");

#[rocket::get("/api/openapi.json")]
pub fn openapi_spec() -> RawJson<&'static str> {
    RawJson(OPENAPI_SPEC)
}
