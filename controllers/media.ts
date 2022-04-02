import { format } from "util";
import { Storage } from "@google-cloud/storage";
import * as path from "path";
import moment from "moment";
import { Request, Response } from "express";

const dirname = path.resolve();
const filePath = path.join(dirname, "/config/catetin-343018-9b5788896c47.json");
const storage = new Storage({
  keyFilename: filePath,
});
const bucket = storage.bucket("catetin-main");

const postImage = async (req: Request, res: Response) => {
  console.log(req.file);
  try {
    if (!req.file) {
      return res.status(400).send({ message: "Please upload a file!" });
    }
    req.file.originalname = `${moment().toISOString()}-${req.file.originalname.replace(
      /\s+/g,
      ""
    )}`;

    // Create a new blob in the bucket and upload the file data.
    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("error", (err) => {
      res.status(500).send({ message: err.message });
    });

    blobStream.on("finish", async () => {
      // Create URL for directly file access via HTTP.
      const publicUrl = format(
        `https://storage.googleapis.com/${bucket.name}/${blob.name}`
      );

      try {
        // Make the file public
        await bucket.file(req.file?.originalname as string).makePublic();
      } catch {
        return res.status(500).send({
          message: `Uploaded the file successfully: ${req.file?.originalname}, but public access is denied!`,
          url: publicUrl,
        });
      }

      res.status(200).send({
        message: `Uploaded the file successfully: ${req.file?.originalname}`,
        url: publicUrl,
      });
    });

    blobStream.end(req.file?.buffer);
  } catch (err) {
    res.status(500).send({
      message: `Could not upload the file: ${req.file?.originalname}. ${err}`,
    });
  }
};

export { postImage };
