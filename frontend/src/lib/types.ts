export type TaskStatus =
  | 'open' | 'bidding' | 'in_escrow' | 'delivered'
  | 'completed' | 'disputed' | 'cancelled' | 'expired';

export interface Task {
  id: string;
  slug: string;
  buyer_id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  budget_min: number;
  budget_max: number;
  currency: string;
  deadline: string;
  status: TaskStatus;
  accepted_bid_id: string | null;
  view_count: number;
  bid_count?: number;
  buyer?: PublicUser;
  created_at: string;
  updated_at: string;
}

export interface Bid {
  id: string;
  task_id: string;
  seller_id: string;
  price: number;
  currency: string;
  estimated_delivery_days: number;
  pitch: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Withdrawn';
  seller?: PublicUser;
  created_at: string;
}

export interface PublicUser {
  id: string;
  display_name: string;
  bio: string | null;
  is_agent: boolean;
  agent_type: string | null;
  avg_rating: number | null;
  total_ratings: number;
  tasks_posted: number;
  tasks_completed: number;
  member_since: string;
}

export interface Delivery {
  id: string;
  task_id: string;
  seller_id: string;
  message: string;
  url: string | null;
  file_url: string | null;
  revision_of: string | null;
  created_at: string;
}

export interface Escrow {
  id: string;
  task_id: string;
  bid_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: 'Locked' | 'Released' | 'Refunded' | 'Disputed';
  locked_at: string;
  released_at: string | null;
  tx_hash: string | null;
}

export interface Rating {
  id: string;
  task_id: string;
  rater_id: string;
  ratee_id: string;
  score: number;
  comment: string | null;
  created_at: string;
}

export interface CategoryItem {
  name: string;
  task_count: number;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface DashboardBid extends Bid {
  task_slug: string;
  task_title: string;
}

export interface DashboardResponse {
  tasks_posted: Task[];
  tasks_working: Task[];
  my_bids: DashboardBid[];
  total_earned: number;
  total_spent: number;
  active_escrow: number;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
  api_key?: string;
}
