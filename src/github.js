import dotenv from "dotenv";
dotenv.config();

import parseDiff from "parse-diff";

import { reviewCode } from "./reviewer.js";
import { getInstallationOctokit } from "./githubApp.js";

export async function handlePullRequest(payload) {
  let checkRun;
  let owner;
  let repo;
  let octokit;

  try {
    const installationId = payload.installation.id;

    console.log("Installation ID:", installationId);

    octokit = await getInstallationOctokit(
      installationId
    );

    const action = payload.action;

    console.log("Webhook action:", action);

    if (action !== "opened" && action !== "synchronize") {
      return;
    }

    owner = payload.repository.owner.login;
    repo = payload.repository.name;

    const pull_number = payload.pull_request.number;

    console.log(`Reviewing PR #${pull_number}`);

    // Create Check Run
    const head_sha = payload.pull_request.head.sha;

    console.log("Creating check run...");

    checkRun = await octokit.checks.create({
      owner,
      repo,
      name: "AI Code Reviewer",
      head_sha,
      status: "in_progress",
      output: {
        title: "AI Review Started",
        summary: "Reviewing pull request changes...",
      },
    });

    console.log("Check run created");

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

    // Ask AI for findings
    const findings = await reviewCode(changedLines);

    console.log("AI Findings:", findings);

    if (!findings.length) {
      console.log("No findings");

      await octokit.checks.update({
        owner,
        repo,
        check_run_id: checkRun.data.id,
        status: "completed",
        conclusion: "success",
        output: {
          title: "AI Review Completed",
          summary: "No issues found.",
        },
      });

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

    // Complete check run
    await octokit.checks.update({
      owner,
      repo,
      check_run_id: checkRun.data.id,
      status: "completed",
      conclusion: "success",
      output: {
        title: "AI Review Completed",
        summary: `Posted ${comments.length} inline review comment(s).`,
      },
    });

    console.log("Check run completed");

  } catch (err) {
    console.error(err);

    try {
      if (checkRun?.data?.id && octokit) {
        await octokit.checks.update({
          owner,
          repo,
          check_run_id: checkRun.data.id,
          status: "completed",
          conclusion: "failure",
          output: {
            title: "AI Review Failed",
            summary: err.message,
          },
        });
      }
    } catch (updateErr) {
      console.error("Failed to update check run");
    }
  }
}