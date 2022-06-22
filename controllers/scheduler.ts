import { CronJob } from "cron";
import { Request, Response } from "express";
import jobs from "../cron";
import { ICatetinStore } from "../interfaces/store";
import IUser from "../interfaces/user";
import model from "../models";
import { getCronTime } from "../utils";
import { triggerCron } from "../utils/cron";

const { Scheduler, Store, User, UserStore, UserDevice, Device } = model;

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
    let [[data], storeData]: [
      any,
      ICatetinStore & {
        UserStores: {
          UserId: number;
          StoreId: number;
          grant: "owner" | "employee";
          User: IUser & {
            UserDevices: {
              DeviceId: number;
              UserID: number;
              Device: {
                token: string;
                id: number;
              };
            }[];
          };
        }[];
      }
    ] = await Promise.all([
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
            model: UserStore,
            include: {
              model: User,
              include: {
                model: UserDevice,
                include: {
                  model: {
                    Device,
                  },
                },
              },
            },
            where: {
              grant: "owner",
            },
          },
        ],
      }),
    ]);
    storeData = JSON.parse(JSON.stringify(storeData));

    const jobIndex = jobs.findIndex((job) => job.id === parseInt(id, 10));
    const schedule = JSON.parse(JSON.stringify(data));

    const formattedCronTime = `${getCronTime(
      schedule.minute,
      schedule.minute,
      "0"
    )} ${getCronTime(schedule.hour, schedule.hour, "0")} ${getCronTime(
      schedule.dayOfMonth,
      schedule.dayOfMonth,
      getCronTime(schedule.month, 1, "*")
    )} ${getCronTime(schedule.month, schedule.month, "*")} ${getCronTime(
      schedule.dayOfWeek,
      schedule.dayOfWeek,
      "*"
    )}`;

    console.log(formattedCronTime);

    if (jobIndex !== -1) {
      jobs[jobIndex].job.stop();
      jobs.splice(jobIndex, 1, {
        id: parseInt(id, 10),
        initDate: currentDate.toISOString(),
        job: new CronJob(
          formattedCronTime,
          async () => {
            try {
              await Promise.all(
                storeData?.UserStores.map(async (data) => {
                  return await triggerCron(data, schedule);
                })
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
              await Promise.all(
                storeData?.UserStores.map((userStore) => {
                  return triggerCron(userStore, schedule);
                })
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
    console.error(err, "Error adding schedule");
    res.status(400).send({
      message: "An error occured",
    });
  }
};

export { addScheduler, getScheduler };
