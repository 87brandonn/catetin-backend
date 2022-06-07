import { NextFunction, Request, Response } from "express";
import handlebars from "handlebars";
import { default as db } from "../models";
import path from "path";
import fs from "fs";
import models from "../models";
import transporter from "../nodemailer";
import moment from "moment";

handlebars.registerHelper("link", function (text: string, url: string) {
  var url = handlebars.escapeExpression(url),
    text = handlebars.escapeExpression(text);

  return new handlebars.SafeString("<a href='" + url + "'>" + text + "</a>");
});

const { RegisterInvitation, Store, UserStore, User, Profile } = models;

const upsertStore = async (req: Request, res: Response, next: NextFunction) => {
  let { name, picture, id, grant = "owner" } = req.body;

  let user_id = res.locals.jwt.user_id;

  try {
    let [data] = await Store.upsert({
      id,
      name,
      picture,
    });

    data = JSON.parse(JSON.stringify(data));

    if (!id) {
      await UserStore.create({
        UserId: user_id,
        StoreId: data?.id,
        grant,
      });
    }

    res.status(200).send({
      data,
      message: "Succesfully upsert store",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Failed to upsert store",
    });
  }
};

const getUserByStoreId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    let data = await UserStore.findAll({
      where: {
        StoreId: id,
      },
      include: {
        model: User,
        include: {
          model: Profile,
        },
      },
    });
    data = JSON.parse(JSON.stringify(data));
    res.status(200).send({
      data,
      message: "Succesfully get list store",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Failed to get list store",
    });
  }
};

const insertUserStore = async (req: Request, res: Response) => {
  const { id } = req.params;

  const { userId, grant = "employee" } = req.body;

  try {
    const data = await UserStore.create({
      StoreId: id,
      UserId: userId,
      grant,
    });

    res.status(200).send({
      data,
      message: "Succesfully insert user store",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Failed to insert user store",
    });
  }
};

const inviteUserToStore = async (req: Request, res: Response) => {
  const {
    users,
    storeId,
  }: {
    users: {
      email: string;
    }[];
    storeId: number;
  } = req.body;

  try {
    let [storeData] = await Promise.all([
      Store.findOne({
        where: {
          id: storeId,
        },
      }),
    ]);

    if (!storeData) {
      return res.status(400).send({
        message: "No store exist",
      });
    }

    storeData = JSON.parse(JSON.stringify(storeData));

    const __dirname = path.resolve();
    const filePath = path.join(__dirname, "/template/user-invite.html");
    const source = fs.readFileSync(filePath, "utf-8").toString();
    const template = handlebars.compile(source);

    const finalData = await db.sequelize.transaction(async (t: any) =>
      Promise.all(
        users?.map(async (data) => {
          let userData = await User.findOne({
            where: {
              email: data.email,
            },
            include: {
              model: UserStore,
            },
          });

          userData = JSON.parse(JSON.stringify(userData));

          if (
            userData?.UserStores?.some((data: any) => data.StoreId === storeId)
          ) {
            throw `User ${data.email} has already registered with this store`;
          }

          const { id } = await RegisterInvitation.create(
            {
              StoreId: storeId,
              email: data?.email,
              isAlreadyRegistered: !!userData ? true : false,
              expiredAt: moment().add(30, "minutes"),
            },
            {
              transaction: t,
            }
          );

          const html = template({
            url: `https://catetin-76e27.web.app/?id=${id}`,
          });

          const result = await transporter.sendMail({
            from: "brandonpardede25@gmail.com",
            to: data.email,
            subject: "Catetin - You are invited to join",
            html,
          });

          return result;
        })
      )
    );

    res.send({
      data: finalData,
      message: "Succesfully invite users",
    });
  } catch (err) {
    console.error(err, "error sending invitation");
    res.status(400).send({
      message: "Failed send invitation",
      error: err,
    });
  }
};

const getStore = async (req: Request, res: Response) => {
  const { attributes } = req.query;
  let user_id = res.locals.jwt.user_id;

  const paramsModel = [];

  if (attributes?.length) {
    if ((attributes as string[]).includes("store")) {
      paramsModel.push(Store);
    }
    if ((attributes as string[]).includes("user")) {
      paramsModel.push({
        model: User,
        include: {
          model: Profile,
        },
      });
    }
  }

  try {
    let data = await UserStore.findAll({
      where: {
        UserId: user_id,
      },
      include: paramsModel,
    });
    data = JSON.parse(JSON.stringify(data));
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

const deleteStoreUser = async (req: Request, res: Response) => {
  const { id, userId } = req.params;
  try {
    const data = await UserStore.destroy({
      where: {
        StoreId: id,
        UserId: userId,
      },
    });
    res.status(200).send({
      data,
      message: "Succesfully delete user store association",
    });
  } catch (err) {
    res.status(500).send({
      message: "An error ocured",
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
      message: "Succesfully delete user store",
    });
  } catch (err) {
    res.status(500).send({
      message: "An error ocured",
    });
  }
};

export default {
  upsertStore,
  insertUserStore,
  getStore,
  deleteStoreUser,
  deleteStore,
  inviteUserToStore,
  getUserByStoreId,
};
