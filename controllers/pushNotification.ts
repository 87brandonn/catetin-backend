import { Request, Response } from "express";
import model from "../models";

const { Device } = model;

const registerDevice = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    const deviceData = await Device.findOne({
      where: {
        token,
      },
    });

    if (deviceData) {
      return res.status(200).send({
        data: deviceData,
        message: "Device already registered",
      });
    }

    const data = await Device.create({
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
