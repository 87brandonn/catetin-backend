import { Op } from "sequelize";
import { NextFunction, Request, Response } from "express";
import { ICatetinItemCategory } from "../interfaces/itemCategory";
import models from "../models";

const { TransactionType } = models;

const getTransactionType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.query;

  const additionalQuery = {};
  if (name) {
    Object.assign(additionalQuery, {
      name: {
        [Op.like]: `%${name}%`,
      },
    });
  }
  try {
    const responseData = await TransactionType.findAll({
      where: {
        [Op.or]: [
          {
            global: true,
          },
          {
            StoreId: id,
          },
        ],
        ...additionalQuery,
      },
      order: [["name", "ASC"]],
    });
    res.status(200).send({
      data: responseData,
      message: "Succesfully insert transaction type",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to insert transaction type",
    });
  }
};

const insertTransactionTypeGlobal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let data: ICatetinItemCategory[] = req.body;

  try {
    const responseData = await TransactionType.bulkCreate(
      data.map((category) => ({ ...category, global: true, StoreId: null }))
    );
    res.status(200).send({
      data: responseData,
      message: "Succesfully insert transaction type",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to insert transaction type",
    });
  }
};

const insertTransactionType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  let { name, picture, rootType } = req.body;

  try {
    const responseData = await TransactionType.create({
      name,
      picture,
      StoreId: id,
      global: false,
      rootType,
    });
    res.status(200).send({
      data: responseData,
      message: "Succesfully insert transaction type",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to insert transaction type",
    });
  }
};

export default {
  insertTransactionType,
  getTransactionType,
  insertTransactionTypeGlobal,
};
