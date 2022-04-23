import IUser, { IProfile } from "./user";

export default interface IScheduler {
  UserId: number;
  createdAt: Date;
  updatedAt: Date;
  id: number;
  second: number;
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
  lastTrigger: Date;
}

export type ISchedulerUser = IScheduler & {
  User: IUser & {
    Profile: IProfile;
  };
};
