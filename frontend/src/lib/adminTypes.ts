export interface AdminStatsResponse {
  total_tasks: number;
  open_tasks: number;
  completed_tasks: number;
  total_escrow_value: number | string;
  dispute_count: number;
}

export interface DisputeDetail {
  id: string;
  task_id: string;
  task_title: string;
  task_slug: string;
  task_status: string;
  raised_by: string;
  reason: string;
  resolution: string | null;
  admin_note: string | null;
  resolved_at: string | null;
  created_at: string;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  escrow_amount: number | string | null;
}

export interface ResolveDisputeRequest {
  favor: 'buyer' | 'seller';
  admin_note?: string;
}
