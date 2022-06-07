import fs from "fs";
import path from "path";
import { DataTypes, Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const filebasename = path.basename(__filename);
const isProduction = process.env.NODE_ENV === "production";

const {
  PSQL_HOST,
  PSQL_DATABASE,
  PSQL_PORT,
  PSQL_PASSWORD,
  PSQL_USER,
  DATABASE_URL,
} = process.env;

const databaseOptions: any = {
  host: PSQL_HOST,
  username: PSQL_USER,
  password: PSQL_PASSWORD,
  port: PSQL_PORT,
  database: PSQL_DATABASE,
};

let sequelize: Sequelize;

if (isProduction) {
  sequelize = new Sequelize(DATABASE_URL as string, {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });
} else {
  sequelize = new Sequelize({ ...databaseOptions, dialect: "postgres" });
}

const db: any = {};
fs.readdirSync(__dirname)
  .filter((file) => {
    const returnFile =
      file.indexOf(".") !== 0 &&
      file !== filebasename &&
      file.slice(-3) === `.js`;
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
