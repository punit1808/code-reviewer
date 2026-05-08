# AI Code Reviewer

AI-powered GitHub Pull Request reviewer using Node.js, Ollama, and local LLMs.

Automatically reviews PRs and posts inline review comments directly on GitHub.

---

# Features

- GitHub webhook integration
- PR diff parsing
- Local LLM support via Ollama
- AI-generated code reviews
- Inline GitHub review comments
- Structured JSON-based review pipeline
- Fully local setup

---

# Tech Stack

- Node.js
- Express
- Octokit
- Ollama
- Qwen2.5-Coder
- parse-diff
- ngrok

---

# Architecture

```text
GitHub PR
    ↓
Webhook
    ↓
Node.js Server
    ↓
Parse PR Diff
    ↓
Ollama LLM
    ↓
AI Findings
    ↓
Inline GitHub Review Comments
```

---

# Setup

## Install dependencies

```bash
npm install
```

---

## Install Ollama

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

## Configure Environment Variables

Create `.env`

```env
PORT=3000

GITHUB_TOKEN=your_github_token

OLLAMA_URL=http://localhost:11434
```

---

## Start Server

```bash
npm run dev
```

---

## Expose Localhost

```bash
ngrok http 3000
```

---

## Configure GitHub Webhook

Repository → Settings → Webhooks

Payload URL:

```text
https://your-ngrok-url/webhook
```

Event:
- Pull Requests

---

# Project Structure

```text
src/
├── server.js
├── github.js
├── reviewer.js
└── ollama.js
```

---

# Current Capabilities

- Detect PR events
- Fetch changed files
- Extract changed lines
- Generate structured AI findings
- Post inline review comments

---

# Next Enhancements

- GitHub Check Runs
- Live review status
- MCP integration
- Repository-wide context
- Multi-file reasoning
- AI-generated fixes
