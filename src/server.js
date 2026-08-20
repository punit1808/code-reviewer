import express from "express";
import dotenv from "dotenv";
import { handlePullRequest } from "./github.js";
import { logError, logInfo } from "./logger.js";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/health" , async(req ,res) => {
	res.sendStatus(200);
});

app.post("/webhook", async (req, res) => {
  const event = req.headers["x-github-event"];
  const deliveryId = req.headers["x-github-delivery"];

  try {
    logInfo("Received GitHub webhook", {
      deliveryId,
      event,
      action: req.body?.action,
    });

    if (event === "pull_request") {
      await handlePullRequest(req.body);
    }

    res.sendStatus(200);
  } catch (err) {
    logError("Webhook request failed", err, {
      deliveryId,
      event,
      action: req.body?.action,
    });
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
