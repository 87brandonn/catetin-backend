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
