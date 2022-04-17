import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import { initJobs } from "./cron";
import db from "./models";
import routes from "./routes";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", routes);

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${PORT}`);
  db.sequelize
    .sync({
      alter: true,
    })
    .then(() => {
      console.log("Connection established, initiating jobs...");
      initJobs().catch((err) => {
        console.error(
          "An error occured while initiating jobs... Terminating activity"
        );
        return;
      });
    })
    .catch((err: any) => {
      console.error(
        err,
        "An error occured while syncing database... Terminating activity"
      );
    });
});
