export default interface IBarang {
  barang_id: number;
  user_id: number;
  stok: number;
  nama_barang: string;
  created_at: string;
  updated_at: string;
}

export interface IBarangPayload extends IBarang {
  amount: number;
}
