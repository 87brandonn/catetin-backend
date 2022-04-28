import { NextFunction, Request, Response } from "express";
import models from "../models";

const { Item, Transaction, Store } = models;

const upsertStore = async (req: Request, res: Response, next: NextFunction) => {
  let { name, picture, id } = req.body;

  let user_id = res.locals.jwt.user_id;

  try {
    const [data] = await Store.upsert({
      id,
      name,
      picture,
      UserId: user_id,
    });
    res.status(200).send({
      data,
      message: "Succesfully upsert store",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to upsert store",
    });
  }
};

const getStore = async (req: Request, res: Response) => {
  let user_id = res.locals.jwt.user_id;

  try {
    const data = await Store.findAll({
      where: {
        UserId: user_id,
      },
    });
    res.status(200).send({
      data,
      message: "Succesfully get list store",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to get list store",
    });
  }
};

const deleteStore = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = await Store.update(
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
      data,
      message: "Succesfully delete store",
    });
  } catch (err) {
    res.status(500).send({
      message: "An error ocured",
    });
  }
};

export default {
  upsertStore,
  getStore,
  deleteStore,
};
