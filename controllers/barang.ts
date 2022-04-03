import { getOrderQuery } from "./../utils/index";
import { NextFunction, Request, Response } from "express";
import logging from "../config/logging";
import pool from "../config/mysql";
import IBarang from "../interfaces/barang";
import IMySQLResult from "../interfaces/result";

const NAMESPACE = "Barang";

const insertBarang = (req: Request, res: Response, next: NextFunction) => {
  let { nama_barang, harga, barang_picture } = req.body;

  let user_id = res.locals.jwt.user_id;
  let query = `INSERT INTO barang (user_id, nama_barang, stok, harga, barang_picture ) VALUES (${user_id} ,"${nama_barang}", 0 , ${harga}, "${barang_picture}")`;
  pool
    .query(query)
    .then((result: IMySQLResult) => {
      logging.info(NAMESPACE, `User with id ${result.insertId} inserted.`);
      return res.status(201).json(result);
    })
    .catch((error: any) => {
      logging.error(NAMESPACE, error.message, error);
      return res.status(500).json({
        message: error.message,
        error,
      });
    });
};

const updateBarang = (req: Request, res: Response, next: NextFunction) => {
  let { barang_id, nama_barang, harga, barang_picture } = req.body;

  let query = `UPDATE barang SET nama_barang = "${nama_barang}", harga = ${harga}, barang_picture = "${barang_picture}" WHERE barang_id = ${barang_id}`;

  pool
    .query(query)
    .then((result: IMySQLResult) => {
      return res.status(201).json(result);
    })
    .catch((error: any) => {
      logging.error(NAMESPACE, error.message, error);
      return res.status(500).json({
        message: error.message,
        error,
      });
    });
};
const getListBarang = (req: Request, res: Response, next: NextFunction) => {
  let user_id = res.locals.jwt.user_id;
  let query = `SELECT * FROM barang WHERE user_id = ${user_id}`;
  const { sort, nama_barang } = req.query;
  const orderQuery = getOrderQuery(sort as string);

  if (nama_barang) {
    query += ` AND nama_barang LIKE '%${nama_barang}%'`;
  }
  if (orderQuery !== "undefined") {
    query += ` ORDER BY ${orderQuery}`;
  }

  pool
    .query(query)
    .then((barang: IBarang[]) => {
      return res.status(200).json({
        barang,
        count: barang.length,
      });
    })
    .catch((error: any) => {
      logging.error(NAMESPACE, error.message, error);

      return res.status(500).json({
        message: error.message,
        error,
      });
    });
};

const getBarangDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { transaksi } = req.query;
  try {
    const queryBarang = `SELECT * FROM barang WHERE barang_id = ${id}`;
    let barangData: IBarang[] = await pool.query(queryBarang);
    if (transaksi) {
      barangData = await Promise.all(
        barangData.map(async (barang) => {
          const queryTransaksi = `SELECT * FROM transaksi INNER JOIN transaksi_detail td ON td.transaksi_id = transaksi.transaksi_id WHERE td.barang_id = ${barang.barang_id}`;
          return {
            ...barang,
            transaksi_data: await pool.query(queryTransaksi),
          };
        })
      );
    }
    res.status(200).send({
      data: barangData,
      message: "Succesfully get barang detail",
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
      err,
    });
  }
};

export default { insertBarang, updateBarang, getListBarang, getBarangDetail };
