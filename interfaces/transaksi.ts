import IBarang from "./barang";

export default interface ITransaksi {
  id: number;
  UserId: number;
  type: number;
  nominal: number;
  createdAt: string;
  updatedAt: string;
  transaction_date: string;
  title: string;
  notes: string;
}

export interface ITransaksiDetail {
  id: number;
  ItemId: number;
  amount: number;
  TransactionId: number;
}

export interface ITransaksiWithDetail extends ITransaksi {
  transaksi_detail: (ITransaksiDetail & IBarang)[];
}
