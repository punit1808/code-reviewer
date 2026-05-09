import express from "express";
import dotenv from "dotenv";
import { handlePullRequest } from "./github.js";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/health" , async(req ,res) => {
	res.sendStatus(200);
});

app.post("/webhook", async (req, res) => {
  try {
    const event = req.headers["x-github-event"];

    console.log("Received event:", event);

    if (event === "pull_request") {
      await handlePullRequest(req.body);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
