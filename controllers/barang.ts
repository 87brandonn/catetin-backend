import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import { ICatetinBarangWithTransaksi } from "../interfaces/barang";
import models from "../models";
import { getOrderQuery } from "./../utils/index";

const { Item, Transaction, Store } = models;

const insertBarang = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { name, price, picture, stock = 0 } = req.body;

  const { id } = req.params;

  try {
    const data = await Item.create({
      stock,
      name,
      price,
      picture,
      StoreId: id,
    });
    res.status(200).send({
      data,
      message: "Succesfully insert barang",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to insert barang",
    });
  }
};

const updateBarang = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { id, name, price, picture, stock } = req.body;

  try {
    const data = await Item.update(
      {
        name,
        price,
        picture,
        stock,
      },
      {
        where: {
          id,
        },
      }
    );
    res.status(200).send({
      data,
      message: "Succesfully update barang",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to update barang",
    });
  }
};
const getListBarang = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const { sort, nama_barang, transactionId } = req.query;
  const order = getOrderQuery(sort as string);

  const whereQuery = {};

  if (nama_barang) {
    Object.assign(whereQuery, {
      name: {
        [Op.like]: `%${nama_barang}%`,
      },
    });
  }

  try {
    let data: ICatetinBarangWithTransaksi[] = await Item.findAll({
      where: {
        StoreId: id,
        deleted: false,
        ...whereQuery,
      },
      order: [...(order || []), ["updatedAt", "DESC"]],
      include: {
        model: Transaction,
      },
    });

    if (transactionId) {
      data = data.filter((item) => {
        const isNotIncludeTransaction =
          item.Transactions.findIndex(
            (transaction) =>
              transaction.id === parseInt(transactionId as string, 10)
          ) === -1;
        return isNotIncludeTransaction;
      });
    }

    res.status(200).send({
      data,
      message: "Succesfully get barang",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      message: "Failed to get barang",
    });
  }
};

const getBarangDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { transaksi } = req.query;
  const modelQuery = {};
  if (transaksi) {
    Object.assign(modelQuery, {
      include: {
        model: Transaction,
      },
    });
  }
  try {
    const data = await Item.findOne({
      where: {
        id,
      },
      ...modelQuery,
    });
    res.status(200).send({
      data,
      message: "Succesfully get list barang",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to get list barang",
    });
  }
};

const deleteBarang = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = await Item.update(
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
      message: "Succesfully delete barang",
    });
  } catch (err) {
    res.status(500).send({
      message: "An error ocured",
    });
  }
};

export default {
  insertBarang,
  updateBarang,
  getListBarang,
  getBarangDetail,
  deleteBarang,
};
