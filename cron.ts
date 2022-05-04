import { CronJob } from "cron";
import { ISchedulerUser } from "./interfaces/scheduler";
import { default as models } from "./models";
import moment from "moment";
import { triggerCron } from "./utils/cron";
import { getCronTime } from "./utils";

const { Scheduler, User, Profile, Store } = models;

let jobs: { id: number; job: CronJob; initDate: string }[] = [];

const initJobs = async () => {
  try {
    const data: ISchedulerUser[] = JSON.parse(
      JSON.stringify(
        await Scheduler.findAll({
          include: [
            {
              model: Store,
              include: [
                {
                  model: User,
                },
              ],
            },
          ],
        })
      )
    );
    data.forEach((schedule) => {
      jobs.push({
        id: schedule.Store.id,
        initDate: moment(schedule.lastTrigger).toISOString(),
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
                schedule.Store.User.id,
                schedule.Store.id,
                schedule.Store.User.email,
                schedule.Store.name,
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
    });
  } catch (err: any) {
    throw new Error(err);
  }
};

const setJobs = (data: { id: number; job: CronJob; initDate: string }[]) => {
  jobs = data;
};

export default jobs;
export { initJobs, setJobs };
