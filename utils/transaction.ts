import { Op } from "sequelize";
import { default as model, default as db } from "../models";

const { Transaction, TransactionType, TransactionTransactionType } = model;

export const getTransactionReport = async (
  id: string | number,
  dateQuery: any
) => {
  const data = await TransactionType.findAll({
    where: {
      [Op.or]: [
        {
          global: true,
        },
        {
          StoreId: id,
        },
      ],
      deleted: false,
    },
    attributes: {
      include: [
        [
          db.sequelize.fn(
            "sum",
            db.sequelize.col("TransactionTransactionTypes.Transaction.nominal")
          ),
          "transactionSum",
        ],
      ],
    },
    include: {
      model: TransactionTransactionType,
      attributes: [],
      include: {
        model: Transaction,
        where: {
          deleted: false,
          ...dateQuery,
        },
        attributes: [],
      },
    },
    group: ["TransactionType.id"],
  });
  return data;
};
