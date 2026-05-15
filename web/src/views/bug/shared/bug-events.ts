export const BUG_PENDING_COUNT_REFRESH_EVENT = 'bug:pending-count-refresh'

export function dispatchBugPendingCountRefresh() {
  window.dispatchEvent(new CustomEvent(BUG_PENDING_COUNT_REFRESH_EVENT))
}
