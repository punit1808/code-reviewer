# AI Code Reviewer

An AI-powered GitHub Pull Request reviewer built using Node.js, GitHub Webhooks, Ollama, and local LLMs.

This project automatically reviews Pull Requests using a locally running AI model and posts review feedback directly on GitHub.

---

# Features

## Current Features

- GitHub Pull Request webhook integration
- Automatic PR event detection
- PR diff fetching using GitHub APIs
- Local LLM integration using Ollama
- AI-generated code review feedback
- Pull Request review posting
- Supports local/offline AI models
- Built using modern ESM-based Node.js

---

# Architecture

```text
GitHub Pull Request
        ↓
GitHub Webhook
        ↓
Node.js Review Server
        ↓
Fetch PR Diff
        ↓
Ollama Local LLM
        ↓
AI Review Generation
        ↓
GitHub PR Review Comment
```

---

# Tech Stack

| Component | Technology |
|---|---|
| Backend | Node.js + Express |
| GitHub SDK | Octokit |
| AI Runtime | Ollama |
| LLM Model | Qwen2.5-Coder |
| Tunneling | ngrok |
| Module System | ESM |

---

# Project Structure

```text
code-reviewer/
├── src/
│   ├── server.js
│   ├── github.js
│   ├── reviewer.js
│   └── ollama.js
├── .env
├── package.json
└── README.md
```

---

# Setup Instructions

## 1. Clone Repository

```bash
git clone <your-repo-url>
cd code-reviewer
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Install Ollama

Download:
https://ollama.com/download

---

## 4. Pull Local AI Model

```bash
ollama pull qwen2.5-coder:7b
```

---

## 5. Start Ollama

```bash
ollama serve
```

---

## 6. Configure Environment Variables

Create `.env` file:

```env
PORT=3000

GITHUB_TOKEN=your_github_personal_access_token

OLLAMA_URL=http://localhost:11434
```

---

## 7. Start Development Server

```bash
npm run dev
```

Expected output:

```text
Server running on port 3000
```

---

## 8. Expose Local Server Using ngrok

Download:
https://ngrok.com/download

Run:

```bash
ngrok http 3000
```

Example:

```text
https://abcd-1234.ngrok-free.app
```

---

## 9. Configure GitHub Webhook

Go to:

```text
Repository Settings
→ Webhooks
→ Add Webhook
```

### Payload URL

```text
https://your-ngrok-url/webhook
```

### Content Type

```text
application/json
```

### Events

Select:

```text
Pull Requests
```

---

# How It Works

## Webhook Event

When a Pull Request is opened or updated:
- GitHub sends webhook event
- Node.js server receives payload

---

## PR Diff Fetching

The backend:
- fetches changed files
- extracts patch/diff information
- combines diffs into AI review prompt

---

## AI Review

The diff is sent to:
- local Ollama runtime
- Qwen2.5-Coder model

The model analyzes:
- bugs
- readability
- performance
- security
- bad practices

---

## GitHub Review Posting

The generated review is automatically posted back to the Pull Request using GitHub APIs.

---

# Example Review

```text
Potential issue detected:

- This condition always evaluates to true.
- Application startup logic becomes unreachable.
- Consider removing temporary debug logic.
```

---

# Current Limitations

- Inline code comments not implemented yet
- No diff-to-line mapping yet
- No streaming/live review UI
- No MCP integration yet
- No repository-wide context awareness yet
- Limited prompt engineering

---

# Planned Features

## Upcoming Improvements

- Inline GitHub review comments
- GitHub Check Runs integration
- Live "AI Reviewing..." status
- MCP support
- Repository-wide code understanding
- Semantic code search
- Multi-file reasoning
- Vector memory
- Architecture-aware reviews
- AI-generated fix suggestions

---

# Recommended Models

| Model | Recommended |
|---|---|
| Qwen2.5-Coder 7B | ✅ |
| DeepSeek-Coder | ✅ |
| CodeLlama | ✅ |

---

# Useful Commands

## Start Server

```bash
npm run dev
```

## Start Ollama

```bash
ollama serve
```

## Pull Model

```bash
ollama pull qwen2.5-coder:7b
```

---

# Security Notes

- Never commit `.env`
- Keep GitHub tokens private
- Use minimum required permissions
- Rotate tokens periodically

---

# Future Goal

Build a fully autonomous AI code reviewer similar to:
- CodeRabbit
- GitHub Copilot Review
- Sweep AI

with:
- inline review comments
- repository context
- architecture understanding
- MCP-powered tooling
- local and hosted LLM support

---

# License

MIT License
