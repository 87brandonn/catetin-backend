import { Op } from "sequelize";
import { NextFunction, Request, Response } from "express";
import { ICatetinItemCategory } from "../interfaces/itemCategory";
import models from "../models";

const { TransactionType } = models;

const getTransactionType = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, type } = req.query;

  const additionalQuery = {};
  if (name) {
    Object.assign(additionalQuery, {
      name: {
        [Op.like]: `%${name}%`,
      },
    });
  }
  if (type) {
    Object.assign(additionalQuery, {
      rootType: type,
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
        deleted: false,
        ...additionalQuery,
      },
      order: [["name", "ASC"]],
    });
    res.status(200).send({
      data: responseData,
      message: "Succesfully get transaction type",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to get transaction type",
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
    const responseData = await Promise.all(
      data.map((category) =>
        TransactionType.create({
          ...category,
          global: true,
          StoreId: null,
        })
      )
    );
    res.status(200).send({
      data: responseData,
      message: "Succesfully insert transaction type",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Failed to insert transaction type",
    });
  }
};

const insertTransactionType = async (req: Request, res: Response) => {
  const { id: storeId } = req.params;
  let { id, name, picture, rootType } = req.body;

  try {
    const responseData = await TransactionType.upsert({
      id,
      name,
      picture,
      StoreId: storeId,
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

const deleteTransactionType = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const responseData = await TransactionType.update(
      {
        deleted: true,
      },
      {
        where: {
          id,
        },
      }
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

export default {
  insertTransactionType,
  getTransactionType,
  insertTransactionTypeGlobal,
  deleteTransactionType,
};
