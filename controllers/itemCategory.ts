import { NextFunction, Request, Response } from "express";
import models from "../models";

const { ItemCategory } = models;

const getItemCategory = async (req: Request, res: Response) => {
  try {
    const responseData = await ItemCategory.findAll({
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

const insertItemCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let data = req.body;

  try {
    const responseData = await ItemCategory.bulkCreate(data);
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
  getItemCategory
};
