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
          `${
            schedule.minute || (schedule.dayOfWeek ? "0" : "*")
          } ${schedule.hour || (schedule.dayOfWeek ? "0" : "*")} ${
            schedule.dayOfMonth || (schedule.month ? "1" : "*")
          } ${schedule.month || "*"} ${
            schedule.dayOfWeek || (schedule.dayOfMonth ? "1" : "*")
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

const setJobs = (data: { id: number; job: CronJob; initDate: string }[]) => {
  jobs = data;
};

export default jobs;
export { initJobs, setJobs };
