# AI Code Reviewer

AI-powered GitHub Pull Request reviewer using Node.js, Ollama, local LLMs, and GitHub Apps.

Automatically reviews Pull Requests and posts inline AI review comments directly on GitHub.

---

# Features

- GitHub App integration
- GitHub webhook integration
- PR diff parsing
- Local LLM support via Ollama
- AI-generated code reviews
- Inline GitHub review comments
- GitHub Check Runs integration
- Live review status updates
- Structured JSON-based review pipeline
- Fully local setup

---

# Tech Stack

- Node.js
- Express
- Octokit
- GitHub Apps
- Ollama
- Qwen2.5-Coder
- parse-diff
- ngrok

---

# Architecture

```text
GitHub Pull Request
        ↓
GitHub App Webhook
        ↓
Node.js Review Server
        ↓
GitHub App Authentication
        ↓
Fetch PR Diff
        ↓
Parse Changed Lines
        ↓
Ollama Local LLM
        ↓
Structured AI Findings
        ↓
Inline GitHub Review Comments
        ↓
GitHub Check Runs Status
```

---

# Current Capabilities

- Detect Pull Request events
- Authenticate using GitHub App
- Fetch changed PR files
- Extract changed lines from diff
- Generate structured AI findings
- Post inline GitHub review comments
- Show live review status using Check Runs
- Run fully locally with Ollama

---

# Project Structure

```text
code-reviewer/
├── keys/
│   └── github-app.pem
├── src/
│   ├── server.js
│   ├── github.js
│   ├── githubApp.js
│   ├── reviewer.js
│   └── ollama.js
├── .env
├── package.json
└── README.md
```

---

# Setup

## Install Dependencies

```bash
npm install
```

---

## Install Ollama

Download:

https://ollama.com/download

Pull model:

```bash
ollama pull qwen2.5-coder:7b
```

Start Ollama:

```bash
ollama serve
```

---

# Environment Variables

Create `.env`

```env
PORT=3000

OLLAMA_URL=http://localhost:11434

GITHUB_APP_ID=YOUR_APP_ID

GITHUB_PRIVATE_KEY_PATH=./keys/github-app.pem
```

---

# Start Server

```bash
npm run dev
```

---

# Expose Localhost

```bash
ngrok http 3000
```

---

# GitHub App Setup

## Create GitHub App

GitHub Settings → Developer Settings → GitHub Apps

---

## Required Permissions

### Repository Permissions

| Permission | Access |
|---|---|
| Pull requests | Read & Write |
| Checks | Read & Write |
| Contents | Read |
| Metadata | Read |

---

## Subscribe To Events

- Pull requests
- Check runs
- Check suites

---

## Install App

Install app on target repository.

---

# Webhook URL

```text
https://your-ngrok-url/webhook
```

---

# Example Workflow

```text
Developer opens PR
        ↓
GitHub App sends webhook
        ↓
AI reviewer fetches PR diff
        ↓
LLM analyzes changed lines
        ↓
Inline review comments posted
        ↓
Check Run updated to completed
```

---

# Example AI Review

```text
⚠ This condition always evaluates to true and prevents application startup.
```

Displayed inline directly beside changed code in GitHub PR.

---

# Current Limitations

- Limited repository-wide context
- No MCP integration yet
- No semantic search
- No multi-file reasoning yet
- Limited architecture understanding

---

# Planned Enhancements

- MCP integration
- Repository-aware reviews
- Semantic code search
- Multi-file reasoning
- AI-generated fix suggestions
- Streaming review updates
- Vector memory
- Architecture-aware analysis

---

# Future Goal

Build a production-grade AI reviewer similar to:
- CodeRabbit
- GitHub Copilot Review
- Sweep AI

with:
- repository context awareness
- intelligent architecture analysis
- autonomous review capabilities
- local + hosted LLM support
