import { NextFunction, Request, Response } from "express";
import models from "../models";
import { getOrderQuery } from "./../utils/index";

const { Item, Transaction } = models;

const insertBarang = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { nama_barang, harga, barang_picture } = req.body;

  let user_id = res.locals.jwt.user_id;

  try {
    const data = await Item.create({
      stock: 0,
      name: nama_barang,
      price: harga,
      picture: barang_picture,
      UserId: user_id,
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
  let { barang_id, nama_barang, harga, barang_picture } = req.body;

  try {
    const data = await Item.update(
      {
        stock: 0,
        name: nama_barang,
        price: harga,
        picture: barang_picture,
      },
      {
        where: {
          id: barang_id,
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
  let user_id = res.locals.jwt.user_id;
  const { sort, nama_barang } = req.query;
  const order = getOrderQuery(sort as string);

  try {
    const data = await Item.findAll({
      where: {
        UserId: user_id,
        nama_barang: {
          like: `%${nama_barang}%`,
        },
      },
      order,
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

const getBarangDetail = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { transaksi } = req.query;
  try {
    const data = await Item.findAll({
      where: {
        id,
      },
      include: {
        model: Transaction,
      },
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

export default { insertBarang, updateBarang, getListBarang, getBarangDetail };
