import { CronJob } from "cron";
import { ISchedulerUser } from "./interfaces/scheduler";
import { default as models } from "./models";
import moment from "moment";
import { triggerCron } from "./utils/cron";
import { getCronTime } from "./utils";

const { Scheduler, User, Profile, Store, UserStore } = models;

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
                  model: UserStore,
                  where: {
                    grant: "owner",
                  },
                },
              ],
            },
          ],
        })
      )
    );
    data.forEach((schedule) => {
      // schedule.Store?.UserStores.map((data) => {});
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
              await Promise.all(
                schedule.Store?.UserStores.map((data) => {
                  return triggerCron(
                    data.UserId,
                    schedule.Store.id,
                    data.User?.email,
                    schedule.Store.name,
                    schedule
                  );
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
