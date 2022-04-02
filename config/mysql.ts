import mysql, { QueryFunction, Pool } from "mysql";
import util from "util";
import config from "./config";
interface PromisifiedPool extends Omit<Pool, "query"> {
  query: QueryFunction | Function;
}

const params = {
  user: config.mysql.user,
  password: config.mysql.pass,
  host: config.mysql.host,
  database: config.mysql.database,
};

const pool: PromisifiedPool = mysql.createPool({ ...params });
pool.getConnection(function (err, connection) {
  if (err) {
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.error("Database connection was closed.");
    }
    if (err.code === "ER_CON_COUNT_ERROR") {
      console.error("Database has too many connections.");
    }
    if (err.code === "ECONNREFUSED") {
      console.error("Database connection was refused.");
    }
  }

  if (connection) connection.release();

  return;
});

pool.query = util.promisify(pool.query);

export default pool;

// const Query = async <T>(connection: mysql.Pool, query: string) =>
//   new Promise<T>((resolve, reject) => {
//     connection.getConnection(function (err, poolConection) {
//       if (err) reject(err);
//       poolConection.query(query, function (error, results) {
//         poolConection.release();
//         if (error) {
//           reject(error);
//         }
//         resolve(results);
//       });
//     });
//   });

// export { Connect, Query };
