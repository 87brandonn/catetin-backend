import { Op } from "sequelize";
import { NextFunction, Request, Response } from "express";
import { ICatetinItemCategory } from "../interfaces/itemCategory";
import models from "../models";

const { PaymentMethod } = models;

const getPaymentMethod = async (req: Request, res: Response) => {
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
    const responseData = await PaymentMethod.findAll({
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
      message: "Succesfully get payment method",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to get payment method",
    });
  }
};

const insertPaymentMethodGlobal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let data: ICatetinItemCategory[] = req.body;

  try {
    const responseData = await Promise.all(
      data.map((category) =>
        PaymentMethod.create({
          name: category.name,
          picture: category.picture,
          global: true,
          StoreId: null,
        })
      )
    );
    res.status(200).send({
      data: responseData,
      message: "Succesfully insert payment method",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to insert payment method",
    });
  }
};

const insertPaymentMethod = async (req: Request, res: Response) => {
  const { id : storeId } = req.params;
  let { name, picture, id } = req.body;

  try {
    const responseData = await PaymentMethod.upsert({
      id,
      name,
      picture,
      StoreId: storeId,
      global: false,
    });
    res.status(200).send({
      data: responseData,
      message: "Succesfully insert payment method",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to insert payment method",
    });
  }
};

const deletePaymentMethod = async (req: Request, res: Response) => {
    const { id } = req.params;
  
    try {
      const responseData = await PaymentMethod.update(
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
        message: "Succesfully delete transaction type",
      });
    } catch (err) {
      res.status(500).send({
        message: "Failed to delete transaction type",
      });
    }
  };

export default {
  insertPaymentMethod,
  getPaymentMethod,
  insertPaymentMethodGlobal,
  deletePaymentMethod
};
