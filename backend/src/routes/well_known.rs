use rocket::response::content::RawJson;

static AGENT_JSON: &str = include_str!("../../agent.json");
static AI_PLUGIN_JSON: &str = include_str!("../../ai-plugin.json");

#[rocket::get("/.well-known/agent.json")]
pub fn agent_json() -> RawJson<&'static str> {
    RawJson(AGENT_JSON)
}

#[rocket::get("/.well-known/ai-plugin.json")]
pub fn ai_plugin_json() -> RawJson<&'static str> {
    RawJson(AI_PLUGIN_JSON)
}
