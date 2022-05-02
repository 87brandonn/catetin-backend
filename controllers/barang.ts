import { NextFunction, Request, Response } from "express";
import { Op } from "sequelize";
import { ICatetinBarangWithTransaksi } from "../interfaces/barang";
import models from "../models";
import * as XLSX from "xlsx";
import { getOrderQuery } from "./../utils/index";

const { Item, Transaction, ItemItemCategory, ItemCategory } = models;

const importCSV = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const workbook = XLSX.read(req.file?.buffer);
  const dataPromises = workbook.SheetNames.map((name) => {
    const worksheet = workbook.Sheets[name];
    const json: {
      Name: string;
      Price: number;
      Stok: number;
    }[] = XLSX.utils.sheet_to_json(worksheet);
    if (!json[0]?.Name || !json[0]?.Price || !json[0]?.Stok) {
      res.status(400).send({
        message: "False table format. Please try again",
      });
      return [];
    }
    return json.map((data) =>
      Item.create({
        name: data.Name,
        price: data.Price,
        stock: data.Stok,
        StoreId: id,
      })
    );
  });
  const data = await Promise.all(dataPromises[0]);
  res.status(200).send({
    data,
    message: "Succesfully get json data",
  });
};

const insertBarang = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { name, price, picture, stock = 0, category } = req.body;
  const { id } = req.params;

  try {
    const data = JSON.parse(
      JSON.stringify(
        await Item.create({
          stock,
          name,
          price,
          picture,
          StoreId: id,
        })
      )
    );
    const dataCategory = await ItemItemCategory.bulkCreate(
      category.map((cat: number) => ({
        ItemId: data.id,
        ItemCategoryId: cat,
      }))
    );
    res.status(200).send({
      data: [data, dataCategory],
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
  let { id, name, price, picture, stock, category } = req.body;

  try {
    const promises = [];
    promises.push(
      Item.update(
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
      )
    );
    promises.push(
      ItemItemCategory.destroy({
        where: {
          ItemId: id,
        },
      })
    );
    promises.push(
      ItemItemCategory.bulkCreate(
        category.map((cat: number) => ({
          ItemId: id,
          ItemCategoryId: cat,
        }))
      )
    );
    const data = await Promise.all(promises);
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
  const { sort, categories, harga, stok, nama_barang, transactionId } =
    req.query;
  const order = getOrderQuery(sort as string);

  const subQueryCategories = {};

  const whereQuery = {};

  if (nama_barang) {
    Object.assign(whereQuery, {
      name: {
        [Op.like]: `%${nama_barang}%`,
      },
    });
  }

  if (stok) {
    Object.assign(whereQuery, {
      stock: {
        [Op.between]: stok,
      },
    });
  }

  if (harga) {
    Object.assign(whereQuery, {
      price: {
        [Op.between]: harga,
      },
    });
  }

  if (categories) {
    Object.assign(subQueryCategories, {
      where: {
        id: {
          [Op.in]: categories,
        },
      },
      required: false,
      right: true,
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
      include: [
        {
          model: Transaction,
        },
        {
          model: ItemCategory,
          ...subQueryCategories,
        },
      ],
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
  const { transaksi, category } = req.query;
  const modelQuery: {
    include: { model: any }[];
  } = {
    include: [],
  };
  if (transaksi) {
    modelQuery.include.push({
      model: Transaction,
    });
  }
  if (category) {
    modelQuery.include.push({
      model: ItemCategory,
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
  importCSV,
};
