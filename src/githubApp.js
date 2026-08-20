import fs from "fs";

import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { logError } from "./logger.js";

export async function getInstallationOctokit(
  installationId
) {
  try {
    const privateKeyPath = process.env.GITHUB_PRIVATE_KEY_PATH;

    if (!process.env.GITHUB_APP_ID) {
      throw new Error("GITHUB_APP_ID is not configured");
    }
    if (!privateKeyPath) {
      throw new Error("GITHUB_PRIVATE_KEY_PATH is not configured");
    }

    const privateKey = fs.readFileSync(privateKeyPath, "utf8");

    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID,
        privateKey,
        installationId,
      },
    });
  } catch (err) {
    logError("Failed to create GitHub installation client", err, {
      installationId,
      privateKeyPathConfigured: Boolean(process.env.GITHUB_PRIVATE_KEY_PATH),
    });
    throw err;
  }
}
