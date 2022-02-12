import { Request, Response } from "express";

const getAuth = (req: Request, res: Response) => {
  res.send("Succesfully get auth!");
};

export { getAuth };
