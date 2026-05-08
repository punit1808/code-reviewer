import dotenv from "dotenv";
dotenv.config();

import { Octokit } from "@octokit/rest";
import parseDiff from "parse-diff";

import { reviewCode } from "./reviewer.js";

export async function handlePullRequest(payload) {
  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN.trim(),
    });

    const action = payload.action;

    console.log("Webhook action:", action);

    if (action !== "opened" && action !== "synchronize") {
      return;
    }

    const owner = payload.repository.owner.login;
    const repo = payload.repository.name;
    const pull_number = payload.pull_request.number;

    console.log(`Reviewing PR #${pull_number}`);

    // Fetch PR files
    const filesResponse = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    let combinedDiff = "";

    for (const file of filesResponse.data) {
      combinedDiff += `
diff --git a/${file.filename} b/${file.filename}
${file.patch || ""}
`;
    }

    // Parse diff
    const parsed = parseDiff(combinedDiff);

const changedLines = [];

for (const file of parsed) {
  for (const chunk of file.chunks) {
    for (const change of chunk.changes) {
      if (change.type === "add") {
        changedLines.push({
          path: file.to,
          line: change.ln,
          content: change.content,
        });
      }
    }
  }
}

console.log("Changed Lines:", changedLines);

    console.log("Parsed files:", parsed.length);

    // Ask AI for findings
    const findings = await reviewCode(changedLines);

    console.log("AI Findings:", findings);

    if (!findings.length) {
      console.log("No findings");
      return;
    }

    // Convert findings into GitHub review comments
    const comments = findings.map(finding => ({
	path: finding.path,
	line: finding.line,
	body: `⚠ ${finding.comment}`,
	}));

    console.log("Posting inline review comments...");

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number,
      event: "COMMENT",
      comments,
    });

    console.log("Inline review posted successfully");
  } catch (err) {
    console.error(err);
  }
}
