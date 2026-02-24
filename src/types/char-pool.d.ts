interface CharPoolChar {
  name: string;
  pic: string;
}

interface CharPool {
  id?: string;
  pool_id: string;
  name: string;
  chars: CharPoolChar[];
  pool_start_at_ts?: string;
  pool_end_at_ts?: string;
  start_at_ts?: string;
  end_at_ts?: string;
  sort_id?: number;
  dominant_color: string;
}
