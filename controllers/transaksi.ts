import { NextFunction, Request, Response } from "express";
import fs from "fs";
import handlebars from "handlebars";
import pdf from "html-pdf";
import moment from "moment-timezone";
import path from "path";
import { Op } from "sequelize";
import { format } from "util";
import { v1, v3 } from "uuid";
import { ICatetinStore } from "../interfaces/store";
import IUser from "../interfaces/user";
import { default as db, default as model } from "../models";
import transporter from "../nodemailer";
import { groupBy } from "../utils";
import { getTransactionReport } from "../utils/transaction";
import { ICatetinTransaksiDetail } from "./../interfaces/transaksi";
import { bucket } from "./media";

handlebars.registerHelper("toLocaleString", (number) => {
  return parseInt(number || "0", 10).toLocaleString("id-ID");
});

const {
  Transaction,
  ItemTransaction,
  Item,
  Store,
  User,
  TransactionTransactionType,
  TransactionType,
  TransactionPaymentMethod,
  PaymentMethod,
  UserStore,
} = model;

const insertTransaksi = async (req: Request, res: Response) => {
  let {
    title,
    tanggal,
    total,
    notes,
    transaksi_category,
    rootType,
    paymentMethod,
  } = req.body;

  let user_id = res.locals.jwt.user_id;

  const { id } = req.params;

  try {
    let data = await Transaction.create({
      StoreId: id,
      nominal: transaksi_category === 1 || transaksi_category === 2 ? 0 : total,
      rootType,
      transaction_date: tanggal,
      title,
      type: null,
      notes,
      UserId: user_id,
    });

    data = JSON.parse(JSON.stringify(data));

    const additionalPromise = [
      TransactionTransactionType.create({
        TransactionId: data.id,
        TransactionTypeId: transaksi_category,
      }),
    ];

    if (paymentMethod) {
      additionalPromise.push(
        TransactionPaymentMethod.create({
          TransactionId: data.id,
          PaymentMethodId: paymentMethod,
        })
      );
    }

    res.send({
      data,
      message: "Succesfully insert transactions",
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
  const { transaksi_id, barang = [] } = req.body;

  let transactionData = await TransactionTransactionType.findOne({
    where: {
      TransactionId: transaksi_id,
    },
  });

  transactionData = JSON.parse(JSON.stringify(transactionData));

  try {
    if (
      transactionData?.TransactionTypeId === 1 ||
      transactionData?.TransactionTypeId === 2
    ) {
      let bulkPromises = [];
      bulkPromises = await Promise.all(
        barang.map(async ({ id, notes, amount, price }: any) => {
          const promises = [];

          await ItemTransaction.create({
            amount,
            total: price * amount,
            price,
            ItemId: id,
            TransactionId: transaksi_id,
            notes,
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

          /**
           * Outcome transaction with barang
           */
          if (transactionData?.TransactionTypeId === 1) {
            promises.push(
              Item.update(
                {
                  stock: db.sequelize.literal(`stock - ${amount}`),
                },
                {
                  where: {
                    id,
                  },
                }
              )
            );
          } else if (transactionData?.TransactionTypeId === 2) {
            promises.push(
              Item.update(
                {
                  stock: db.sequelize.literal(`stock + ${amount}`),
                },
                {
                  where: {
                    id,
                  },
                }
              )
            );
          }
          return await Promise.all(promises);
        })
      );
      return res.send({
        data: bulkPromises,
        message: "Successfully insert transaction detail",
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
    let [barangData, transactionData] = await Promise.all([
      ItemTransaction.findOne({
        where: {
          ItemId: barang_id,
          TransactionId: transaksi_id,
        },
      }),
      TransactionTransactionType.findOne({
        where: {
          TransactionId: transaksi_id,
        },
      }),
    ]);

    transactionData = JSON.parse(JSON.stringify(transactionData));
    barangData = JSON.parse(JSON.stringify(barangData));

    if (
      !(
        transactionData?.TransactionTypeId === 1 ||
        transactionData?.TransactionTypeId === 2
      )
    ) {
      return res.status(400).send({
        message: "False transaction type",
      });
    }

    promises.push(
      Transaction.update(
        {
          nominal: db.sequelize.literal(`nominal - ${barangData.total} `),
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
            `stock ${transactionData?.TransactionTypeId === 2 ? "-" : "+"} ${
              barangData.amount
            }`
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
  const { transaksi_id, barang_id, amount, price, notes } = req.body;

  let transactionData = await TransactionTransactionType.findOne({
    where: {
      TransactionId: transaksi_id,
    },
  });

  transactionData = JSON.parse(JSON.stringify(transactionData));

  try {
    const promises = [];
    if (transactionData?.TransactionTypeId === 1) {
      const { amount: amountTransactionItem } = await ItemTransaction.findOne({
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
            stock: db.sequelize.literal(`stock ${prefix} ${Math.abs(value)} `),
          },
          {
            where: {
              id: barang_id,
            },
          }
        )
      );
    } else if (transactionData?.TransactionTypeId === 2) {
      const { amount: amountTransactionItem } = await ItemTransaction.findOne({
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
            stock: db.sequelize.literal(`stock ${prefix} ${Math.abs(value)} `),
          },
          {
            where: {
              id: barang_id,
            },
          }
        )
      );
    } else {
      return res.status(500).send({
        message: "This type of transaction does not have detail",
      });
    }
    await ItemTransaction.update(
      {
        amount,
        total: price * amount,
        price,
        notes,
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
  } catch (err) {
    console.log(err);
    return res.status(500).send({
      message: "Failed to update transaction detail",
    });
  }
};

const getTransaksi = async (req: Request, res: Response) => {
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
      rootType: {
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
      include: [
        {
          model: Item,
          ...includeQuery,
        },
        {
          model: TransactionTransactionType,
          include: {
            model: TransactionType,
          },
        },
        {
          model: TransactionPaymentMethod,
          include: {
            model: PaymentMethod,
          },
        },
        {
          model: User,
        },
      ],
      order: [["transaction_date", "DESC"]],
    });
    return res
      .status(200)
      .json({ data, message: "Succesfully get transaction" });
  } catch (error: any) {
    console.error(error, "Error get transaction");
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
      include: [
        {
          model: Item,
        },
        {
          model: TransactionTransactionType,
          include: {
            model: TransactionType,
          },
        },
        {
          model: TransactionPaymentMethod,
          include: {
            model: PaymentMethod,
          },
        },
        {
          model: User,
        },
      ],
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
  let {
    title,
    tanggal,
    total,
    notes,
    transaksi_id,
    transaksi_category,
    paymentMethod,
    transaksiPaymentMethodId,
  } = req.body;

  let user_id = res.locals.jwt.user_id;

  let transactionData = await Transaction.findOne({
    where: {
      id: transaksi_id,
    },
  });

  transactionData = JSON.parse(JSON.stringify(transactionData));

  if (!transactionData?.UserId === user_id) {
    return res.status(401).send({
      message: "Not authorized to edit this transaction",
    });
  }

  try {
    const updateTransaksiPromises = [
      Transaction.update(
        {
          title,
          transaction_date: tanggal,
          nominal:
            transaksi_category === 1 || transaksi_category === 2
              ? undefined
              : total,
          notes,
        },
        {
          where: {
            id: transaksi_id,
          },
          returning: true,
        }
      ),
    ];

    if (paymentMethod) {
      updateTransaksiPromises.push(
        TransactionPaymentMethod.upsert({
          id: transaksiPaymentMethodId,
          TransactionId: transaksi_id,
          PaymentMethodId: paymentMethod,
        })
      );
    } else {
      updateTransaksiPromises.push(
        TransactionPaymentMethod.destroy({
          where: {
            TransactionId: transaksi_id,
          },
        })
      );
    }

    const data = await Promise.all(updateTransaksiPromises);

    return res.status(200).json({
      data: data[0],
      message: "success",
    });
  } catch (error: any) {
    console.error(error, "Error update");
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

    let transactionData = await Transaction.findOne({
      where: {
        id,
      },
      include: [
        {
          model: ItemTransaction,
        },
        {
          model: TransactionTransactionType,
        },
      ],
    });

    if (!transactionData) {
      return res.status(400).send({
        message: "Transaction with this id is not exist",
      });
    }

    transactionData = JSON.parse(JSON.stringify(transactionData));

    if (
      transactionData.TransactionTransactionType?.TransactionTypeId === 1 ||
      transactionData.TransactionTransactionType?.TransactionTypeId === 2
    ) {
      const transactionDataItemsPromises = transactionData.ItemTransactions.map(
        (it: ICatetinTransaksiDetail) =>
          Item.update(
            {
              stock: db.sequelize.literal(
                `stock ${
                  transactionData.TransactionTransactionType
                    ?.TransactionTypeId === 1
                    ? "+"
                    : "-"
                } ${Math.abs(it.amount)} `
              ),
            },
            {
              where: {
                id: it.ItemId,
              },
            }
          )
      );
      promises.push(...transactionDataItemsPromises);
    }

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
    console.error(err);
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
    report,
    start_date,
    end_date,
    timezone = "Asia/Jakarta",
    paymentMethod,
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
        where: {
          StoreId: id,
          deleted: false,
        },
        attributes: {
          include: [
            [
              db.sequelize.literal(`(
                  SELECT coalesce(SUM(total), 0)
                  FROM (SELECT * FROM "ItemTransactions" INNER JOIN "Transactions" ON "Transactions"."id" = "ItemTransactions"."TransactionId") AS "iwt"
                  WHERE
                    "iwt"."ItemId" = "Item"."id" AND 
                    "iwt"."rootType" = 'income' AND 
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
      let no_transaction = true;
      let data = await Item.findAll({
        where: {
          StoreId: id,
          deleted: false,
        },
        attributes: {
          include: [
            [
              db.sequelize.literal(`(
                  SELECT coalesce(SUM(amount), 0)
                  FROM (SELECT * FROM "ItemTransactions" INNER JOIN "Transactions" ON "Transactions"."id" = "ItemTransactions"."TransactionId") AS "iwt"
                  WHERE
                    "iwt"."ItemId" = "Item"."id" AND 
                    "iwt"."deleted" = false AND
                    "iwt"."rootType" = 'income' ${dateQueryAsString}
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
        order: [[db.sequelize.col("date"), "ASC"]],
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
    } else if (report) {
      finalData = await getTransactionReport(id, dateQuery);
    } else if (paymentMethod) {
      const data = await PaymentMethod.findAll({
        attributes: {
          include: [
            [
              db.sequelize.fn(
                "COUNT",
                db.sequelize.col("TransactionPaymentMethods.id")
              ),
              "paymentCount",
            ],
          ],
        },
        include: {
          model: TransactionPaymentMethod,
          attributes: [],
        },
        group: ["PaymentMethod.id"],
      });
      finalData = data;
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

const downloadManualReport = async (req: Request, res: Response) => {
  const { start_date, end_date, store_id } = req.body;

  let user_id = res.locals.jwt.user_id;

  try {
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

    let [transaction, income, outcome, userStoreData]: [
      transaction: any,
      income: number | undefined,
      outcome: number | undefined,
      userStoreData: {
        grant: "owner" | "employee";
        UserId: number;
        StoreId: number;
      } & {
        User: IUser;
        Store: ICatetinStore;
      }
    ] = await Promise.all([
      getTransactionReport(store_id, {
        transaction_date: query.transaction_date,
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
      UserStore.findOne({
        where: {
          StoreId: store_id,
          UserId: user_id,
        },
        include: [
          {
            model: User,
          },
          {
            model: Store,
          },
        ],
      }),
    ]);

    transaction = JSON.parse(JSON.stringify(transaction));
    income = JSON.parse(JSON.stringify(income));
    outcome = JSON.parse(JSON.stringify(outcome));
    userStoreData = JSON.parse(JSON.stringify(userStoreData));

    const impression = {
      value: Number(Math.abs((income || 0) - (outcome || 0))).toLocaleString(
        "id-ID"
      ),
      profit: (income || 0) > (outcome || 0) ? true : false,
    };

    const data = {
      storeName: userStoreData?.Store?.name || "Catetin Toko",
      from: moment(from).locale("id").tz("Asia/Jakarta").format("DD MMMM YYYY"),
      to: moment(to).locale("id").tz("Asia/Jakarta").format("DD MMMM YYYY"),
      incomeReport: transaction?.filter(
        (data: any) => data.rootType === "income"
      ),
      outcomeReport: transaction?.filter(
        (data: any) => data.rootType === "outcome"
      ),
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
        const fileName = `financial-report/LaporanKeuangan-${v1()}-${
          data.storeName
        }-${data.from}-${data.to}.pdf`;
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
          to: userStoreData?.User?.email,
          subject: "Laporan Keuangan Manual",
          html: `Hi, ${userStoreData?.User?.email}. Berikut adalah laporan keuangan kamu untuk periode ${data.from} s/d ${data.to}. Terimakasih telah menggunakan Catetin!`,
          attachments: [
            {
              filename: fileName.replace("financial-report/", ""),
              path: publicUrl,
            },
          ],
        });
        return res.status(200).send({
          message: `Manual financial report has been sent succesfully to email ${userStoreData?.User?.email} `,
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
  downloadManualReport,
  deleteTransaksi,
  deleteTransaksiDetail,
  getTransactionSummary,
};
