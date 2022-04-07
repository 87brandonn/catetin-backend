import fs from "fs";
import path from "path";
import { DataTypes, Sequelize } from "sequelize";
// const sequelize = new Sequelize({
//   dialect: "postgres",
//   username: "mtrennrleqlasm",
//   database: "dbt1pukqt89bes",
//   host: "ec2-54-160-109-68.compute-1.amazonaws.com",
//   port: 5432,
//   password: "abbcb23453e0ecad2e757ab9c8a702600ee30333b5c5bcb4a44caa1988712ce5",
//   dialectOptions: {
//     ssl: {
//       require: true,
//       rejectUnauthorized: false,
//     },
//   },
// });
const filebasename = path.basename(__filename);
const sequelize = new Sequelize({
  dialect: "postgres",
  username: "brandonpardede",
  database: "catetin-local",
  host: "localhost",
  port: 5432,
  password: "brandon00",
});

const db: any = {};
fs.readdirSync(__dirname)
  .filter((file) => {
    const returnFile =
      file.indexOf(".") !== 0 &&
      file !== filebasename &&
      file.slice(-3) === ".ts";
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
