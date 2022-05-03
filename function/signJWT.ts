import jwt from "jsonwebtoken";
import config from "../config/config";
import logging from "../config/logging";

const NAMESPACE = "Auth";

const signJWT = (userId: number) => {
  logging.info(NAMESPACE, `Attempting to sign token for ${userId}`);

  return jwt.sign(
    {
      user_id: userId,
    },
    config.server.token.secret,
    {
      expiresIn: "1h",
    }
  );
};

export default signJWT;
