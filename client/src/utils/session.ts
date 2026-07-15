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
