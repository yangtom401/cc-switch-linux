# cc-switch-web

> Web-based CC Switch for Claude Code, Codex, Gemini CLI, OpenCode, OpenClaw & OMO.

🙏 This project is a fork of [farion1231/cc-switch](https://github.com/farion1231/cc-switch) by Jason Young. Thanks to the original author for the excellent work. This fork adds Web Server mode for cloud/headless deployment.

[![Release](https://img.shields.io/badge/Release-v0.21.0-ea7233?style=flat-square&logo=github)](https://github.com/Laliet/cc-switch-web/releases/latest)
[![License](https://img.shields.io/github/license/Laliet/cc-switch-web?style=flat-square)](LICENSE)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=flat-square&logo=windows&logoColor=white)](https://github.com/Laliet/cc-switch-web/releases/latest)
[![macOS](https://img.shields.io/badge/macOS-000000?style=flat-square&logo=apple&logoColor=white)](https://github.com/Laliet/cc-switch-web/releases/latest)
[![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat-square&logo=linux&logoColor=black)](https://github.com/Laliet/cc-switch-web/releases/latest)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://github.com/Laliet/cc-switch-web/pkgs/container/cc-switch-web)

**Cross-platform web-based All-in-One assistant for Claude Code, Codex, Gemini CLI, OpenCode, OpenClaw & OMO**

[Legal Notice](LEGAL_NOTICE.md) | [Changelog](CHANGELOG.md)

## About / 项目简介

**cc-switch-web** is a cross-platform web-based **CC Switch** for **Claude Code**, **Codex**, **Gemini CLI**, **OpenCode**, **OpenClaw**, and **oh-my-opencode (OMO)**. It lets you manage providers and host-side configuration from either a desktop app or an authenticated headless Web console.

Whether you're working locally or in a headless cloud environment, cc-switch-web offers a seamless experience for:

- **One-click provider switching** between OpenAI-compatible API endpoints
- **Unified MCP server management** across Claude/Codex/Gemini/OpenCode
- **Skills marketplace** to browse and install Claude skills from GitHub
- **System prompt editor** with syntax highlighting
- **Configuration backup/restore** with version history
- **OpenCode and OMO configuration UI** with presets, model metadata, and OMO Slim support
- **OpenClaw configuration center** for models, Agents defaults, Environment, Tools, external Provider reconciliation, Workspace, daily memory, and sessions
- **Stream health checks and retained history** for validating provider streaming responses
- **Web server mode** for cloud/headless deployment with Basic Auth

---

## Contact /联系

If you have any questions, you can contact me here https://linux.do/t/topic/1217545

## Screenshots

| Provider Switching + Local Routing | Usage Dashboard |
| --- | --- |
| ![Provider Switching + Local Routing](assets/screenshots/v0.15.0-main.png) | ![Usage Dashboard](assets/screenshots/v0.15.0-usage-dashboard.png) |

| MCP Server Management | Prompt Management |
| --- | --- |
| ![MCP Server Management](assets/screenshots/v0.15.0-mcp.png) | ![Prompt Management](assets/screenshots/v0.15.0-prompts.png) |

| Skills Marketplace | Add Provider |
| --- | --- |
| ![Skills Marketplace](assets/screenshots/v0.15.0-skills.png) | ![Add Provider](assets/screenshots/v0.15.0-add-provider.png) |

| Configure Provider |
| --- |
| ![Configure Provider](assets/screenshots/v0.15.0-config-provider.png) |

---

## Features

### Core Features

- **Multi-Provider Management**: Switch between different AI providers (OpenAI-compatible endpoints) with one click
- **Unified MCP Management**: Configure Model Context Protocol servers across Claude/Codex/Gemini/OpenCode
- **Skills Marketplace**: Browse and install Claude skills from GitHub repositories
- **Prompt Management**: Create and manage system prompts with a built-in CodeMirror editor
- **OpenCode Provider Presets**: Select AI SDK packages, import preset models, fetch model lists, and edit model variants/options
- **OMO / OMO Slim UI**: Manage oh-my-opencode and oh-my-opencode-slim configuration with structured fields
- **OpenClaw Management**: Manage additive providers, models, Agents defaults, Environment, Tools, raw JSON5, Workspace, and daily memory with ETag conflict protection and backups

### Extended Features

- **Backup Auto-failover**: Automatically switch to backup providers when primary fails
- **Stream Health Check**: Test streaming responses and classify common provider errors
- **Session Manager**: Browse host-side Claude, Codex, Gemini, OpenCode, and OpenClaw sessions with snapshot-bound pagination and protected deletion.