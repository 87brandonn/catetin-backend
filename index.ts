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
  console.log(`⚡️[server]: Server start running @https://localhost:${PORT}`);
  db.sequelize
    .sync({
      force:
        true /* DANGEROUS OPERATION, please do not modify it unless you asks for permissions first */,
    })
    .then(() => {
      console.log("Connection established, initiating jobs...");
      initJobs().catch((err) => {
        console.error(
          "An error occured while initiating jobs... Terminating activity",
          err
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
