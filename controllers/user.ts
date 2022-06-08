import bcryptjs from "bcryptjs";
import { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import logging from "../config/logging";
import signJWT from "../function/signJWT";
import model from "../models";
import moment from "moment";
import transporter from "../nodemailer";
import config from "../config/config";

const NAMESPACE = "User";
const {
  User,
  Profile,
  VerificationEmailNumber,
  ResetPasswordNumber,
  RefreshToken,
  DeviceToken,
  UserDeviceToken,
  UserStore,
} = model;

const validateToken = (req: Request, res: Response, next: NextFunction) => {
  logging.info(NAMESPACE, "Token validated, user authorized.");

  return res.status(200).json({
    message: `Token(s) validated with user id : ${res.locals.jwt.user_id} `,
  });
};

const register = async (req: Request, res: Response, next: NextFunction) => {
  let { username, password, email, device_token_id } = req.body;

  try {
    const promises = [];
    promises.push(
      User.findOne({
        where: {
          email,
        },
      })
    );
    promises.push(
      User.findOne({
        where: {
          username,
        },
      })
    );
    let [emailData, usernameData] = await Promise.all(promises);

    emailData = JSON.parse(JSON.stringify(emailData));
    usernameData = JSON.parse(JSON.stringify(usernameData));

    if (!emailData && !usernameData) {
      const hash = await bcryptjs.hash(password, 10);
      const { id } = await User.create({
        username,
        password: hash,
        provider: "catetin",
        email,
        verified: false,
      });

      const token = signJWT(id);
      const refreshToken = jwt.sign(
        {
          user_id: id,
        },
        config.server.token.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "14d",
        }
      );

      const promises = [];
      if (device_token_id) {
        UserDeviceToken.create({
          DeviceTokenId: device_token_id,
          UserId: id,
        });
      }
      promises.push(
        RefreshToken.create({
          token: refreshToken,
          UserId: id,
        })
      );

      await Promise.all(promises);

      return res.status(200).send({
        message: "Auth Successful",
        token,
        refreshToken,
        user_id: id,
      });
    }
    return res.status(400).send({
      message: `Account already exists with ${
        emailData && !usernameData
          ? "this email"
          : usernameData && !emailData
          ? "this username"
          : "this email and username"
      }. Please log in with associated provider: ${
        (emailData || usernameData).provider === "catetin"
          ? "Manual Sign In"
          : (emailData || usernameData).provider
      }`,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  let { username, password, device_token_id } = req.body;

  try {
    const users = await User.findOne({
      where: {
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
    bcryptjs.compare(
      password,
      users.dataValues.password,
      async (error, result) => {
        if (error || !result) {
          return res.status(401).json({
            message: "Password Mismatch",
          });
        } else if (result) {
          const token = signJWT(users.dataValues.id);
          const refreshToken = jwt.sign(
            {
              user_id: users.dataValues.id,
            },
            config.server.token.REFRESH_TOKEN_SECRET,
            {
              expiresIn: "14d",
            }
          );
          const promises = [];
          if (device_token_id) {
            promises.push(
              UserDeviceToken.create({
                DeviceTokenId: device_token_id,
                UserId: users.dataValues.id,
              })
            );
          }
          promises.push(
            RefreshToken.create({
              token: refreshToken,
              UserId: users.dataValues.id,
            })
          );

          await Promise.all(promises);

          return res.status(200).json({
            message: "Auth Successful",
            token,
            refreshToken,
            user: users,
          });
        }
      }
    );
  } catch (err: any) {
    return res.status(500).json({
      message: err.message,
      err,
    });
  }
};

const loginGmail = async (req: Request, res: Response, next: NextFunction) => {
  let { email, name, device_token_id } = req.body;

  try {
    const users = JSON.parse(
      JSON.stringify(
        await User.findOne({
          where: {
            email,
          },
        })
      )
    );
    if (!users) {
      const { id } = await User.create({
        email,
        provider: "google",
        username: crypto.randomBytes(16).toString("hex"),
        password: crypto.randomBytes(16).toString("hex"),
        verified: true,
      });

      const token = signJWT(id);
      const refreshToken = jwt.sign(
        {
          user_id: id,
        },
        config.server.token.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "14d",
        }
      );

      const promises = [];
      if (device_token_id) {
        promises.push(
          UserDeviceToken.create({
            DeviceTokenId: device_token_id,
            UserId: users.id,
          })
        );
      }
      promises.push(
        RefreshToken.create({
          token: refreshToken,
          UserId: id,
        }),
        Profile.create({
          displayName: name,
          UserId: id,
        })
      );
      await Promise.all(promises);

      return res.status(200).json({
        message: "Auth Successful",
        token,
        refreshToken,
        user: id,
      });
    }
    if (users.provider === "google") {
      const token = signJWT(users.id);
      const refreshToken = jwt.sign(
        {
          user_id: users.id,
        },
        config.server.token.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "14d",
        }
      );

      const promises = [];
      if (device_token_id) {
        promises.push(
          UserDeviceToken.create({
            DeviceTokenId: device_token_id,
            UserId: users.id,
          })
        );
      }
      promises.push(
        RefreshToken.create({
          token: refreshToken,
          UserId: users.id,
        })
      );

      await Promise.all(promises);

      return res.status(200).json({
        message: "Auth Successful",
        token,
        refreshToken,
        user: users.id,
      });
    }
    return res.status(400).send({
      message: `Account already exists. Please log in with associated provider: ${
        users.provider === "catetin" ? "Manual Sign In" : users.provider
      }`,
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
  let { email, name, device_token_id } = req.body;

  try {
    const users = JSON.parse(
      JSON.stringify(
        await User.findOne({
          where: {
            email,
          },
        })
      )
    );
    if (!users) {
      const { id } = await User.create({
        email,
        provider: "facebook",
        username: crypto.randomBytes(16).toString("hex"),
        password: crypto.randomBytes(16).toString("hex"),
        verified: true,
      });

      const token = signJWT(id);
      const refreshToken = jwt.sign(
        {
          user_id: id,
        },
        config.server.token.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "14d",
        }
      );
      const promises = [];
      if (device_token_id) {
        promises.push(
          UserDeviceToken.create({
            DeviceTokenId: device_token_id,
            UserId: users.id,
          })
        );
      }
      promises.push(
        RefreshToken.create({
          token: refreshToken,
          UserId: id,
        }),
        Profile.create({
          displayName: name,
          UserId: id,
        })
      );
      await Promise.all(promises);

      return res.status(200).json({
        message: "Auth Successful",
        token,
        refreshToken,
        user: id,
      });
    }
    if (users.provider === "facebook") {
      const token = signJWT(users.id);
      const refreshToken = jwt.sign(
        {
          user_id: users.id,
        },
        config.server.token.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "14d",
        }
      );
      const promises = [];
      if (device_token_id) {
        promises.push(
          UserDeviceToken.create({
            DeviceTokenId: device_token_id,
            UserId: users.id,
          })
        );
      }
      promises.push(
        RefreshToken.create({
          token: refreshToken,
          UserId: users.id,
        })
      );
      await Promise.all(promises);

      return res.status(200).json({
        message: "Auth Successful",
        token,
        refreshToken,
        user: users.id,
      });
    }
    return res.status(400).send({
      message: `Account already exists. Please log in with associated provider: ${
        users.provider === "catetin" ? "Manual Sign In" : users.provider
      }`,
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
  let { displayName, profilePicture, id } = req.body;
  let user_id = res.locals.jwt.user_id;

  try {
    await Profile.upsert({
      id,
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

export const generatePasswordResetNumber = async (
  req: Request,
  res: Response
) => {
  const { email } = req.query;
  try {
    let userData = await User.findOne({
      where: {
        [Op.or]: [
          {
            email,
          },
          { username: email },
        ],
      },
    });
    if (!userData) {
      return res.status(400).send({
        message: "There are no user associated with this email",
      });
    }
    const promises = [];
    promises.push(
      ResetPasswordNumber.create({
        unique_number: Math.floor(1000 + Math.random() * 9000),
        active: true,
        UserId: userData.id,
        expirationDate: moment().add("30", "minutes").toDate(),
      })
    );
    let [resetPasswordData] = await Promise.all(promises);
    resetPasswordData = JSON.parse(JSON.stringify(resetPasswordData));
    userData = JSON.parse(JSON.stringify(userData));
    await transporter.sendMail({
      from: "brandonpardede25@gmail.com",
      to: userData.email,
      subject: "Password Reset",
      html: `${resetPasswordData.unique_number} is your 4 digit reset password key for another 30 minutes. Thank you for using Catetin.`,
    });
    res.status(200).send({
      data: userData.email,
      message: "Succesfully send reset password key",
    });
  } catch (err) {
    console.error("Failed to generate password reset number", err);
    res.status(500).send({
      message: "An error occured while generating password reset number",
      err,
    });
  }
};

export const verifyResetPassword = async (req: Request, res: Response) => {
  const { number, email } = req.body;
  try {
    let userData = await User.findOne({
      where: {
        [Op.or]: [
          {
            email,
          },
          { username: email },
        ],
      },
    });
    if (!userData) {
      return res.status(400).send({
        message: "There are no user associated with this email",
      });
    }
    userData = JSON.parse(JSON.stringify(userData));
    const data = await ResetPasswordNumber.findOne({
      where: {
        unique_number: number,
        active: true,
        expirationDate: {
          [Op.gte]: moment().toDate(),
        },
        UserId: userData.id,
      },
    });
    if (!data) {
      return res.status(400).send({
        message: "ID have been revoked or might not exist. Please try again",
      });
    }
    const promises = [];
    promises.push(
      ResetPasswordNumber.update(
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
    const promisesData = await Promise.all(promises);
    res.status(200).send({
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

export const generateVerifyNumber = async (req: Request, res: Response) => {
  try {
    const user_id = res.locals.jwt.user_id;
    const promises = [];
    promises.push(
      VerificationEmailNumber.create({
        unique_number: Math.floor(1000 + Math.random() * 9000),
        active: true,
        UserId: user_id,
        expirationDate: moment().add("30", "minutes").toDate(),
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

const autoLoginFromInvitation = async (req: Request, res: Response) => {
  let { email, device_token_id } = req.body;

  try {
    let users = await User.findOne({
      where: {
        email,
      },
    });

    if (!users) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    const token = signJWT(users.dataValues.id);
    const refreshToken = jwt.sign(
      {
        user_id: users.dataValues.id,
      },
      config.server.token.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "14d",
      }
    );

    const promises = [];
    if (device_token_id) {
      promises.push(
        UserDeviceToken.create({
          DeviceTokenId: device_token_id,
          UserId: users.dataValues.id,
        })
      );
    }

    promises.push(
      RefreshToken.create({
        token: refreshToken,
        UserId: users.dataValues.id,
      })
    );

    await Promise.all(promises);

    return res.status(200).json({
      message: "Auth Successful",
      token,
      refreshToken,
      user: users,
    });
  } catch (err) {
    console.error(err);
    res.status(400).send({
      message: "An error occured",
      err,
    });
  }
};

export const registerUserAndStore = async (req: Request, res: Response) => {
  let { password, email, device_token_id, storeId, displayName } = req.body;

  try {
    const promises = [];
    promises.push(
      User.findOne({
        where: {
          email,
        },
      })
    );
    let [emailData] = await Promise.all(promises);

    emailData = JSON.parse(JSON.stringify(emailData));

    if (!emailData) {
      const hash = await bcryptjs.hash(password, 10);
      const { id } = await User.create({
        username: crypto.randomBytes(16).toString("hex"),
        password: hash,
        provider: "catetin",
        email,
        verified: false,
      });

      const token = signJWT(id);
      const refreshToken = jwt.sign(
        {
          user_id: id,
        },
        config.server.token.REFRESH_TOKEN_SECRET,
        {
          expiresIn: "14d",
        }
      );

      const promises = [];
      promises.push(
        Profile.create({
          displayName,
          UserId: id,
        })
      );
      if (device_token_id) {
        UserDeviceToken.create({
          DeviceTokenId: device_token_id,
          UserId: id,
        });
      }
      promises.push(
        UserStore.create({
          StoreId: storeId,
          UserId: id,
          grant: "employee",
        })
      );
      promises.push(
        RefreshToken.create({
          token: refreshToken,
          UserId: id,
        })
      );

      await Promise.all(promises);

      return res.status(200).send({
        message: "Auth Successful",
        token,
        refreshToken,
        user_id: id,
      });
    }
    return res.status(400).send({
      message: `Account already exists with this email`,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
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
      res.status(400).send({
        message: "ID have been revoked or might not exist. Please try again",
      });
    } else {
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
      res.status(200).send({
        data: promisesData,
        message: "Succesfully authenticated",
      });
    }
  } catch (err) {
    console.error("Failed to verify number", err);
    res.status(500).send({
      message: "An error occured while verifying number",
      err,
    });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  let { new_password, email } = req.body;
  try {
    const users = await User.findOne({
      where: {
        email,
      },
    });

    if (!users) {
      return res.status(400).send({
        message: "No user associated with this email. Please try again",
      });
    }

    const promises = [];

    promises.push(
      User.update(
        {
          password: await bcryptjs.hash(new_password, 10),
        },
        {
          where: {
            id: users.dataValues.id,
          },
        }
      )
    );

    promises.push(
      RefreshToken.update(
        {
          deleted: true,
        },
        {
          where: {
            UserId: users.dataValues.id,
          },
        }
      )
    );

    promises.push(
      UserDeviceToken.destroy({
        where: {
          UserId: users.dataValues.id,
        },
      })
    );

    await Promise.all(promises);

    return res.status(200).send({
      message: "Succesfully change password",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message,
      error,
    });
  }
};

const getRefreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);
  const data = await RefreshToken.findOne({
    where: {
      token: refreshToken,
      deleted: false,
    },
  });
  if (!data) {
    return res.sendStatus(403);
  }
  jwt.verify(
    refreshToken,
    config.server.token.REFRESH_TOKEN_SECRET,
    (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      const accessToken = signJWT(user.user_id);
      res.status(200).send({
        data: accessToken,
        message: "Succesfully get accessToken from refreshToken",
      });
    }
  );
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken, device_token_id } = req.body;

  try {
    const promises = [];
    const refreshTokenData = await RefreshToken.findOne({
      where: {
        token: refreshToken,
      },
    });

    if (refreshTokenData) {
      promises.push(
        RefreshToken.update(
          { deleted: true },
          {
            where: {
              token: refreshToken,
            },
          }
        )
      );
      promises.push(
        UserDeviceToken.destroy({
          where: {
            DeviceTokenId: device_token_id,
            UserId: refreshTokenData.UserId,
          },
        })
      );
    }

    /* This will handle destroying notification session for a user */

    /* End region */

    await Promise.all(promises);

    res.status(200).send({
      message: "Succesfully perform logout. Refresh token destroyed",
    });
  } catch (err) {
    console.error("Failed logging out", err);
    res.status(500).send({
      message: "Internal server error. Failed to perform logout.",
    });
  }
};

export default {
  validateToken,
  register,
  loginFacebook,
  login,
  generateVerifyNumber,
  generatePasswordResetNumber,
  verifyResetPassword,
  verifyEmailNumber,
  loginGmail,
  updateProfile,
  getProfile,
  registerUserAndStore,
  updatePassword,
  getRefreshToken,
  logout,
  autoLoginFromInvitation,
};
