import { CronJob } from "cron";
import { ISchedulerUser } from "./interfaces/scheduler";
import { default as models } from "./models";
import { triggerCron } from "./utils/cron";

const { Scheduler, User, Profile } = models;

let jobs: { id: number; job: CronJob; initDate: string }[] = [];
const builtDate = new Date().toISOString();

const initJobs = async () => {
  try {
    const data: ISchedulerUser[] = JSON.parse(
      JSON.stringify(
        await Scheduler.findAll({
          include: [
            {
              model: User,
              include: [
                {
                  model: Profile,
                },
              ],
            },
          ],
        })
      )
    );
    data.forEach((schedule) => {
      jobs.push({
        id: schedule.User.id,
        initDate: builtDate,
        job: new CronJob(
          `${schedule.second || "0"} ${schedule.minute || "*"} ${
            schedule.hour || "*"
          } ${schedule.dayOfMonth || "*"} ${schedule.month || "*"} ${
            schedule.dayOfWeek || "*"
          }`,
          async () => {
            try {
              await triggerCron(
                schedule.User.id,
                schedule.User.email,
                schedule.User.Profile?.storeName
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

export default jobs;
export { initJobs };