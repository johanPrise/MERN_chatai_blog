export type ActionStatus = "idle" | "loading" | "success" | "error"

export interface ActionState {
  status: ActionStatus
  error: string | null
}

export interface CommentActionStates {
  [commentId: string]: ActionState
}