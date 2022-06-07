import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { initJobs } from "./cron";
import db from "./models";
import routes from "./routes";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", routes);

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server start running @https://localhost:${PORT}`);

  /**
   * Line below will replace migration procedure to speed up development purposes.
   * Execute commented line below ONLY IN DEVELOPMENT MODE if there are changes in model schema defined in models/ folder
   * Please do not modify line below to prevent unwanted database behaviour
   * Also make sure to back up the database first if you wish to change command defined below
   */

  db.sequelize
    .sync({
      alter:
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
