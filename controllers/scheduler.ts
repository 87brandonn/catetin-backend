import { CronJob, CronTime } from "cron";
import { Request, Response } from "express";
import jobs from "../cron";
import model from "../models";
import { triggerCron } from "../utils/cron";

const { Scheduler, User, Profile } = model;

const getScheduler = async (req: Request, res: Response) => {
  let user_id = res.locals.jwt.user_id;

  try {
    const data = await Scheduler.findOne({
      where: {
        UserId: user_id,
      },
    });
    res.status(200).send({
      data,
      message: "Succesfully get scheduler data",
    });
  } catch (err) {
    res.status(400).send({
      message: "Bad Request",
    });
  }
};

const addScheduler = async (req: Request, res: Response) => {
  let user_id = res.locals.jwt.user_id;
  const {
    minute,
    second,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
    id: schedulerId,
  } = req.body;
  try {
    let [data, userData] = await Promise.all([
      Scheduler.upsert({
        id: schedulerId,
        UserId: user_id,
        minute,
        second,
        hour,
        dayOfMonth,
        month,
        dayOfWeek,
      }),
      User.findOne({
        where: {
          id: user_id,
        },
        include: [
          {
            model: Profile,
          },
        ],
      }),
    ]);
    userData = JSON.parse(JSON.stringify(userData));

    const jobIndex = jobs.findIndex((job) => job.id === parseInt(user_id, 10));

    console.log(jobs, "Current job");
    console.log(jobIndex, "Job index when inserted.");

    if (jobIndex === -1) {
      jobs.push({
        id: parseInt(user_id, 10),
        initDate: new Date().toISOString(),
        job: new CronJob(
          `${second || "0"} ${minute || "*"} ${hour || "*"} ${
            dayOfMonth || "*"
          } ${month || "*"} ${dayOfWeek || "*"}`,
          async () => {
            try {
              await triggerCron(
                userData.id,
                userData.email,
                userData.Profile?.storeName
              );
            } catch (err) {
              console.error(err);
            }
          },
          null,
          true,
          "Asia/Jakarta"
        ),
      });
    } else {
      jobs[jobIndex].job.stop();
      jobs[jobIndex].job.setTime(
        new CronTime(
          `${second || "0"} ${minute || "*"} ${hour || "*"} ${
            dayOfMonth || "*"
          } ${month || "*"} ${dayOfWeek || "*"}`
        )
      );
      jobs[jobIndex].job.start();
    }

    res.status(200).send({
      data,
      message: "Succesfully insert scheduler",
    });
  } catch (err) {
    res.status(400).send({
      message: "An error occured",
    });
  }
};

export { addScheduler, getScheduler };
