# AI Code Reviewer

AI-powered GitHub Pull Request reviewer using Node.js, GitHub Apps, Ollama, and Groq.

Automatically reviews PRs, posts inline review comments, suggests executable code fixes.

---

# Features

- GitHub App integration
- PR webhook handling
- Inline GitHub review comments
- AI-generated executable code suggestions
- GitHub Check Runs support
- Local LLM support (Ollama)
- Cloud LLM support (Groq)
- Diff-aware review pipeline
- Dockerized deployment
- GitHub Actions CI/CD pipeline

---

# Tech Stack

- Node.js
- Express
- Octokit
- Ollama
- Groq API
- parse-diff
- Docker
- GitHub Actions

---

# Architecture

```text
GitHub PR
    ↓
GitHub App Webhook
    ↓
Node.js Review Server
    ↓
Parse Changed Lines
    ↓
LLM Review Engine
    ↓
Inline Review Comments
    ↓
GitHub Check Runs
```

---

# Local Development

## Install dependencies

```bash
npm install
```

---

## Configure `.env`

```env
PORT=3000

LLM_PROVIDER=ollama

OLLAMA_URL=http://localhost:11434

GROQ_API_KEY=your_groq_key

GITHUB_APP_ID=your_app_id
```

---

## Run Ollama

```bash
ollama serve
```

Pull model:

```bash
ollama pull qwen2.5-coder:7b
```

---

## Start server

```bash
npm run dev
```

---

# Production Setup

## Deployment Stack

- Backend → Render
- Container → Docker
- CI/CD → GitHub Actions
- LLM → Groq
- GitHub Integration → GitHub App

---

## GitHub Actions

Automatically:
- builds Docker image
- pushes image to Docker Hub
- deploys latest image to Render

---

## Render Environment Variables

```env
PORT=3000

LLM_PROVIDER=groq

GROQ_API_KEY=your_groq_key

GITHUB_APP_ID=your_app_id

GITHUB_PRIVATE_KEY=your_multiline_pem_key
```

---

# Current Capabilities

- Detect PR events
- Parse changed lines
- Generate AI findings
- Post inline review comments
- Suggest executable code fixes
- Create GitHub Check Runs
- Support local and cloud LLMs

---

# Planned Features

- MCP integration
- Repository-wide context awareness
- Multi-file reasoning
- Semantic code search
- AI-generated patch validation
- Review memory/history
