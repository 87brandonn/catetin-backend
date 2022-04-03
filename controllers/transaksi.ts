import { NextFunction, Request, Response } from "express";
import pool from "../config/mysql";
import { IBarangPayload } from "../interfaces/barang";
import ITransaksi, {
  ITransaksiDetail,
  ITransaksiWithDetail,
} from "../interfaces/transaksi";
import { generateEditQuery, serializePayloadtoQuery } from "../utils";

const insertTransaksi = async (req: Request, res: Response) => {
  let { title, tipe_transaksi, tanggal, total, barang, notes } = req.body;
  let user_id = res.locals.jwt.user_id;
  let query = `INSERT INTO transaksi (user_id, nominal_transaksi, tanggal, title, tipe_transaksi, notes) VALUES (${user_id} ,${total}, "${tanggal}", "${title}", ${tipe_transaksi}, "${notes}")`;

  try {
    const responseInsert = await pool.query(query);
    const transaksi_id = responseInsert.insertId;
    const promises = [];

    if (tipe_transaksi == 3 || tipe_transaksi == 4) {
      promises.push(
        Promise.all(
          barang.map(async (element: IBarangPayload) => {
            var queryDetail = `INSERT INTO transaksi_detail (transaksi_id, barang_id, amount) VALUES (${transaksi_id}, ${element.barang_id}, ${element.amount})`;
            return pool.query(queryDetail);
          })
        )
      );
      if (tipe_transaksi == 3) {
        promises.push(
          Promise.all(
            barang.map(async (element: IBarangPayload) => {
              var queryUpdate = `UPDATE barang SET stok = stok - ${element.amount} WHERE barang_id = ${element.barang_id}`;
              return pool.query(queryUpdate);
            })
          )
        );
      }
      if (tipe_transaksi == 4) {
        promises.push(
          Promise.all(
            barang.map(async (element: IBarangPayload) => {
              var queryUpdate = `UPDATE barang SET stok = stok + ${element.amount} WHERE barang_id = ${element.barang_id}`;
              return pool.query(queryUpdate);
            })
          )
        );
      }
      const data = await Promise.all(promises);
      return res.status(200).json({
        data,
        message: "Succesfully insert transaction",
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
};

const getTransaksi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let user_id = res.locals.jwt.user_id;
  let query = `SELECT * from transaksi WHERE user_id = ${user_id}`;
  let filter_tipe_transaksi = req.query.tipe_transaksi;

  if (filter_tipe_transaksi != undefined) {
    query = query.concat(` AND tipe_transaksi = ${filter_tipe_transaksi}`);
  }

  let transaksiData: ITransaksi[] = [];
  let transaksiDataWithDetail: ITransaksiWithDetail[] = [];

  try {
    transaksiData = await pool.query(query);
    transaksiDataWithDetail = await Promise.all(
      transaksiData.map(async (transaksi) => {
        const queryTransaksiDetail = `SELECT * FROM transaksi_detail td INNER JOIN barang b ON td.barang_id = b.barang_id WHERE td.transaksi_id = ${transaksi.transaksi_id} `;
        const transaksiDetailResult = await pool.query(queryTransaksiDetail);
        return {
          ...transaksi,
          transaksi_detail: transaksiDetailResult,
        };
      })
    );
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
  return res.status(200).json(transaksiDataWithDetail);
};

const updateTransaksi = async (req: Request, res: Response) => {
  let { title, tipe_transaksi, tanggal, total, barang, notes, transaksi_id } =
    req.body;
  const promises = [];
  const query = generateEditQuery(
    "transaksi",
    serializePayloadtoQuery({
      title,
      tipe_transaksi,
      tanggal,
      nominal_transaksi: total,
      notes,
    }),
    serializePayloadtoQuery(
      {
        transaksi_id,
      },
      true
    )
  );

  try {
    promises.push(pool.query(query));
    if (tipe_transaksi === 3 || tipe_transaksi === 4) {
      promises.push(
        Promise.all(
          barang.map(async (element: IBarangPayload) => {
            const queryDetail = generateEditQuery(
              "transaksi_detail",
              serializePayloadtoQuery({
                amount: element.amount,
              }),
              serializePayloadtoQuery(
                {
                  barang_id: element.barang_id,
                  transaksi_id,
                },
                true
              )
            );
            return pool.query(queryDetail);
          })
        )
      );
      if (tipe_transaksi === 3) {
        promises.push(
          Promise.all(
            barang.map(async (element: IBarangPayload) => {
              const data: ITransaksiDetail[] = await pool.query(
                `SELECT amount FROM transaksi_detail WHERE barang_id = ${element.barang_id} AND transaksi_id = ${transaksi_id}`
              );
              const value = element.amount - data[0].amount;
              const prefix = value > 0 ? "-" : "+";
              const queryUpdate = `UPDATE barang SET stok = stok ${prefix} ${Math.abs(
                value
              )} WHERE barang_id = ${element.barang_id}`;
              return pool.query(queryUpdate);
            })
          )
        );
      }
      if (tipe_transaksi === 4) {
        promises.push(
          Promise.all(
            barang.map(async (element: IBarangPayload) => {
              const data: ITransaksiDetail[] = await pool.query(
                `SELECT amount FROM transaksi_detail WHERE barang_id = ${element.barang_id} AND transaksi_id = ${transaksi_id}`
              );
              const value = element.amount - data[0].amount;
              const prefix = value > 0 ? "+" : "-";
              var queryUpdate = `UPDATE barang SET stok = stok ${prefix} ${Math.abs(
                value
              )} WHERE barang_id = ${element.barang_id}`;
              return pool.query(queryUpdate);
            })
          )
        );
      }
    }
    const data = await Promise.all(promises);
    return res.status(200).json({
      data,
      message: "success",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
};

const deleteTransaksi = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const promises = [];
    const queryTransaksiDetail = `SELECT * FROM transaksi_detail WHERE transaksi_id = ${id} `;
    const queryTransaksi = `SELECT * FROM transaksi WHERE transaksi_id = ${id}`;
    const [dataTransaksi, dataTransaksiDetail]: [
      ITransaksi[],
      ITransaksiDetail[]
    ] = await Promise.all([
      pool.query(queryTransaksi),
      pool.query(queryTransaksiDetail),
    ]);

    // Handle update barang stok
    promises.push(
      Promise.all(
        dataTransaksiDetail.map((transaksiDetail) => {
          let action = "";
          if (dataTransaksi[0].tipe_transaksi === 3) {
            action = "+";
          } else if (dataTransaksi[0].tipe_transaksi === 4) {
            action = "-";
          }
          const queryBarang = `UPDATE barang SET stok = stok ${action} ${transaksiDetail.amount} WHERE barang_id = ${transaksiDetail.barang_id}`;
          return pool.query(queryBarang);
        })
      )
    );

    // Handle delete transaksi detail
    promises.push(
      pool.query(`DELETE FROM transaksi_detail WHERE transaksi_id = ${id} `)
    );

    // Handle delete transaksi
    promises.push(
      pool.query(`DELETE FROM transaksi WHERE transaksi_id = ${id}`)
    );

    const data = await Promise.all(promises);
    res.status(200).send({
      data,
      message: "Succesfully delete transaksi",
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
      err,
    });
  }
};

export default {
  insertTransaksi,
  getTransaksi,
  updateTransaksi,
  deleteTransaksi,
};
