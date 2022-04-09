import { ICatetinTransaksi, ICatetinTransaksiDetail } from './transaksi';

export interface ICatetinBarang {
  UserId: number;
  createdAt: Date;
  deleted: boolean;
  id: number;
  name: string;
  picture: string;
  price: number;
  stock: number;
  updatedAt: Date;
}

export type ICatetinBarangWithTransaksi = ICatetinBarang & {
  Transactions: (ICatetinTransaksiDetail & ICatetinTransaksi)[];
};
