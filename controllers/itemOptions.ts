import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import models from "../models";

const { ItemOption } = models;

const getItemOptions = async (req: Request, res: Response) => {
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
    const responseData = await ItemOption.findAll();
    res.status(200).send({
      data: responseData,
      message: "Succesfully get item option",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to get item option",
    });
  }
};

const insertItemOptions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { name } = req.body;

  try {
    const responseData = await ItemOption.create({
      name,
    });
    res.status(200).send({
      data: responseData,
      message: "Succesfully insert item option",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to insert item option",
    });
  }
};

export default {
  insertItemOptions,
  getItemOptions,
};
