import dotenv from "dotenv";
dotenv.config();

import { Octokit } from "@octokit/rest";
import { reviewCode } from "./reviewer.js";

export async function handlePullRequest(payload) {
  try {
    console.log(
      "TOKEN PREVIEW:",
      process.env.GITHUB_TOKEN?.slice(0, 10)
    );

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

    const filesResponse = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    console.log("Files fetched:", filesResponse.data.length);

    let combinedDiff = "";

    for (const file of filesResponse.data) {
      combinedDiff += `
FILE: ${file.filename}

PATCH:
${file.patch || "No patch available"}
`;
    }

    const review = await reviewCode(combinedDiff);

    console.log("Posting review...");

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number,
      body: review,
      event: "COMMENT",
    });

    console.log("Review posted successfully");
  } catch (err) {
    console.error(err);
  }
}
