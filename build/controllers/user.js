"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logging_1 = __importDefault(require("../config/logging"));
const signJWT_1 = __importDefault(require("../function/signJWT"));
const mysql_1 = require("../config/mysql");
const NAMESPACE = 'User';
const validateToken = (req, res, next) => {
    logging_1.default.info(NAMESPACE, 'Token validated, user authorized.');
    return res.status(200).json({
        message: 'Token(s) validated'
    });
};
const register = (req, res, next) => {
    let { username, password } = req.body;
    bcryptjs_1.default.hash(password, 10, (hashError, hash) => {
        if (hashError) {
            return res.status(401).json({
                message: hashError.message,
                error: hashError
            });
        }
        let query = `INSERT INTO users (username, password) VALUES ("${username}", "${hash}")`;
        (0, mysql_1.Connect)()
            .then((connection) => {
            (0, mysql_1.Query)(connection, query)
                .then((result) => {
                logging_1.default.info(NAMESPACE, `User with id ${result.insertId} inserted.`);
                return res.status(201).json(result);
            })
                .catch((error) => {
                logging_1.default.error(NAMESPACE, error.message, error);
                return res.status(500).json({
                    message: error.message,
                    error
                });
            });
        })
            .catch((error) => {
            logging_1.default.error(NAMESPACE, error.message, error);
            return res.status(500).json({
                message: error.message,
                error
            });
        });
    });
};
const login = (req, res, next) => {
    let { username, password } = req.body;
    let query = `SELECT * FROM users WHERE username = '${username}'`;
    (0, mysql_1.Connect)()
        .then((connection) => {
        (0, mysql_1.Query)(connection, query)
            .then((users) => {
            bcryptjs_1.default.compare(password, users[0].password, (error, result) => {
                if (error || !result) {
                    return res.status(401).json({
                        message: 'Password Mismatch'
                    });
                }
                else if (result) {
                    (0, signJWT_1.default)(users[0], (_error, token) => {
                        if (_error) {
                            return res.status(401).json({
                                message: 'Unable to Sign JWT',
                                error: _error
                            });
                        }
                        else if (token) {
                            return res.status(200).json({
                                message: 'Auth Successful',
                                token,
                                user: users[0]
                            });
                        }
                    });
                }
            });
        })
            .catch((error) => {
            logging_1.default.error(NAMESPACE, error.message, error);
            return res.status(500).json({
                message: error.message,
                error
            });
        });
    })
        .catch((error) => {
        logging_1.default.error(NAMESPACE, error.message, error);
        return res.status(500).json({
            message: error.message,
            error
        });
    });
};
const getAllUsers = (req, res, next) => {
    let query = `SELECT _id, username FROM users`;
    (0, mysql_1.Connect)()
        .then((connection) => {
        (0, mysql_1.Query)(connection, query)
            .then((users) => {
            return res.status(200).json({
                users,
                count: users.length
            });
        })
            .catch((error) => {
            logging_1.default.error(NAMESPACE, error.message, error);
            return res.status(500).json({
                message: error.message,
                error
            });
        });
    })
        .catch((error) => {
        logging_1.default.error(NAMESPACE, error.message, error);
        return res.status(500).json({
            message: error.message,
            error
        });
    });
};
exports.default = { validateToken, register, login, getAllUsers };
