import dotenv from "dotenv";
dotenv.config();

import parseDiff from "parse-diff";

import { reviewCode } from "./reviewer.js";
import { getInstallationOctokit } from "./githubApp.js";
import { logError, logInfo } from "./logger.js";

export async function handlePullRequest(payload) {
  let checkRun;
  let owner;
  let repo;
  let octokit;
  let pullNumber;
  let installationId;
  let stage = "validate pull request payload";

  try {
    installationId = payload?.installation?.id;
    if (!installationId) {
      throw new Error("Webhook payload is missing installation.id");
    }

    stage = "create GitHub installation client";
    logInfo("Creating GitHub installation client", { installationId });

    octokit = await getInstallationOctokit(
      installationId
    );

    stage = "read pull request action";
    const action = payload.action;

    logInfo("Processing pull request webhook", { installationId, action });

    if (action !== "opened" && action !== "synchronize") {
      logInfo("Skipping unsupported pull request action", { installationId, action });
      return;
    }

    stage = "read repository metadata";
    owner = payload.repository.owner.login;
    repo = payload.repository.name;

    pullNumber = payload.pull_request.number;

    logInfo("Reviewing pull request", { owner, repo, pullNumber, installationId });

    // Create Check Run
    stage = "create GitHub check run";
    const head_sha = payload.pull_request.head.sha;

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

    logInfo("GitHub check run created", {
      owner,
      repo,
      pullNumber,
      checkRunId: checkRun.data.id,
    });

    // Fetch PR files
    stage = "fetch pull request files";
    const filesResponse = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber,
    });

    let combinedDiff = "";

    for (const file of filesResponse.data) {
      combinedDiff += `
diff --git a/${file.filename} b/${file.filename}
${file.patch || ""}
`;
    }

    // Parse diff
    stage = "parse pull request diff";
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

    logInfo("Extracted changed lines", {
      owner,
      repo,
      pullNumber,
      filesChanged: filesResponse.data.length,
      changedLineCount: changedLines.length,
    });

    // Ask AI for findings
    stage = "generate LLM review";
    const findings = await reviewCode(changedLines);

    logInfo("LLM review completed", {
      owner,
      repo,
      pullNumber,
      findingCount: findings.length,
    });

    if (!findings.length) {
      stage = "complete check run without findings";

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
  body: `⚠ ${finding.comment}

\`\`\`suggestion
${finding.suggestion || ""}
\`\`\`
`,
    }));

    stage = "post inline review comments";
    logInfo("Posting inline review comments", {
      owner,
      repo,
      pullNumber,
      commentCount: comments.length,
    });

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      event: "COMMENT",
      comments,
    });
    logInfo("Inline review comments posted", { owner, repo, pullNumber });

    // Complete check run
    stage = "complete check run with findings";
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

    logInfo("Pull request review completed", {
      owner,
      repo,
      pullNumber,
      checkRunId: checkRun.data.id,
      commentCount: comments.length,
    });

  } catch (err) {
    logError("Pull request review failed", err, {
      stage,
      installationId,
      owner,
      repo,
      pullNumber,
      checkRunId: checkRun?.data?.id,
    });

    try {
      if (checkRun?.data?.id && octokit) {
        const failedStage = stage;
        await octokit.checks.update({
          owner,
          repo,
          check_run_id: checkRun.data.id,
          status: "completed",
          conclusion: "failure",
          output: {
            title: "AI Review Failed",
            summary: `The review failed during: ${failedStage}. Check the service logs for details.`,
          },
        });
      }
    } catch (updateErr) {
      logError("Failed to mark GitHub check run as failed", updateErr, {
        originalStage: stage,
        owner,
        repo,
        pullNumber,
        checkRunId: checkRun?.data?.id,
      });
    }
  }
}
