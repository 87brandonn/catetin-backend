import { groupBy } from ".";
import { default as model } from "../models";

const { Transaction, TransactionType } = model;

export const getTransactionReport = async (
  id: string | number,
  dateQuery: {
    transaction_date: any;
  }
) => {
  let data = await Transaction.findAll({
    where: {
      StoreId: id,
      deleted: false,
      ...dateQuery,
    },
    include: {
      model: TransactionType,
      where: {
        deleted: false,
      },
      through: {
        attributes: [],
      },
    },
  });
  data = JSON.parse(JSON.stringify(data))
    .filter((transaction: any) => !!transaction.TransactionTypes[0]?.name)
    .map((transaction: any) => ({
      ...transaction,
      TransactionTypes: transaction.TransactionTypes[0]?.name,
    }));
  let groupedRootType = {};
  Object.entries(groupBy(data, "rootType")).forEach(([key, value]: any) => {
    const groupedCategory = {};
    Object.entries(groupBy(value, "TransactionTypes")).forEach(
      ([typeKey, typeValue]: any) => {
        let sum = 0;
        typeValue.forEach((data: any) => (sum += data.nominal));
        Object.assign(groupedCategory, {
          [typeKey]: sum,
        });
      }
    );
    Object.assign(groupedRootType, {
      [key]: groupedCategory,
    });
  });
  return groupedRootType;
};
