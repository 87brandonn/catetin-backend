import { NextFunction, Request, Response } from "express";
import handlebars from "handlebars";
import fs from "fs";
import pdf from "html-pdf";
import moment from "moment-timezone";
import { format } from "util";
import path from "path";
import { Op } from "sequelize";
import { default as db, default as model } from "../models";
import { bucket } from "./media";
import transporter, { mailData } from "../nodemailer";

const { Transaction, ItemTransaction, Item, Store, User } = model;

const insertTransaksi = async (req: Request, res: Response) => {
  let { title, tipe_transaksi, tanggal, total, notes } = req.body;

  const { id } = req.params;

  try {
    const data = await Transaction.create({
      StoreId: id,
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

const deleteTransaksiDetail = async (req: Request, res: Response) => {
  const { transaksi_id, barang_id } = req.body;
  const promises = [];

  try {
    const data = JSON.parse(
      JSON.stringify(
        await ItemTransaction.findOne({
          where: {
            ItemId: barang_id,
            TransactionId: transaksi_id,
          },
          include: {
            model: Transaction,
          },
        })
      )
    );
    promises.push(
      Transaction.update(
        {
          nominal: db.sequelize.literal(`nominal - ${data.total} `),
        },
        {
          where: {
            id: transaksi_id,
          },
        }
      )
    );
    promises.push(
      Item.update(
        {
          stock: db.sequelize.literal(
            `stock ${data.Transaction.type === "4" ? "-" : "+"} ${data.amount}`
          ),
        },
        {
          where: {
            id: barang_id,
          },
        }
      )
    );
    promises.push(
      ItemTransaction.destroy({
        where: {
          ItemId: barang_id,
          TransactionId: transaksi_id,
        },
      })
    );
    const dataResult = await Promise.all(promises);
    res.send({
      data: dataResult,
      message: "Succesfully delete transaksi detail",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to delete transaction detail",
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
  const { id } = req.params;
  const { search, items, nominal, start_date, end_date, type } = req.query;

  const additional = {};
  const includeQuery = {};

  if (search) {
    Object.assign(additional, {
      [Op.or]: [
        {
          title: {
            [Op.like]: `%${search}%`,
          },
        },
        {
          notes: {
            [Op.like]: `%${search}%`,
          },
        },
      ],
    });
  }
  if (items) {
    Object.assign(additional, {
      "$Items.id$": {
        [Op.in]: items,
      },
    });
    Object.assign(includeQuery, {
      required: true,
    });
  }
  if (nominal) {
    Object.assign(additional, {
      nominal: {
        [Op.between]: nominal,
      },
    });
  }
  if (start_date || end_date) {
    Object.assign(additional, {
      transaction_date: {
        [Op.between]: [
          moment(start_date as string)
            .startOf("day")
            .toDate(),
          end_date
            ? moment(end_date as string)
                .endOf("day")
                .toDate()
            : moment(start_date as string)
                .endOf("day")
                .toDate(),
        ],
      },
    });
  }
  if (type) {
    Object.assign(additional, {
      type: {
        [Op.in]: type,
      },
    });
  }

  try {
    const data = await Transaction.findAll({
      where: {
        StoreId: id,
        deleted: false,
        ...additional,
      },
      include: {
        model: Item,
        ...includeQuery,
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
  const { id } = req.params;
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
    timezone = "Asia/Jakarta",
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
      "YYYY-MM-DD HH:mm:ss"
    )}' AND '${moment(end_date as string).format("YYYY-MM-DD HH:mm:ss")}'`;
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
      const income =
        (await Transaction.sum("nominal", {
          where: {
            StoreId: id,
            deleted: false,
            rootType: "income",
            ...dateQuery,
          },
        })) || 0;
      const outcome =
        (await Transaction.sum("nominal", {
          where: {
            StoreId: id,
            deleted: false,
            rootType: "outcome",
            ...dateQuery,
          },
        })) || 0;
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
                    "iwt"."deleted" = false AND 
                    "iwt"."StoreId" = ${id}
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
      let no_transaction = true;
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
                    "iwt"."StoreId" = ${id} AND
                    "iwt"."type" = '3' ${dateQueryAsString}
              )`),
              "total_amount_transactions",
            ],
          ],
        },
        order: [[db.sequelize.col("total_amount_transactions"), "DESC"]],
        limit: 3,
      });

      data.forEach(({ dataValues }: any) => {
        if (dataValues.total_amount_transactions !== "0") {
          no_transaction = false;
          return;
        }
      });

      finalData = no_transaction ? null : data;
    } else if (max_income) {
      const data = await Transaction.findAll({
        where: {
          StoreId: id,
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
          StoreId: id,
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
          StoreId: id,
          deleted: false,
          ...dateQuery,
        },
        attributes: [
          [
            db.sequelize.literal(
              `DATE(timezone('${timezone}',"transaction_date"))`
            ),
            "date",
          ],
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
      const mapGrouped = Object.entries(grouped).map(([key, value]) => ({
        date: key,
        data: value,
      }));
      finalData = (mapGrouped.length > 0 && mapGrouped) || null;
    } else {
      const data = await Transaction.sum("nominal", {
        where: {
          StoreId: id,
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

const downloadManualTransactions = async (req: Request, res: Response) => {
  const { start_date, end_date, store_id } = req.body;
  try {
    const storeData = JSON.parse(
      JSON.stringify(
        await Store.findOne({
          where: {
            id: store_id,
          },
          include: [
            {
              model: User,
            },
          ],
        })
      )
    );
    const from = moment(start_date).toISOString();
    const to = moment(end_date).toISOString();
    const query = {
      StoreId: store_id,
      transaction_date: {
        [Op.between]: [
          moment(from as string).toDate(),
          moment(to as string).toDate(),
        ],
      },
      deleted: false,
    };

    let [transaction, income, outcome]: [
      transaction: { type: string; total_amount: string }[],
      income: number | undefined,
      outcome: number | undefined
    ] = await Promise.all([
      Transaction.findAll({
        where: {
          ...query,
        },
        attributes: [
          "type",
          [db.sequelize.fn("sum", db.sequelize.col("nominal")), "total_amount"],
        ],
        group: ["type"],
      }),
      Transaction.sum("nominal", {
        where: {
          rootType: "income",
          ...query,
        },
      }),
      Transaction.sum("nominal", {
        where: {
          rootType: "outcome",
          ...query,
        },
      }),
    ]);

    transaction = JSON.parse(JSON.stringify(transaction));
    income = JSON.parse(JSON.stringify(income));
    outcome = JSON.parse(JSON.stringify(outcome));

    const impression = {
      value: Number(Math.abs((income || 0) - (outcome || 0))).toLocaleString(
        "id-ID"
      ),
      profit: (income || 0) > (outcome || 0) ? true : false,
    };

    const data = {
      storeName: storeData.name || "Catetin Toko",
      from: moment(from).locale("id").tz("Asia/Jakarta").format("DD MMMM YYYY"),
      to: moment(to).locale("id").tz("Asia/Jakarta").format("DD MMMM YYYY"),
      item_export: Number(
        transaction?.find((eachTransaction) => eachTransaction.type === "3")
          ?.total_amount || 0
      )?.toLocaleString("id-ID"),
      additional_income: Number(
        transaction?.find((eachTransaction) => eachTransaction.type === "2")
          ?.total_amount || 0
      )?.toLocaleString("id-ID"),
      item_import: Number(
        transaction?.find((eachTransaction) => eachTransaction.type === "4")
          ?.total_amount || 0
      )?.toLocaleString("id-ID"),
      additional_outcome: Number(
        transaction?.find((eachTransaction) => eachTransaction.type === "1")
          ?.total_amount || 0
      )?.toLocaleString("id-ID"),
      income: Number(income || 0).toLocaleString("id-ID"),
      outcome: Number(outcome || 0).toLocaleString("id-ID"),
      impression,
    };

    const __dirname = path.resolve();
    const filePath = path.join(__dirname, "/template/financial-report.html");
    const source = fs.readFileSync(filePath, "utf-8");
    const template = handlebars.compile(source);
    const html = template(data);

    pdf
      .create(html, {
        format: "A4",
      })
      .toBuffer(async (err: any, buffer: any) => {
        if (err) {
          return res.status(500).send({
            message: "An error occured while generating PDF buffer",
          });
        }
        const fileName = `financial-report/LaporanKeuangan${store_id}-${data.storeName}-${data.from}-${data.to}.pdf`;
        const file = bucket.file(fileName);

        await file.save(buffer, {
          contentType: "application/pdf",
        });
        await file.makePublic();

        const publicUrl = format(
          `https://storage.googleapis.com/${bucket.name}/${fileName}`
        );

        await transporter.sendMail({
          from: "brandonpardede25@gmail.com",
          to: storeData.User.email,
          subject: "Laporan Keuangan Manual",
          html: `Hi, ${storeData.User.email}. Berikut adalah laporan keuangan kamu untuk periode ${data.from} s/d ${data.to}. Terimakasih telah menggunakan Catetin!`,
          attachments: [
            {
              filename: fileName.replace("financial-report/", ""),
              path: publicUrl,
            },
          ],
        });
        return res.status(200).send({
          message: `Manual financial report has been sent succesfully to email ${storeData.User.email} `,
        });
      });
  } catch (err) {
    console.error(
      "An error occured while generating manual financial report",
      err
    );
    res.status(500).send({
      message: "Internal error occured. Failed to download manual transactions",
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
  downloadManualTransactions,
  deleteTransaksi,
  deleteTransaksiDetail,
  getTransactionSummary,
};
