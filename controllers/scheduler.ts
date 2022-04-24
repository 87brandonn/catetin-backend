import { CronJob, CronTime } from "cron";
import { Request, Response } from "express";
import jobs, { setJobs } from "../cron";
import model from "../models";
import { getCronTime } from "../utils";
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
  const currentDate = new Date();
  try {
    let [[data], userData] = await Promise.all([
      Scheduler.upsert({
        id: schedulerId,
        UserId: user_id,
        minute,
        second,
        hour,
        dayOfMonth,
        month,
        dayOfWeek,
        lastTrigger: currentDate,
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
    const schedule = JSON.parse(JSON.stringify(data));

    console.log(
      `${getCronTime(schedule.minute, schedule.minute, "0")} ${getCronTime(
        schedule.hour,
        schedule.hour,
        "0"
      )} ${getCronTime(
        schedule.dayOfMonth,
        schedule.dayOfMonth,
        getCronTime(schedule.month, 1, "*")
      )} ${getCronTime(schedule.month, schedule.month, "*")} ${getCronTime(
        schedule.dayOfWeek,
        schedule.dayOfWeek,
        "*"
      )}`
    );

    if (jobIndex !== -1) {
      jobs[jobIndex].job.stop();
      jobs.splice(jobIndex, 1, {
        id: parseInt(user_id, 10),
        initDate: currentDate.toISOString(),
        job: new CronJob(
          `${getCronTime(schedule.minute, schedule.minute, "0")} ${getCronTime(
            schedule.hour,
            schedule.hour,
            "0"
          )} ${getCronTime(
            schedule.dayOfMonth,
            schedule.dayOfMonth,
            getCronTime(schedule.month, 1, "*")
          )} ${getCronTime(schedule.month, schedule.month, "*")} ${getCronTime(
            schedule.dayOfWeek,
            schedule.dayOfWeek,
            "*"
          )}`,
          async () => {
            try {
              await triggerCron(
                userData.id,
                userData.email,
                userData.Profile?.storeName,
                schedule
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
      jobs[jobIndex].job.start();
    } else {
      jobs.push({
        id: parseInt(user_id, 10),
        initDate: currentDate.toISOString(),
        job: new CronJob(
          `${getCronTime(schedule.minute, schedule.minute, "0")} ${getCronTime(
            schedule.hour,
            schedule.hour,
            "0"
          )} ${getCronTime(
            schedule.dayOfMonth,
            schedule.dayOfMonth,
            getCronTime(schedule.month, 1, "*")
          )} ${getCronTime(schedule.month, schedule.month, "*")} ${getCronTime(
            schedule.dayOfWeek,
            schedule.dayOfWeek,
            "*"
          )}`,
          async () => {
            try {
              await triggerCron(
                userData.id,
                userData.email,
                userData.Profile?.storeName,
                schedule
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
