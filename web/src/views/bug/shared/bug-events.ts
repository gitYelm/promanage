export const BUG_PENDING_COUNT_REFRESH_EVENT = 'bug:pending-count-refresh'
export const BUG_LIST_STALE_EVENT = 'bug:list-stale'
export const BUG_TICKET_OPEN_EVENT = 'bug:ticket-open'

export interface BugTicketOpenEventDetail {
  ticketId: string
}

export function dispatchBugPendingCountRefresh() {
  window.dispatchEvent(new CustomEvent(BUG_PENDING_COUNT_REFRESH_EVENT))
}

export function dispatchBugListStale() {
  window.dispatchEvent(new CustomEvent(BUG_LIST_STALE_EVENT))
}

export function dispatchBugTicketOpen(ticketId: string) {
  window.dispatchEvent(new CustomEvent<BugTicketOpenEventDetail>(BUG_TICKET_OPEN_EVENT, { detail: { ticketId } }))
}
