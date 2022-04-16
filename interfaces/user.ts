export default interface IUser {
  id: number;
  username: string;
  password: string;
  email: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfile {
  id: number;
  storeName: string;
  displayName: string;
  profilePicture: string;
  UserId: number;
  createdAt: Date;
  updatedAt: Date;
}
