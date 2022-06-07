import { Request, Response } from "express";
import model from "../models";

const { RegisterInvitation } = model;

const getRegisterInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const data = await RegisterInvitation.findOne({
      where: {
        id,
      },
    });

    if (!data) {
      return res.status(400).send({
        message: "No ID found",
      });
    }

    res.status(200).send({
      data,
      message: "Succesfully get register invitation",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to get register invitation",
    });
  }
};

const updateRegisterInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const data = await RegisterInvitation.update(
      {
        active,
      },
      {
        where: {
          id,
        },
      }
    );

    res.status(200).send({
      data,
      message: "Succesfully update register invitation",
    });
  } catch (err) {
    res.status(500).send({
      message: "Failed to update register invitation",
    });
  }
};

export default {
  getRegisterInvitation,
  updateRegisterInvitation,
};
