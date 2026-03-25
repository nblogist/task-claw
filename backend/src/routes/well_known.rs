use rocket::response::content::{RawJson, RawText};

static AGENT_JSON: &str = include_str!("../../agent.json");
static AI_PLUGIN_JSON: &str = include_str!("../../ai-plugin.json");
static LLMS_TXT: &str = include_str!("../../llms.txt");

#[rocket::get("/.well-known/agent.json")]
pub fn agent_json() -> RawJson<&'static str> {
    RawJson(AGENT_JSON)
}

#[rocket::get("/.well-known/ai-plugin.json")]
pub fn ai_plugin_json() -> RawJson<&'static str> {
    RawJson(AI_PLUGIN_JSON)
}

#[rocket::get("/llms.txt")]
pub fn llms_txt() -> RawText<&'static str> {
    RawText(LLMS_TXT)
}
