import bcryptjs from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import { Op } from "sequelize";
import logging from "../config/logging";
import signJWT from "../function/signJWT";
import model from "../models";
import moment from "moment";
import transporter from "../nodemailer";

const NAMESPACE = "User";
const { User, Profile, VerificationEmailNumber } = model;

const validateToken = (req: Request, res: Response, next: NextFunction) => {
  logging.info(NAMESPACE, "Token validated, user authorized.");

  return res.status(200).json({
    message: `Token(s) validated with user id : ${res.locals.jwt.user_id} `,
  });
};

const register = async (req: Request, res: Response, next: NextFunction) => {
  let { username, password, email } = req.body;

  try {
    const users = await User.findOne({
      where: {
        username,
      },
    });
    if (users) {
      res.status(400).json({
        message: "Username is used",
      });
      return;
    }

    const hash = await bcryptjs.hash(password, 10);
    const { id } = await User.create({
      username,
      password: hash,
      provider: "catetin",
      email,
      verified: false,
    });

    signJWT(id, (_error, token) => {
      if (_error) {
        return res.status(401).json({
          message: "Unable to Sign JWT",
          error: _error,
        });
      } else if (token) {
        res.status(200).json({
          message: "Auth Successful",
          token,
          user_id: id,
        });
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  let { username, password } = req.body;

  try {
    const users = await User.findOne({
      where: {
        provider: "catetin",
        [Op.or]: [
          {
            username,
          },
          {
            email: username,
          },
        ],
      },
    });

    if (!users) {
      return res.status(400).json({
        message: "User not found",
      });
    }
    bcryptjs.compare(password, users.dataValues.password, (error, result) => {
      if (error || !result) {
        return res.status(401).json({
          message: "Password Mismatch",
        });
      } else if (result) {
        signJWT(users.dataValues.id, (_error, token) => {
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
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
      err,
    });
  }
};

const loginGmail = async (req: Request, res: Response, next: NextFunction) => {
  let { email, name } = req.body;

  try {
    let signedId: number;
    const users = await User.findOne({
      where: {
        email,
        provider: "google",
      },
    });
    if (!users) {
      const { id } = await User.create({
        email,
        provider: "google",
        username: crypto.randomBytes(16).toString("hex"),
        password: crypto.randomBytes(16).toString("hex"),
        verified: true,
      });
      await Profile.create({
        displayName: name,
        UserId: id,
      });
      signedId = id;
    } else {
      signedId = users.dataValues.id;
    }
    signJWT(signedId, (_error, token) => {
      if (_error) {
        return res.status(401).json({
          message: "Unable to Sign JWT",

          error: _error,
        });
      } else if (token) {
        return res.status(200).json({
          message: "Auth Successful",
          token,
          user: signedId,
        });
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
      err,
    });
  }
};

const loginFacebook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { email, name } = req.body;

  try {
    let signedId: number;
    const users = await User.findOne({
      where: {
        email,
        provider: "facebook",
      },
    });
    if (!users) {
      const { id } = await User.create({
        email,
        provider: "facebook",
        username: crypto.randomBytes(16).toString("hex"),
        password: crypto.randomBytes(16).toString("hex"),
        verified: true,
      });
      await Profile.create({
        displayName: name,
        UserId: id,
      });
      signedId = id;
    } else {
      signedId = users.dataValues.id;
    }
    signJWT(signedId, (_error, token) => {
      if (_error) {
        return res.status(401).json({
          message: "Unable to Sign JWT",
          error: _error,
        });
      } else if (token) {
        return res.status(200).json({
          message: "Auth Successful",
          token,
          user: signedId,
        });
      }
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
      err,
    });
  }
};

const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  let user_id = res.locals.jwt.user_id;

  try {
    let statusCode = 200;
    let message = "Succesfully get user data";
    const users = await User.findOne({
      where: {
        id: user_id,
      },
      include: {
        model: Profile,
      },
    });
    if (!users) {
      statusCode = 404;
      message = "User not exist";
    }
    res.status(statusCode).send({
      message,
      data: users?.dataValues,
    });
  } catch (err: any) {
    res.status(500).json({
      message: err.message,
      err,
    });
  }
};

const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { storeName, displayName, profilePicture, id } = req.body;
  let user_id = res.locals.jwt.user_id;

  try {
    await Profile.upsert({
      id,
      storeName,
      displayName,
      profilePicture,
      UserId: user_id,
    });
    return res.status(201).json({
      message: "Nama toko updated",
    });
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
      err,
    });
  }
};

export const generateVerifyNumber = async (req: Request, res: Response) => {
  try {
    const user_id = res.locals.jwt.user_id;
    const promises = [];
    promises.push(
      VerificationEmailNumber.create({
        unique_number: Math.floor(1000 + Math.random() * 9000),
        active: true,
        UserId: user_id,
      })
    );
    promises.push(
      User.findOne({
        where: {
          id: user_id,
        },
      })
    );
    let [verificationEmailNumberData, userData] = await Promise.all(promises);
    verificationEmailNumberData = JSON.parse(
      JSON.stringify(verificationEmailNumberData)
    );
    userData = JSON.parse(JSON.stringify(userData));
    await transporter.sendMail({
      from: "brandonpardede25@gmail.com",
      to: userData.email,
      subject: "Email Verification Number",
      html: `${verificationEmailNumberData.unique_number} is your 6 digit verification number for another 30 minutes. Thank you for using Catetin.`,
    });
    res.status(200).send({
      message: "Succesfully send verification email number",
    });
  } catch (err) {
    console.error("Failed to generate verify number", err);
    res.status(500).send({
      message: "An error occured while generating verify number",
      err,
    });
  }
};

export const verifyEmailNumber = async (req: Request, res: Response) => {
  const user_id = res.locals.jwt.user_id;
  const { number } = req.body;
  try {
    const data = await VerificationEmailNumber.findOne({
      where: {
        unique_number: number,
        active: true,
        expirationDate: {
          [Op.gte]: moment().toDate(),
        },
        UserId: user_id,
      },
    });
    if (!data) {
      res.status(403).send({
        message: "ID have been revoked or might not exist. Please try again",
      });
      return;
    }
    const promises = [];
    promises.push(
      VerificationEmailNumber.update(
        {
          active: false,
        },
        {
          where: {
            id: data.id,
          },
        }
      )
    );
    promises.push(
      User.update(
        {
          verified: true,
        },
        {
          where: {
            id: user_id,
          },
        }
      )
    );
    const promisesData = await Promise.all(promises);
    res.send(200).send({
      data: promisesData,
      message: "Succesfully authenticated",
    });
  } catch (err) {
    console.error("Failed to verify number", err);
    res.status(500).send({
      message: "An error occured while verifying number",
      err,
    });
  }
};

export const updateProfilePassword = async (req: Request, res: Response) => {
  let { current_password, new_password } = req.body;
  try {
    const user_id = res.locals.jwt.user_id;

    const users = await User.findOne({
      where: {
        id: user_id,
      },
    });
    const result = await bcryptjs.compare(
      current_password,
      users.dataValues.password
    );
    let statusCode = 200;
    let message = "Succesfully change password";
    if (!result) {
      statusCode = 200;
      message = "Wrong password. Please recheck again";
    } else {
      await User.update(
        {
          password: await bcryptjs.hash(new_password, 10),
        },
        {
          where: {
            id: user_id,
          },
        }
      );
    }
    return res.status(statusCode).send({
      message,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
};
export default {
  validateToken,
  register,
  loginFacebook,
  login,
  generateVerifyNumber,
  verifyEmailNumber,
  loginGmail,
  updateProfile,
  getProfile,
  updateProfilePassword,
};
