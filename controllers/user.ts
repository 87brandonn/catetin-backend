import { generateEditQuery, serializePayloadtoQuery } from "./../utils/index";
import { NextFunction, Request, Response } from "express";
import bcryptjs from "bcryptjs";
import logging from "../config/logging";
import signJWT from "../function/signJWT";
import { Connect, Query } from "../config/mysql";
import IUser from "../interfaces/user";
import IMySQLResult from "../interfaces/result";

const NAMESPACE = "User";

const validateToken = (req: Request, res: Response, next: NextFunction) => {
  logging.info(NAMESPACE, "Token validated, user authorized.");
  console.log(res.locals.jwt.user_id);
  return res.status(200).json({
    message: `Token(s) validated with user id : ${res.locals.jwt.user_id} `,
  });
};

const register = async (req: Request, res: Response, next: NextFunction) => {
  let { username, password } = req.body;

  let queryGet = `SELECT * FROM users WHERE username = '${username}'`;

  try {
    const connection = await Connect();
    const users = await Query<IUser[]>(connection, queryGet);
    if (users.length != 0) {
      res.status(400).json({
        message: "Username is used",
      });
      return;
    }
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }

  bcryptjs.hash(password, 10, (hashError, hash) => {
    if (hashError) {
      return res.status(401).json({
        message: hashError.message,
        error: hashError,
      });
    }

    let query = `INSERT INTO users (username, password) VALUES ("${username}", "${hash}")`;

    Connect()
      .then((connection) => {
        Query<IMySQLResult>(connection, query)
          .then((result) => {
            signJWT(result.insertId, (_error, token) => {
              if (_error) {
                return res.status(401).json({
                  message: "Unable to Sign JWT",
                  error: _error,
                });
              } else if (token) {
                console.log("have token");
                res.status(200).json({
                  message: "Auth Successful",
                  token,
                  user_id: result.insertId,
                });
              }
            });
          })
          .catch((error) => {
            logging.error(NAMESPACE, error.message, error);

            return res.status(500).json({
              message: error.message,
              error,
            });
          });
      })
      .catch((error) => {
        logging.error(NAMESPACE, error.message, error);

        return res.status(500).json({
          message: error.message,
          error,
        });
      });
  });
};

const registerGmail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { email } = req.body;

  let query = `INSERT INTO users (email) VALUES ("${email}")`;
  let queryGet = `SELECT * FROM users WHERE email = '${email}'`;

  try {
    const connection = await Connect();
    const users = await Query<IUser[]>(connection, queryGet);
    if (users.length != 0) {
      signJWT(users[0].user_id, (_error, token) => {
        if (_error) {
          return res.status(401).json({
            message: "Unable to Sign JWT",
            error: _error,
          });
        } else if (token) {
          console.log("have token");
          res.status(200).json({
            message: "Auth Successful",
            token,
            user: users[0],
          });
        }
      });
      return;
    }
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
  Connect()
    .then((connection) => {
      Query<IMySQLResult>(connection, query)
        .then((result) => {
          logging.info(NAMESPACE, `User with id ${result.insertId} inserted.`);
          signJWT(result.insertId, (_error, token) => {
            if (_error) {
              return res.status(401).json({
                message: "Unable to Sign JWT",
                error: _error,
              });
            } else if (token) {
              return res.status(200).json({
                message: "Auth Successful",
                token,
                user_id: result.insertId,
              });
            }
          });
        })
        .catch((error) => {
          logging.error(NAMESPACE, error.message, error);

          return res.status(500).json({
            message: error.message,
            error,
          });
        });
    })
    .catch((error) => {
      logging.error(NAMESPACE, error.message, error);

      return res.status(500).json({
        message: error.message,
        error,
      });
    });
};

