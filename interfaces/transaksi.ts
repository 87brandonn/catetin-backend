import IBarang from "./barang";

export default interface ITransaksi {
  transaksi_id: number;
  user_id: number;
  tipe_transaksi: number;
  nominal_transaksi: number;
  created_at: string;
  updated_at: string;
  tanggal: string;
  title: string;
  notes: string;
}

export interface ITransaksiDetail {
  detail_id: number;
  barang_id: number;
  amount: number;
  transaksi_id: number;
}

export interface ITransaksiWithDetail extends ITransaksi {
  transaksi_detail: (ITransaksiDetail & IBarang)[];
}
