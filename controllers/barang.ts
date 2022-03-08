import { NextFunction, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import logging from '../config/logging';
import signJWT from '../function/signJWT';
import { Connect, Query } from '../config/mysql';
import IUser from '../interfaces/user';
import IMySQLResult from '../interfaces/result';
import IBarang from '../interfaces/barang';

const NAMESPACE = 'Barang';

const insertBarang = (req: Request, res: Response, next: NextFunction) => {
    let { nama_barang, stok, harga } = req.body;

    let user_id = res.locals.jwt.user_id
    let query = `INSERT INTO barang (user_id, nama_barang, stok, harga) VALUES (${user_id} ,"${nama_barang}", ${stok}, ${harga})`;

    Connect()
        .then((connection) => {
            Query<IMySQLResult>(connection, query)
                .then((result) => {
                    logging.info(NAMESPACE, `User with id ${result.insertId} inserted.`);

                    return res.status(201).json(result);
                })
                .catch((error) => {
                    logging.error(NAMESPACE, error.message, error);

                    return res.status(500).json({
                        message: error.message,
                        error
                    });
                });
        })
        .catch((error) => {
            logging.error(NAMESPACE, error.message, error);

            return res.status(500).json({
                message: error.message,
                error
            });
        });
    
};

const updateBarang = (req: Request, res: Response, next: NextFunction) => {
    let { barang_id, nama_barang, stok, harga } = req.body;

    let query = `UPDATE barang SET nama_barang = "${nama_barang}", stok = ${stok}, harga = ${harga} WHERE barang_id = ${barang_id}`;

    Connect()
        .then((connection) => {
            Query<IMySQLResult>(connection, query)
                .then((result) => {
                
                    return res.status(201).json(result);
                })
                .catch((error) => {
                    logging.error(NAMESPACE, error.message, error);

                    return res.status(500).json({
                        message: error.message,
                        error
                    });
                });
        })
        .catch((error) => {
            logging.error(NAMESPACE, error.message, error);

            return res.status(500).json({
                message: error.message,
                error
            });
        });
    
};

const getListBarang = (req: Request, res: Response, next: NextFunction) => {
    let user_id = res.locals.jwt.user_id
    let query = `SELECT * FROM barang WHERE user_id = ${user_id}`;

    Connect()
        .then((connection) => {
            Query<IBarang[]>(connection, query)
                .then((barang) => {
                    return res.status(200).json({
                        barang,
                        count: barang.length
                    });
                })
                .catch((error) => {
                    logging.error(NAMESPACE, error.message, error);

                    return res.status(500).json({
                        message: error.message,
                        error
                    });
                });
        })
        .catch((error) => {
            logging.error(NAMESPACE, error.message, error);

            return res.status(500).json({
                message: error.message,
                error
            });
        });
};

export default {insertBarang, updateBarang, getListBarang};