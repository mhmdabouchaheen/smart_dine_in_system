const TABLE_STORAGE_KEY = 'current_table_id'

export const getCurrentTableId = (): string | null => {
  const params = new URLSearchParams(window.location.search)
  const tableFromUrl = params.get('table') || params.get('tableId')

  if (tableFromUrl) {
    localStorage.setItem(TABLE_STORAGE_KEY, tableFromUrl)
    return tableFromUrl
  }

  return localStorage.getItem(TABLE_STORAGE_KEY)
}

export const setCurrentTableId = (tableId: string | number): void => {
  localStorage.setItem(TABLE_STORAGE_KEY, String(tableId))
}

export const clearCurrentTableId = (): void => {
  localStorage.removeItem(TABLE_STORAGE_KEY)
}

// ---------------------------------------------------------------------------
// QR vs Reservation session flag
// A QR session = customer physically scanned the table's QR code.
// A reservation session = customer booked ahead and navigated via the website.
// Only QR sessions may use "Pay at table" (staff-assisted payment).
// ---------------------------------------------------------------------------
const QR_SESSION_KEY = 'noir_sel_is_qr_session'

export const getIsQrSession = (): boolean => {
  return localStorage.getItem(QR_SESSION_KEY) === 'true'
}

export const setIsQrSession = (value: boolean): void => {
  localStorage.setItem(QR_SESSION_KEY, String(value))
}

export const clearIsQrSession = (): void => {
  localStorage.removeItem(QR_SESSION_KEY)
}

const GUEST_SESSION_KEY = 'noir_sel_guest_session_id'

export const getGuestSessionId = (): string => {
  let sessionId = localStorage.getItem(GUEST_SESSION_KEY)
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    localStorage.setItem(GUEST_SESSION_KEY, sessionId)
  }
  return sessionId
}
