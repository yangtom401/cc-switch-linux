use axum::http::Uri;
use reqwest::header::{HeaderName, HeaderValue, AUTHORIZATION};

use crate::{error::AppError, provider::Provider};

use super::{append_path, validate_base_url, AuthInfo, ProviderAdapter};

pub struct ClaudeAdapter;

pub static CLAUDE_ADAPTER: ClaudeAdapter = ClaudeAdapter;

impl ProviderAdapter for ClaudeAdapter {
    fn extract_base_url(&self, provider: &Provider) -> Result<String, AppError> {
        if let Some(env) = provider.settings_config.get("env").and_then(|v| v.as_object()) {
            if let Some(val) = env
                .get("ANTHROPIC_BASE_URL")
                .or_else(|| env.get("OPENAI_BASE_URL"))
                .or_else(|| env.get("BASE_URL"))
                .and_then(|v| v.as_str())
            {
                let trimmed = val.trim();
                if !trimmed.is_empty() {
                    return Ok(trimmed.to_string());
                }
            }
        }
        if let Some(val) = provider.settings_config.get("baseUrl").and_then(|v| v.as_str()) {
            let trimmed = val.trim();
            if !trimmed.is_empty() {
                return Ok(trimmed.to_string());
            }
        }
        if let Some(val) = provider
            .settings_config
            .get("options")
            .and_then(|o| o.get("baseURL"))
            .and_then(|v| v.as_str())
        {
            let trimmed = val.trim();
            if !trimmed.is_empty() {
                return Ok(trimmed.to_string());
            }
        }
        if let Some(config_toml) = provider.settings_config.get("config").and_then(|v| v.as_str()) {
            for line in config_toml.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("base_url") {
                    if let Some((_, val)) = trimmed.split_once('=') {
                        let val = val.trim().trim_matches('"').trim_matches('\'').trim();
                        if !val.is_empty() {
                            return Ok(val.to_string());
                        }
                    }
                }
            }
        }
        Err(AppError::localized(
            "provider.claude.base_url.missing",
            "缺少 Base URL 配置",
            "Missing Base URL configuration",
        ))
    }

    fn extract_auth(&self, provider: &Provider) -> Result<Option<AuthInfo>, AppError> {
        let mut api_key = String::new();
        if let Some(env) = provider.settings_config.get("env").and_then(|v| v.as_object()) {
            api_key = env
                .get("ANTHROPIC_AUTH_TOKEN")
                .or_else(|| env.get("ANTHROPIC_API_KEY"))
                .or_else(|| env.get("OPENROUTER_API_KEY"))
                .or_else(|| env.get("OPENAI_API_KEY"))
                .or_else(|| env.get("GEMINI_API_KEY"))
                .and_then(|v| v.as_str())
                .unwrap_or_default()
                .trim()
                .to_string();
        }
        if api_key.is_empty() {
            if let Some(val) = provider.settings_config.get("apiKey").and_then(|v| v.as_str()) {
                api_key = val.trim().to_string();
            }
        }
        if api_key.is_empty() {
            if let Some(val) = provider
                .settings_config
                .get("options")
                .and_then(|o| o.get("apiKey"))
                .and_then(|v| v.as_str())
            {
                api_key = val.trim().to_string();
            }
        }
        if api_key.is_empty() {
            if let Some(auth) = provider.settings_config.get("auth").and_then(|v| v.as_object()) {
                api_key = auth
                    .get("OPENAI_API_KEY")
                    .or_else(|| auth.get("api_key"))
                    .and_then(|v| v.as_str())
                    .unwrap_or_default()
                    .trim()
                    .to_string();
            }
        }
        if api_key.is_empty() {
            if let Some(config_toml) = provider.settings_config.get("config").and_then(|v| v.as_str()) {
                for line in config_toml.lines() {
                    let trimmed = line.trim();
                    if trimmed.starts_with("api_key") || trimmed.starts_with("apiKey") {
                        if let Some((_, val)) = trimmed.split_once('=') {
                            let val = val.trim().trim_matches('"').trim_matches('\'').trim();
                            if !val.is_empty() {
                                api_key = val.to_string();
                                break;
                            }
                        }
                    }
                }
            }
        }
        Ok((!api_key.is_empty()).then_some(AuthInfo {
            api_key,
            provider_type: None,
            api_format: None,
            account_id: None,
        }))
    }

    fn build_url(&self, base_url: &str, uri: &Uri) -> Result<String, AppError> {
        let base = validate_base_url(base_url)?;
        let path = uri.path();
        if base.ends_with("/v1beta") && (path == "/v1beta" || path.starts_with("/v1beta/")) {
            let trimmed = path.trim_start_matches("/v1beta");
            let query = uri.query().map(|q| format!("?{q}")).unwrap_or_default();
            return Ok(format!("{base}{trimmed}{query}"));
        }
        if base.ends_with("/v1") && (path == "/v1" || path.starts_with("/v1/")) {
            let trimmed = path.trim_start_matches("/v1");
            let query = uri.query().map(|q| format!("?{q}")).unwrap_or_default();
            return Ok(format!("{base}{trimmed}{query}"));
        }
        append_path(base_url, uri)
    }

    fn auth_headers(&self, auth: &AuthInfo) -> Vec<(HeaderName, HeaderValue)> {
        let mut headers = Vec::new();
        if let Ok(value) = HeaderValue::from_str(&auth.api_key) {
            headers.push((HeaderName::from_static("x-api-key"), value));
        }
        if let Ok(value) = HeaderValue::from_str(&format!("Bearer {}", auth.api_key)) {
            headers.push((AUTHORIZATION, value));
        }
        headers
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use crate::provider::Provider;

    use super::{ClaudeAdapter, ProviderAdapter};

    #[test]
    fn extracts_gemini_api_key_for_claude_desktop_proxy_provider() {
        let provider = Provider {
            id: "desktop-gemini".to_string(),
            name: "Desktop Gemini".to_string(),
            settings_config: json!({
                "env": {
                    "ANTHROPIC_BASE_URL": "https://generativelanguage.googleapis.com/v1beta",
                    "GEMINI_API_KEY": "gemini-key"
                }
            }),
            website_url: None,
            category: None,
            created_at: None,
            sort_index: None,
            notes: None,
            meta: None,
        };

        let auth = ClaudeAdapter
            .extract_auth(&provider)
            .expect("auth")
            .expect("api key");

        assert_eq!(auth.api_key, "gemini-key");
    }

    #[test]
    fn build_url_deduplicates_gemini_v1beta_prefix_for_proxy_provider() {
        let uri: axum::http::Uri = "/v1beta/models/gemini-2.5-pro:generateContent"
            .parse()
            .expect("valid uri");

        let url = ClaudeAdapter
            .build_url("https://generativelanguage.googleapis.com/v1beta", &uri)
            .expect("url");

        assert_eq!(
            url,
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"
        );
    }
}
