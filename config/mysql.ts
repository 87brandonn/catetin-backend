import mysql from "mysql";
import config from "./config";

const params = {
  user: config.mysql.user,
  password: config.mysql.pass,
  host: config.mysql.host,
  database: config.mysql.database,
};

const Connect = () => mysql.createPool({ ...params, acquireTimeout: 6000000 });

const Query = async <T>(connection: mysql.Pool, query: string) =>
  new Promise<T>((resolve, reject) => {
    connection.getConnection(function (err, poolConection) {
      if (err) reject(err);
      poolConection.query(query, function (error, results) {
        poolConection.release();
        if (error) {
          reject(error);
        }
        resolve(results);
      });
    });
  });

export { Connect, Query };
