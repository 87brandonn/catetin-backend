import { Op } from "sequelize";
import { NextFunction, Request, Response } from "express";
import { ICatetinItemCategory } from "../interfaces/itemCategory";
import models from "../models";

const { ItemCategory } = models;

const getItemCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const responseData = await ItemCategory.findAll({
      where: {
        [Op.or]: [
          {
            global: true,
          },
          {
            StoreId: id,
          },
        ],
      },
      order: [["name", "ASC"]],
    });
    res.status(200).send({
      data: responseData,
      message: "Succesfully insert item category",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to insert item category",
    });
  }
};

const insertItemCategoryGlobal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let data: ICatetinItemCategory[] = req.body;

  try {
    const responseData = await ItemCategory.bulkCreate(
      data.map((category) => ({ ...category, global: true, StoreId: null }))
    );
    res.status(200).send({
      data: responseData,
      message: "Succesfully insert item category",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to insert item category",
    });
  }
};

const insertItemCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  let { name, picture } = req.body;

  try {
    const responseData = await ItemCategory.create({
      name,
      picture,
      StoreId: id,
      global: false,
    });
    res.status(200).send({
      data: responseData,
      message: "Succesfully insert item category",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to insert item category",
    });
  }
};

export default {
  insertItemCategory,
  getItemCategory,
  insertItemCategoryGlobal,
};
