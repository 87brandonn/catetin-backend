import { Request, Response } from "express";
import model from "../models";

const { DeviceToken } = model;

const registerDevice = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const deviceTokenData = await DeviceToken.findOne({
      where: {
        token,
      },
    });

    if (deviceTokenData) {
      return res.status(200).send({
        data: deviceTokenData,
        message: "Device already registered",
      });
    }

    const data = await DeviceToken.create({
      token,
    });

    res.status(200).send({
      data,
      message: "Succesfully register device",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to register device",
    });
  }
};

export default {
  registerDevice,
};
