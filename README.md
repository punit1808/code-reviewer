# AI Code Reviewer

AI-powered GitHub Pull Request reviewer using Node.js, GitHub Apps, Ollama, and Groq.

Automatically reviews PRs, posts inline review comments, suggests code fixes.

---

# Features

- GitHub App integration
- PR webhook handling
- Inline GitHub review comments
- AI-generated code suggestions
- GitHub Check Runs support
- Local LLM support (Ollama)
- Cloud LLM support (Groq)
- Diff-aware review pipeline
- Structured JSON review generation

---

# Tech Stack

- Node.js
- Express
- Octokit
- Ollama
- Groq API
- parse-diff

---

# Architecture

```text
GitHub PR
    ↓
Webhook
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

## Use Groq

```env
LLM_PROVIDER=groq
```

---

## Recommended Deployment

- Backend → Render
- LLM → Groq
- GitHub → GitHub App

---

# Current Capabilities

- Detect PR events
- Parse changed lines
- Generate AI findings
- Post inline review comments
- Suggest executable code fixes
- Create GitHub Check Runs

---

# Planned Features

- MCP integration
- Repository-wide context awareness
- Multi-file reasoning
- Semantic code search
- AI-generated patch validation
- Review memory/history
