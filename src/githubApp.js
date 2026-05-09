import fs from "fs";

import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

export async function getInstallationOctokit(
  installationId
) {
  console.log(
    "KEY PATH:",
    process.env.GITHUB_PRIVATE_KEY_PATH
  );

  const privateKey = fs.readFileSync(
    process.env.GITHUB_PRIVATE_KEY_PATH,
    "utf8"
  );

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID,
      privateKey,
      installationId,
    },
  });
}
