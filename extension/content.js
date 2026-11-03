let enabled = false
let selectedDays = 90
window.addEventListener('message', (event) => {
  if (event.source !== window || event.origin !== location.origin) return
  if (event.data?.type === 'CIL_ENABLE') { enabled = true; selectedDays = Math.max(1, Number(event.data.days) || 90) }
  if (event.data?.type === 'CIL_DISCONNECT') enabled = false
})
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'CIL_ACTIVATE') { enabled = true; return }
  if (message?.type === 'CIL_GET_PERIOD') { sendResponse({ days: selectedDays }); return }
  if (message?.type !== 'CIL_DELIVER_HISTORY' || !Array.isArray(message.records) || !enabled) return
  window.postMessage({ type: 'CIL_HISTORY_DATA', records: message.records }, location.origin)
})
