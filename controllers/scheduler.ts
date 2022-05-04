import { CronJob, CronTime } from "cron";
import { Request, Response } from "express";
import jobs, { setJobs } from "../cron";
import model from "../models";
import { getCronTime } from "../utils";
import { triggerCron } from "../utils/cron";

const { Scheduler, Store, User, Profile } = model;

const getScheduler = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const data = await Scheduler.findOne({
      where: {
        StoreId: id,
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
  const { id } = req.params;
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
    let [[data], storeData] = await Promise.all([
      Scheduler.upsert({
        id: schedulerId,
        StoreId: id,
        minute,
        second,
        hour,
        dayOfMonth,
        month,
        dayOfWeek,
        lastTrigger: currentDate,
      }),
      Store.findOne({
        where: {
          id,
        },
        include: [
          {
            model: User,
          },
        ],
      }),
    ]);
    storeData = JSON.parse(JSON.stringify(storeData));

    const jobIndex = jobs.findIndex((job) => job.id === parseInt(id, 10));
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
        id: parseInt(id, 10),
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
                storeData.User.id,
                storeData.id,
                storeData.User.email,
                storeData.name,
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
        id: parseInt(id, 10),
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
                storeData.User.id,
                storeData.id,
                storeData.User.email,
                storeData.name,
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
