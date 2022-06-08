import { ICatetinStore } from "./store";
import IUser, { IProfile } from "./user";

export default interface IScheduler {
  StoreId: number;
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
  Store: ICatetinStore & {
    UserStores: {
      UserId: number;
      StoreId: number;
      grant: "owner" | "employee";
      User: IUser;
    }[];
  };
};
