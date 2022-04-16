import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";
import db from "./models";
import routes from "./routes";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use("/", routes);

db.sequelize
  .sync({
    alter: true,
  })
  .then(() => {
    console.log("Connection established");
    app.listen(PORT, () => {
      console.log(
        `⚡️[server]: Server is running at https://localhost:${PORT}`
      );
    });
  });
