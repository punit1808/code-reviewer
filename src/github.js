import dotenv from "dotenv";
dotenv.config();

import parseDiff from "parse-diff";

import { reviewCode } from "./reviewer.js";
import { getInstallationOctokit } from "./githubApp.js";
import { logError, logInfo } from "./logger.js";

const MAX_HUNK_CHARACTERS = 6_000;
const MAX_BATCH_CHARACTERS = 12_000;
const CONTEXT_LINES_PER_CHANGE = 5;

function isSubstantiveAddition(change) {
  return change.type === "add" && change.content.replace(/^\+/, "").trim() !== "";
}

function compactHunk(file, chunk) {
  const additions = chunk.changes.filter(isSubstantiveAddition);
  if (!additions.length) {
    return [];
  }

  const header = `@@ -${chunk.oldStart},${chunk.oldLines} +${chunk.newStart},${chunk.newLines} @@`;
  const fullDiff = chunk.changes.map(change => change.content).join("\n");

  if (fullDiff.length <= MAX_HUNK_CHARACTERS) {
    return [{
      path: file.to,
      changedLineNumbers: additions.map(change => change.ln),
      hunk: `${header}\n${fullDiff}`,
    }];
  }

  // Split large hunks into bounded windows. Every changed line stays in a
  // window, with nearby context; no code is truncated mid-line.
  const additionIndexes = chunk.changes
    .map((change, index) => (isSubstantiveAddition(change) ? index : -1))
    .filter(index => index >= 0);
  const windows = [];
  let windowStart;
  let windowEnd;

  const renderedLength = (start, end) => chunk.changes
    .slice(start, end)
    .map(change => change.content)
    .join("\n").length;

  for (const index of additionIndexes) {
    const start = Math.max(0, index - CONTEXT_LINES_PER_CHANGE);
    const end = Math.min(chunk.changes.length, index + CONTEXT_LINES_PER_CHANGE + 1);

    if (windowStart === undefined || renderedLength(windowStart, Math.max(windowEnd, end)) > MAX_HUNK_CHARACTERS) {
      if (windowStart !== undefined) {
        windows.push([windowStart, windowEnd]);
      }
      windowStart = start;
      windowEnd = end;
    } else {
      windowStart = Math.min(windowStart, start);
      windowEnd = Math.max(windowEnd, end);
    }
  }
  windows.push([windowStart, windowEnd]);

  return windows.map(([start, end]) => ({
    path: file.to,
    changedLineNumbers: chunk.changes
      .slice(start, end)
      .filter(isSubstantiveAddition)
      .map(change => change.ln),
    hunk: `${header}\n${chunk.changes.slice(start, end).map(change => change.content).join("\n")}`,
  }));
}

export function buildReviewBatches(parsedDiff) {
  const hunks = parsedDiff
    .flatMap(file => file.chunks.flatMap(chunk => compactHunk(file, chunk)))
    .filter(Boolean);
  const batches = [];
  let batch = [];
  let batchSize = 0;

  for (const hunk of hunks) {
    const hunkSize = JSON.stringify(hunk).length;
    if (batch.length && batchSize + hunkSize > MAX_BATCH_CHARACTERS) {
      batches.push(batch);
      batch = [];
      batchSize = 0;
    }
    batch.push(hunk);
    batchSize += hunkSize;
  }

  if (batch.length) {
    batches.push(batch);
  }

  return batches;
}

export function keepEligibleFindings(findings, reviewBatches) {
  const eligibleLinesByPath = new Map();
  for (const hunk of reviewBatches.flat()) {
    const lines = eligibleLinesByPath.get(hunk.path) ?? new Set();
    hunk.changedLineNumbers.forEach(line => lines.add(line));
    eligibleLinesByPath.set(hunk.path, lines);
  }

  return findings.map(finding => {
    const rawLine = finding?.line ?? finding?.lineNumber ?? finding?.line_number;
    return {
      ...finding,
      path: finding?.path ?? finding?.file ?? finding?.filePath,
      line: typeof rawLine === "string" && /^\d+$/.test(rawLine)
        ? Number(rawLine)
        : rawLine,
    };
  }).filter(finding => {
    const eligible = typeof finding.path === "string"
      && finding.path.length > 0
      && Number.isInteger(finding.line)
      && eligibleLinesByPath.get(finding.path)?.has(finding.line);
    if (!eligible) {
      logInfo("Discarded LLM finding outside changed-line scope", {
        path: finding?.path,
        line: finding?.line,
        fields: Object.keys(finding ?? {}),
      });
    }
    return eligible;
  });
}

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

    const reviewBatches = buildReviewBatches(parsed);

    logInfo("Prepared bounded diff-hunk review batches", {
      owner,
      repo,
      pullNumber,
      filesChanged: filesResponse.data.length,
      batchCount: reviewBatches.length,
      hunkCount: reviewBatches.flat().length,
    });

    // Ask AI for findings
    stage = "generate LLM review";
    const rawFindings = [];
    for (const [batchIndex, reviewBatch] of reviewBatches.entries()) {
      logInfo("Requesting LLM review batch", {
        owner,
        repo,
        pullNumber,
        batchIndex: batchIndex + 1,
        batchCount: reviewBatches.length,
        hunkCount: reviewBatch.length,
      });
      rawFindings.push(...await reviewCode(reviewBatch));
    }
    const findings = keepEligibleFindings(rawFindings, reviewBatches);

    logInfo("LLM review completed", {
      owner,
      repo,
      pullNumber,
      rawFindingCount: rawFindings.length,
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
