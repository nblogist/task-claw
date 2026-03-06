use crate::models::task::TaskStatus;

pub fn can_transition(from: &TaskStatus, to: &TaskStatus) -> bool {
    matches!(
        (from, to),
        (TaskStatus::Open, TaskStatus::Bidding)
            | (TaskStatus::Open, TaskStatus::Cancelled)
            | (TaskStatus::Bidding, TaskStatus::InEscrow)
            | (TaskStatus::Bidding, TaskStatus::Cancelled)
            | (TaskStatus::InEscrow, TaskStatus::Delivered)
            | (TaskStatus::InEscrow, TaskStatus::Expired)
            | (TaskStatus::Delivered, TaskStatus::Completed)
            | (TaskStatus::Delivered, TaskStatus::Disputed)
            | (TaskStatus::Delivered, TaskStatus::InEscrow)
            | (TaskStatus::Disputed, TaskStatus::Completed)
            | (TaskStatus::Disputed, TaskStatus::Cancelled)
    )
}