const login = (req: Request, res: Response, next: NextFunction) => {
  let { username, password } = req.body;

  console.log(username, password);

  let query = `SELECT * FROM users WHERE username = '${username}'`;

  Connect()
    .then((connection) => {
      Query<IUser[]>(connection, query)
        .then((users) => {
          if (users.length == 0) {
            return res.status(400).json({
              message: "User not found",
            });
          }
          bcryptjs.compare(password, users[0].password, (error, result) => {
            if (error || !result) {
              return res.status(401).json({
                message: "Password Mismatch",
              });
            } else if (result) {
              signJWT(users[0].user_id, (_error, token) => {
                if (_error) {
                  return res.status(401).json({
                    message: "Unable to Sign JWT",
                    error: _error,
                  });
                } else if (token) {
                  return res.status(200).json({
                    message: "Auth Successful",
                    token,
                    user: users[0],
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
            error,
          });
        });
    })
    .catch((error) => {
      logging.error(NAMESPACE, error.message, error);

      return res.status(500).json({
        message: error.message,
        error,
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
              message: "User not found",
            });
          }
          signJWT(users[0].user_id, (_error, token) => {
            if (_error) {
              return res.status(401).json({
                message: "Unable to Sign JWT",

                error: _error,
              });
            } else if (token) {
              return res.status(200).json({
                message: "Auth Successful",
                token,
                user: users[0],
              });
            }
          });
        })
        .catch((error) => {
          logging.error(NAMESPACE, error.message, error);

          return res.status(500).json({
            message: error.message,
            error,
          });
        });
    })
    .catch((error) => {
      logging.error(NAMESPACE, error.message, error);

      return res.status(500).json({
        message: error.message,
        error,
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
            count: users.length,
          });
        })
        .catch((error) => {
          logging.error(NAMESPACE, error.message, error);

          return res.status(500).json({
            message: error.message,
            error,
          });
        });
    })
    .catch((error) => {
      logging.error(NAMESPACE, error.message, error);

      return res.status(500).json({
        message: error.message,
        error,
      });
    });
};

const getProfile = (req: Request, res: Response, next: NextFunction) => {
  let user_id = res.locals.jwt.user_id;
  let query = `SELECT * FROM users WHERE user_id = ${user_id}`;

  Connect()
    .then((connection) => {
      Query<IUser[]>(connection, query)
        .then((users) => {
          if (users[0].username != null) {
            return res.status(200).json({
              username: users[0].username,
              nama_toko: users[0].nama_toko,
            });
          } else {
            return res.status(200).json({
              username: users[0].email,
              nama_toko: users[0].nama_toko,
            });
          }
        })
        .catch((error) => {
          logging.error(NAMESPACE, error.message, error);

          return res.status(500).json({
            message: error.message,
            error,
          });
        });
    })
    .catch((error) => {
      logging.error(NAMESPACE, error.message, error);

      return res.status(500).json({
        message: error.message,
        error,
      });
    });
};

const updateProfile = (req: Request, res: Response, next: NextFunction) => {
  let { nama_toko, display_name, profile_picture } = req.body;
  let user_id = res.locals.jwt.user_id;
  const query = generateEditQuery(
    "users",
    serializePayloadtoQuery({
      nama_toko,
      display_name,
      profile_picture,
    }),
    serializePayloadtoQuery(
      {
        user_id,
      },
      true
    )
  );

  Connect()
    .then((connection) => {
      Query<IMySQLResult>(connection, query)
        .then((result) => {
          return res.status(201).json({
            message: "Nama toko updated",
          });
        })
        .catch((error) => {
          logging.error(NAMESPACE, error.message, error);

          return res.status(500).json({
            message: error.message,
            error,
          });
        });
    })
    .catch((error) => {
      logging.error(NAMESPACE, error.message, error);

      return res.status(500).json({
        message: error.message,
        error,
      });
    });
};

export const updateProfilePassword = async (req: Request, res: Response) => {
  let { current_password, new_password } = req.body;
  try {
    const user_id = res.locals.jwt.user_id;
    const connection = await Connect();
    const query = `SELECT password FROM users WHERE user_id = ${user_id}`;
    const data = await Query<IUser[]>(connection, query);
    const result = await bcryptjs.compare(current_password, data[0]?.password);
    let statusCode = 200;
    let message = "Succesfully change password";
    if (!result) {
      statusCode = 200;
      message = "Wrong password. Please recheck again";
    } else {
      const updatePasswordQuery = generateEditQuery(
        "users",
        serializePayloadtoQuery({
          password: await bcryptjs.hash(new_password, 10),
        }),
        serializePayloadtoQuery(
          {
            user_id,
          },
          true
        )
      );
      await Query<IUser[]>(connection, updatePasswordQuery);
    }
    res.status(statusCode).send({
      message,
    });
  } catch (error: any) {
    logging.error(NAMESPACE, error.message, error);
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
};
export default {
  validateToken,
  register,
  login,
  getAllUsers,
  registerGmail,
  loginGmail,
  updateProfile,
  getProfile,
  updateProfilePassword,
};
