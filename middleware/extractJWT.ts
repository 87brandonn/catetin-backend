import jwt from "jsonwebtoken";
import config from "../config/config";
import logging from "../config/logging";
import { Request, Response, NextFunction } from "express";

const NAMESPACE = "Auth";

const extractJWT = (req: Request, res: Response, next: NextFunction) => {
  logging.info(NAMESPACE, "Validating token");

  let token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, config.server.token.secret, (error, decoded) => {
    if (error) {
      return res.sendStatus(403);
    }
    res.locals.jwt = decoded;
    next();
  });
};

export default extractJWT;
