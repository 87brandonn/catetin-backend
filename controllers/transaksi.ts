import { NextFunction, Request, Response } from "express";
import moment from "moment";
import { Op } from "sequelize";
import { default as db, default as model } from "../models";
import { groupBy } from "./../utils/index";

const { Transaction, ItemTransaction, Item } = model;

const insertTransaksi = async (req: Request, res: Response) => {
  let { title, tipe_transaksi, tanggal, total, notes } = req.body;
  let user_id = res.locals.jwt.user_id;

  try {
    const data = await Transaction.create({
      UserId: user_id,
      nominal: tipe_transaksi === 3 || tipe_transaksi === 4 ? 0 : total,
      transaction_date: tanggal,
      rootType:
        tipe_transaksi === 3 || tipe_transaksi === 2 ? "income" : "outcome",
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

      await ItemTransaction.create({
        amount,
        total: price * amount,
        ItemId: barang_id,
        TransactionId: transaksi_id,
      });

      const sumTotal = await ItemTransaction.sum("total", {
        where: {
          TransactionId: transaksi_id,
        },
      });

      promises.push(
        Transaction.update(
          {
            nominal: sumTotal,
          },
          {
            where: {
              id: transaksi_id,
            },
          }
        )
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
      const {
        dataValues: { price },
      } = await Item.findOne({
        where: {
          id: barang_id,
        },
      });
      await ItemTransaction.update(
        {
          amount,
          total: price * amount,
        },
        {
          where: { ItemId: barang_id, TransactionId: transaksi_id },
        }
      );
      const sumTotal = await ItemTransaction.sum("total", {
        where: {
          TransactionId: transaksi_id,
        },
      });

      promises.push(
        Transaction.update(
          {
            nominal: sumTotal,
          },
          {
            where: {
              id: transaksi_id,
            },
          }
        )
      );
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
      order: [["updatedAt", "DESC"]],
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
        nominal:
          tipe_transaksi === 3 || tipe_transaksi === 4 ? undefined : total,
        notes,
      },
      {
        where: {
          id: transaksi_id,
        },
        returning: true,
      }
    );
    return res.status(200).json({
      data: data[1],
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

const getTransactionSummary = async (req: Request, res: Response) => {
  let user_id = res.locals.jwt.user_id;
  const {
    total_income,
    total_outcome,
    impression,
    frequent_item,
    best_item,
    max_outcome,
    max_income,
    graph,
    start_date,
    end_date,
  } = req.query;

  let dateQuery = {};
  let dateQueryAsString = "";

  if (start_date && end_date) {
    Object.assign(dateQuery, {
      transaction_date: {
        [Op.between]: [
          moment(start_date as string).toDate(),
          moment(end_date as string).toDate(),
        ],
      },
    });
    dateQueryAsString += `AND 
    "iwt"."transaction_date" BETWEEN '${moment(start_date as string).format(
      "YYYY-MM-DD"
    )}' AND '${moment(end_date as string).format("YYYY-MM-DD")}'`;
  }

  let totalIOQuery = {};
  if (total_income) {
    Object.assign(totalIOQuery, {
      rootType: "income",
      ...dateQuery,
    });
  } else if (total_outcome) {
    Object.assign(totalIOQuery, {
      rootType: "outcome",
      ...dateQuery,
    });
  }

  try {
    let finalData;
    if (impression) {
      const income = await Transaction.sum("nominal", {
        where: {
          UserId: user_id,
          deleted: false,
          rootType: "income",
          ...dateQuery,
        },
      });
      const outcome = await Transaction.sum("nominal", {
        where: {
          UserId: user_id,
          deleted: false,
          rootType: "outcome",
          ...dateQuery,
        },
      });
      finalData = {
        value: Math.abs(income - outcome),
        profit: income - outcome > 0,
      };
    } else if (best_item) {
      let no_transaction = true;
      let data = await Item.findAll({
        attributes: {
          include: [
            [
              db.sequelize.literal(`(
                  SELECT coalesce(SUM(total), 0)
                  FROM (SELECT * FROM "ItemTransactions" INNER JOIN "Transactions" ON "Transactions"."id" = "ItemTransactions"."TransactionId") AS "iwt"
                  WHERE
                    "iwt"."ItemId" = "Item"."id" AND 
                    "iwt"."type" = '3' AND 
                    "iwt"."deleted" = false
                    ${dateQueryAsString} 
              )`),
              "total_nominal_transactions",
            ],
          ],
        },
        order: [[db.sequelize.col("total_nominal_transactions"), "DESC"]],
        limit: 3,
      });
      data.forEach(({ dataValues }: any) => {
        if (dataValues.total_nominal_transactions !== "0") {
          no_transaction = false;
          return;
        }
      });
      finalData = no_transaction ? null : data;
    } else if (frequent_item) {
      let data = await Item.findAll({
        attributes: {
          include: [
            [
              db.sequelize.literal(`(
                  SELECT coalesce(SUM(amount), 0)
                  FROM (SELECT * FROM "ItemTransactions" INNER JOIN "Transactions" ON "Transactions"."id" = "ItemTransactions"."TransactionId") AS "iwt"
                  WHERE
                    "iwt"."ItemId" = "Item"."id" AND 
                    "iwt"."deleted" = false AND
                    "iwt"."type" = '3' ${dateQueryAsString}
              )`),
              "total_amount_transactions",
            ],
          ],
        },
        order: [[db.sequelize.col("total_amount_transactions"), "DESC"]],
        limit: 3,
      });
      finalData = data;
    } else if (max_income) {
      const data = await Transaction.findAll({
        where: {
          UserId: user_id,
          rootType: "income",
          deleted: false,
          ...dateQuery,
        },
        order: [["nominal", "DESC"]],
        limit: 3,
        include: [
          {
            model: Item,
          },
        ],
      });
      finalData = data;
    } else if (max_outcome) {
      const data = await Transaction.findAll({
        where: {
          UserId: user_id,
          rootType: "outcome",
          deleted: false,
          ...dateQuery,
        },
        order: [["nominal", "DESC"]],
        limit: 3,
        include: [
          {
            model: Item,
          },
        ],
      });
      finalData = data;
    } else if (graph) {
      let data = await Transaction.findAll({
        where: {
          UserId: user_id,
          deleted: false,
          ...dateQuery,
        },
        attributes: [
          [db.sequelize.literal(`DATE("transaction_date")`), "date"],
          [db.sequelize.fn(`sum`, db.sequelize.col("nominal")), "sum_nominal"],
          "rootType",
        ],
        group: ["date", "rootType"],
      });
      let grouped = {};
      const groups = ["date", "rootType"];
      data.forEach(({ dataValues: a }: any) => {
        groups
          .reduce(function (o: any, g: any, i: any) {
            o[a[g]] = o[a[g]] || (i + 1 === groups.length ? [] : {});
            return o[a[g]];
          }, grouped)
          .push(a);
      });
      grouped = Object.entries(grouped).map(([key, value]) => ({
        date: key,
        data: value,
      }));
      finalData = grouped;
    } else {
      const data = await Transaction.sum("nominal", {
        where: {
          UserId: user_id,
          deleted: false,
          ...totalIOQuery,
        },
      });
      finalData = data || 0;
    }
    res.send({
      data: finalData,
      message: "Succesfully get summary transaction",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: "Failed to get summary",
      err: JSON.stringify(err),
    });
  }
};

export default {
  insertTransaksi,
  insertTransaksiDetail,
  updateTransaksiDetail,
  getTransaksi,
  getTransaksiById,
  updateTransaksi,
  deleteTransaksi,
  getTransactionSummary,
  // getTransaksiReport,
};
