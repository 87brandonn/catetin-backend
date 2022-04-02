import { NextFunction, Request, Response } from "express";
import pool from "../config/mysql";

const NAMESPACE = "Transaksi";
const insertTransaksi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { title, tipe_transaksi, tanggal, total, barang, notes } = req.body;

  let user_id = res.locals.jwt.user_id;
  let query = `INSERT INTO transaksi (user_id, nominal_transaksi, tanggal, title, tipe_transaksi, notes) VALUES (${user_id} ,${total}, "${tanggal}", "${title}", ${tipe_transaksi}, "${notes}")`;
  var transaksi_id = 1;
  try {
    var responseInsert = await pool.query(query);
    transaksi_id = responseInsert.insertId;
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
  console.log(tipe_transaksi == 3);
  if (tipe_transaksi == 3 || tipe_transaksi == 4) {
    console.log("test");
    barang.forEach(async (element: any) => {
      try {
        var queryDetail = `INSERT INTO transaksi_detail (transaksi_id, barang_id, amount) VALUES (${transaksi_id}, ${element.barang_id}, ${element.amount})`;
        const responseInsert = pool.query(queryDetail);
      } catch (error: any) {
        return res.status(500).json({
          message: error.message,
          error,
        });
      }
    });
    // update barang
    if (tipe_transaksi == 3) {
      barang.forEach(async (element: any) => {
        try {
          var queryUpdate = `UPDATE barang SET stok = stok + ${element.amount} WHERE barang_id = ${element.barang_id}`;

          var responseUpdate = pool.query(queryUpdate);
        } catch (error: any) {
          return res.status(500).json({
            message: error.message,
            error,
          });
        }
      });
    }
    if (tipe_transaksi == 4) {
      barang.forEach(async (element: any) => {
        try {
          var queryUpdate = `UPDATE barang SET stok = stok - ${element.amount} WHERE barang_id = ${element.barang_id}`;
          var responseUpdate = pool.query(queryUpdate);
        } catch (error: any) {
          return res.status(500).json({
            message: error.message,
            error,
          });
        }
      });
    }
  }
  return res.status(200).json({
    message: "success",
  });
};

const getTransaksi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let user_id = res.locals.jwt.user_id;
  var query = `SELECT * from transaksi WHERE user_id = ${user_id}`;
  let filter_tipe_transaksi = req.query.tipe_transaksi;

  if (filter_tipe_transaksi != undefined) {
    query = query.concat(` AND tipe_transaksi = ${filter_tipe_transaksi}`);
  }

  // sort tanggal ?
  // testing
  try {
    var result = await pool.query(query);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
  return res.status(200).json(result);
};

const updateTransaksi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { title, tipe_transaksi, tanggal, total, barang, notes, transaksi_id } =
    req.body;

  let user_id = res.locals.jwt.user_id;
  let query = `UPDATE transaksi SET title = "${title}", tipe_transaksi = ${tipe_transaksi}, tanggal = "${tanggal}", nominal_transaksi = ${total}, notes = "${notes}" WHERE transaksi_id = ${transaksi_id}`;
  try {
    var responseInsert = await pool.query(query);
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }

  if (tipe_transaksi == 3 || tipe_transaksi == 4) {
    barang.forEach(async (element: any) => {
      try {
        var queryDetail = `UPDATE transaksi_detail SET amount = ${element.new} WHERE barang_id = ${element.barang_id} AND transaksi_id = ${transaksi_id}`;

        const responseInsert = pool.query(queryDetail);
      } catch (error: any) {
        return res.status(500).json({
          message: error.message,
          error,
        });
      }
    });
    // update barang
    if (tipe_transaksi == 3) {
      barang.forEach(async (element: any) => {
        try {
          var queryUpdate = `UPDATE barang SET stok = stok + ${element.new} - ${element.old} WHERE barang_id = ${element.barang_id}`;

          var responseUpdate = pool.query(queryUpdate);
        } catch (error: any) {
          return res.status(500).json({
            message: error.message,
            error,
          });
        }
      });
    }
    if (tipe_transaksi == 4) {
      barang.forEach(async (element: any) => {
        try {
          var queryUpdate = `UPDATE barang SET stok = stok - ${element.new} + ${element.old} WHERE barang_id = ${element.barang_id}`;

          var responseUpdate = pool.query(queryUpdate);
        } catch (error: any) {
          return res.status(500).json({
            message: error.message,
            error,
          });
        }
      });
    }
  }
  return res.status(200).json({
    message: "success",
  });
};

// delete transaksi

export default { insertTransaksi, getTransaksi, updateTransaksi };
