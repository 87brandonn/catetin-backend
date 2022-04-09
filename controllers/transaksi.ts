import { NextFunction, Request, Response } from "express";
import { default as db, default as model } from "../models";

const { Transaction, ItemTransaction, Item } = model;

const insertTransaksi = async (req: Request, res: Response) => {
  let { title, tipe_transaksi, tanggal, total, notes } = req.body;
  let user_id = res.locals.jwt.user_id;

  try {
    const data = await Transaction.create({
      UserId: user_id,
      nominal: tipe_transaksi === 3 || tipe_transaksi === 4 ? 0 : total,
      transaction_date: tanggal,
      title,
      type: tipe_transaksi,
      notes,
    });
    res.send({
      data,
      message: "Succesfully insert transaction",
    });
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
};

const insertTransaksiDetail = async (req: Request, res: Response) => {
  const { transaksi_id, barang_id, amount } = req.body;
  const promises = [];

  const {
    dataValues: { type },
  } = await Transaction.findOne({
    where: {
      id: transaksi_id,
    },
  });

  try {
    if (type == 3 || type == 4) {
      const {
        dataValues: { price },
      } = await Item.findOne({
        where: {
          id: barang_id,
        },
      });

      promises.push(
        Transaction.update(
          {
            nominal: price * amount,
          },
          {
            where: {
              id: transaksi_id,
            },
          }
        )
      );

      promises.push(
        ItemTransaction.create({
          amount,
          ItemId: barang_id,
          TransactionId: transaksi_id,
        })
      );
      if (type == 3) {
        promises.push(
          Item.update(
            {
              stock: db.sequelize.literal(`stock - ${amount}`),
            },
            {
              where: {
                id: barang_id,
              },
            }
          )
        );
      }
      if (type == 4) {
        promises.push(
          Item.update(
            {
              stock: db.sequelize.literal(`stock + ${amount}`),
            },
            {
              where: {
                id: barang_id,
              },
            }
          )
        );
      }
      const data = await Promise.all(promises);
      return res.status(200).json({
        data,
        message: "Succesfully insert transaction detail",
      });
    } else {
      return res.status(500).send({
        message: "This type of transaction does not have detail",
      });
    }
  } catch (err: any) {
    return res.status(500).send({
      message: "Failed to input transaction detail",
      error: JSON.stringify(err),
    });
  }
};

const updateTransaksiDetail = async (req: Request, res: Response) => {
  const { transaksi_id, barang_id, amount } = req.body;
  const promises = [];

  const {
    dataValues: { type },
  } = await Transaction.findOne({
    where: {
      id: transaksi_id,
    },
  });

  try {
    if (type == 3 || type == 4) {
      promises.push(
        ItemTransaction.update(
          {
            amount,
          },
          {
            where: { ItemId: barang_id, TransactionId: transaksi_id },
          }
        )
      );
      if (type == 3) {
        const {
          dataValues: { amount: amountTransactionItem },
        } = await ItemTransaction.findOne({
          where: {
            ItemId: barang_id,
            TransactionId: transaksi_id,
          },
        });
        const value = amount - amountTransactionItem;
        const prefix = value > 0 ? "-" : "+";
        promises.push(
          Item.update(
            {
              stock: db.sequelize.literal(
                `stock ${prefix} ${Math.abs(value)} `
              ),
            },
            {
              where: {
                id: barang_id,
              },
            }
          )
        );
      }
      if (type == 4) {
        const {
          dataValues: { amount: amountTransactionItem },
        } = await ItemTransaction.findOne({
          where: {
            ItemId: barang_id,
            TransactionId: transaksi_id,
          },
        });
        const value = amount - amountTransactionItem;
        const prefix = value > 0 ? "+" : "-";
        promises.push(
          Item.update(
            {
              stock: db.sequelize.literal(
                `stock ${prefix} ${Math.abs(value)} `
              ),
            },
            {
              where: {
                id: barang_id,
              },
            }
          )
        );
      }
      const data = await Promise.all(promises);
      return res.status(200).json({
        data,
        message: "Succesfully update transaction detail",
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      message: "Failed to update transaction detail",
    });
  }
};

const getTransaksi = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let user_id = res.locals.jwt.user_id;
  const { tipe_transaksi } = req.query;

  const additional = {};

  if (tipe_transaksi) {
    Object.assign(additional, {
      type: tipe_transaksi,
    });
  }

  try {
    const data = await Transaction.findAll({
      where: {
        UserId: user_id,
        deleted: false,
        ...additional,
      },
      include: {
        model: Item,
      },
    });
    return res
      .status(200)
      .json({ data, message: "Succesfully get transaction" });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
};

const getTransaksiById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = await Transaction.findOne({
      where: {
        id,
      },
      include: {
        model: Item,
      },
    });
    return res
      .status(200)
      .send({ data, message: "Succesfully get transaction" });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
};

const updateTransaksi = async (req: Request, res: Response) => {
  let { title, tipe_transaksi, tanggal, total, notes, transaksi_id } = req.body;

  try {
    const data = await Transaction.update(
      {
        title,
        type: tipe_transaksi,
        transaction_date: tanggal,
        nominal: tipe_transaksi === 3 || tipe_transaksi === 4 ? 0 : total,
        notes,
      },
      {
        where: {
          id: transaksi_id,
        },
      }
    );
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
    // const [dataTransaksi, dataTransaksiDetail]: [
    //   ITransaksi,
    //   ITransaksiDetail[]
    // ] = await Promise.all([
    //   Transaction.findOne({
    //     where: {
    //       id,
    //     },
    //   }),
    //   ItemTransaction.findOne({
    //     where: {
    //       TransactionId: id,
    //     },
    //   }),
    // ]);

    // // Handle update barang stok
    // promises.push(
    //   Promise.all(
    //     dataTransaksiDetail.map((transaksiDetail) => {
    //       let action = "";
    //       if (dataTransaksi.type === 3) {
    //         action = "+";
    //       } else if (dataTransaksi.type === 4) {
    //         action = "-";
    //       }
    //       return Item.update(
    //         {
    //           stock: db.sequelize.literal(
    //             `stock ${action} ${transaksiDetail.amount} `
    //           ),
    //         },
    //         {
    //           where: {
    //             id: transaksiDetail.ItemId,
    //           },
    //         }
    //       );
    //     })
    //   )
    // );

    // // Handle delete transaksi detail
    // promises.push(
    //   ItemTransaction.update(
    //     {
    //       deleted: true,
    //     },
    //     {
    //       where: {
    //         TransactionId: id,
    //       },
    //     }
    //   )
    // );

    // Handle delete transaksi
    promises.push(
      Transaction.update(
        {
          deleted: true,
        },
        {
          where: {
            id,
          },
        }
      )
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

// const getTransaksiReport = async (req: Request, res: Response) => {
//   let user_id = res.locals.jwt.user_id;

//   try {
//     const queryTransaksi = `SELECT * FROM transaksi WHERE user_id = ${user_id}`;
//     const transaksiData: ITransaksi[] = await pool.query(queryTransaksi);
//     const transaksiDataWithDetail = await Promise.all(
//       transaksiData.map(async (transaksi) => {
//         const queryTransaksiDetail = `SELECT * FROM transaksi_detail td INNER JOIN barang b ON td.barang_id = b.barang_id WHERE td.transaksi_id = ${transaksi.id} `;
//         const transaksiDetailResult = await pool.query(queryTransaksiDetail);
//         return {
//           ...transaksi,
//           transaksi_detail: transaksiDetailResult,
//         };
//       })
//     );
//     res.status(200).send({
//       data: groupDataByDate(transaksiDataWithDetail),
//       message: "Succesfully get transaction report",
//     });
//   } catch (err: any) {
//     return res.status(500).json({
//       message: err.message,
//       err,
//     });
//   }
// };

export default {
  insertTransaksi,
  insertTransaksiDetail,
  updateTransaksiDetail,
  getTransaksi,
  getTransaksiById,
  updateTransaksi,
  deleteTransaksi,
  // getTransaksiReport,
};
