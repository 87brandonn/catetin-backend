import { NextFunction, Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import logging from '../config/logging';
import signJWT from '../function/signJWT';
import { Connect, Query } from '../config/mysql';
import IUser from '../interfaces/user';
import IMySQLResult from '../interfaces/result';

const NAMESPACE = 'User';

const validateToken = (req: Request, res: Response, next: NextFunction) => {
    logging.info(NAMESPACE, 'Token validated, user authorized.');
    console.log(res.locals.jwt.user_id)
    return res.status(200).json({
        message: `Token(s) validated with user id : ${res.locals.jwt.user_id} `
    });
};

const register = (req: Request, res: Response, next: NextFunction) => {
    let { username, password } = req.body;

    bcryptjs.hash(password, 10, (hashError, hash) => {
        if (hashError) {
            return res.status(401).json({
                message: hashError.message,
                error: hashError
            });
        }

    let query = `INSERT INTO users (username, password) VALUES ("${username}", "${hash}")`;

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
    });
};

const registerGmail = (req: Request, res: Response, next: NextFunction) => {
    let { email } = req.body;

    
    let query = `INSERT INTO users (email) VALUES ("${email}")`;

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


const login = (req: Request, res: Response, next: NextFunction) => {
    let { username, password } = req.body;

    console.log(username,password);

    let query = `SELECT * FROM users WHERE username = '${username}'`;

    Connect()
        .then((connection) => {
            Query<IUser[]>(connection, query)
                .then((users) => {
                    if (users.length == 0){
                        return res.status(400).json({
                            message: 'User not found'
                        });
                    } 
                    bcryptjs.compare(password, users[0].password, (error, result) => {
                        if (error || !result) {
                            return res.status(401).json({
                                message: 'Password Mismatch'
                            });
                        } else if (result) {
                            signJWT(users[0], (_error, token) => {
                                if (_error) {
                                    return res.status(401).json({
                                        message: 'Unable to Sign JWT',
                                        error: _error
                                    });
                                } else if (token) {
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

const loginGmail = (req: Request, res: Response, next: NextFunction) => {
    let { email } = req.body;


    let query = `SELECT * FROM users WHERE email = '${email}'`;

    Connect()
        .then((connection) => {
            Query<IUser[]>(connection, query)
                .then((users) => {
                    if (users.length == 0) {
                        return res.status(400).json({
                            message : 'User not found',
                            code : 400
                        });
                    }
                    signJWT(users[0], (_error, token) => {
                        if (_error) {
                            return res.status(401).json({
                                message: 'Unable to Sign JWT',
                                code: 401,
                                error: _error
                            });
                        } else if (token) {
                            return res.status(200).json({
                                message: 'Auth Successful',
                                token,
                                user: users[0],
                                code: 200
                            });
                        }
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


const getAllUsers = (req: Request, res: Response, next: NextFunction) => {
    let query = `SELECT user_id, username FROM users`;

    Connect()
        .then((connection) => {
            Query<IUser[]>(connection, query)
                .then((users) => {
                    return res.status(200).json({
                        users,
                        count: users.length
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

const getProfile = (req: Request, res: Response, next: NextFunction) => {
    let user_id = res.locals.jwt.user_id
    let query = `SELECT username, email, nama_toko, created_at, updated_at FROM users WHERE user_id = ${user_id}`;

    Connect()
        .then((connection) => {
            Query<IUser[]>(connection, query)
                .then((users) => {
                    return res.status(200).json({
                        users,
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

const updateProfile = (req: Request, res: Response, next: NextFunction) => {
    let { nama_toko } = req.body;
    let user_id = res.locals.jwt.user_id
    let query = `UPDATE users SET nama_toko = "${nama_toko}" WHERE user_id = ${user_id}`;
    
    Connect()
        .then((connection) => {
            Query<IMySQLResult>(connection, query)
                .then((result) => {
                    
                    return res.status(201).json({
                        message: "Nama toko updated"
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
export default { validateToken, register, login, getAllUsers, registerGmail, loginGmail, updateProfile, getProfile };