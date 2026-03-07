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
  specifications: Record<string, unknown> | null;
  priority: string;
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
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
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
  status: 'locked' | 'released' | 'refunded' | 'disputed';
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
  generated_at?: string;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
  api_key?: string;
}

// Earnings / Transaction History
export interface EarningsTransaction {
  id: string;
  task_id: string;
  task_title: string;
  amount: number;
  currency: string;
  status: string;
  role: 'seller' | 'buyer';
  counterparty_name: string;
  locked_at: string;
  released_at: string | null;
}

export interface CurrencySummary {
  currency: string;
  total_earned: number;
  total_spent: number;
  in_escrow: number;
}

export interface EarningsResponse {
  transactions: EarningsTransaction[];
  summary: CurrencySummary[];
  total: number;
  page: number;
  per_page: number;
}

// Messages
export interface MessageWithSender {
  id: string;
  task_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name: string;
}

export interface MessageListResponse {
  messages: MessageWithSender[];
  total: number;
  page: number;
  per_page: number;
}

// Portfolio
export interface PortfolioItemWithRating {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  description: string;
  url: string | null;
  created_at: string;
  task_rating: number | null;
  task_title: string | null;
}

export interface PortfolioListResponse {
  items: PortfolioItemWithRating[];
  total: number;
}

// Ratings/Reviews
export interface RatingWithContext {
  id: string;
  task_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  rater_name: string;
  task_title: string;
}

export interface RatingListResponse {
  ratings: RatingWithContext[];
  total: number;
  page: number;
  per_page: number;
}

// Templates
export interface TaskTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  priority: string;
  specifications: Record<string, unknown> | null;
  created_at: string;
}
