import fs from "fs";
import path from "path";
import { DataTypes, Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const filebasename = path.basename(__filename);
const isProduction = process.env.NODE_ENV === "production";
const options = isProduction
  ? {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    }
  : {};

const sequelize = new Sequelize(
  isProduction
    ? (process.env.HEROKU_POSTGRESQL_MAUVE_URL as string)
    : `postgres://brandonpardede:brandon00@localhost:5432/catetin-local`,
  {
    dialect: "postgres",
    ...options,
  }
);

const db: any = {};
fs.readdirSync(__dirname)
  .filter((file) => {
    const returnFile =
      file.indexOf(".") !== 0 &&
      file !== filebasename &&
      file.slice(-3) === `.${isProduction ? "js" : "ts"}`;
    return returnFile;
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file)).default(
      sequelize,
      DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

export default db;
