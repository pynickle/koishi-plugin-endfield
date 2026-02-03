interface CharPoolChar {
  id: string;
  name: string;
  pic: string;
  rarity: string;
}

interface CharPool {
  pool_id: string;
  name: string;
  chars: CharPoolChar[];
  pool_start_at_ts: string;
  pool_end_at_ts: string;
  start_at_ts: string;
  end_at_ts: string;
  sort_id: number;
}
