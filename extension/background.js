const DASHBOARD = 'https://sydneymoncher-ops.github.io/Consumer-profile/'
async function deliver(tabId, records) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: 'CIL_ACTIVATE' })
    await chrome.tabs.sendMessage(tabId, { type: 'CIL_DELIVER_HISTORY', records })
    return true
  } catch { return false }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'CIL_ANALYZE') return
  ;(async () => {
    if (!(await chrome.permissions.contains({ permissions: ['history'] }))) {
      sendResponse({ ok: false, message: 'History permission is not active.' }); return
    }
    const days = Math.max(1, Math.min(1825, Number(message.days) || 90))
    const records = await chrome.history.search({
      text: '', startTime: Date.now() - days * 86400000, endTime: Date.now(), maxResults: 10000
    })
    let tabs = await chrome.tabs.query({ url: DASHBOARD + '*' })
    tabs = tabs.filter(t => { try { return new URL(t.url).pathname.startsWith('/Consumer-profile/') } catch { return false } })
    let tab = tabs[0]
    if (!tab?.id) {
      tab = await chrome.tabs.create({ url: DASHBOARD })
      const tabId = tab.id
      if (tab.status !== 'complete') await new Promise((resolve, reject) => {
        const timer = setTimeout(() => { chrome.tabs.onUpdated.removeListener(check); reject(new Error('Dashboard load timed out')) }, 20000)
        function finish() { clearTimeout(timer); chrome.tabs.onUpdated.removeListener(check); resolve(undefined) }
        function check(id, info) { if (id === tabId && info.status === 'complete') finish() }
        chrome.tabs.onUpdated.addListener(check)
        chrome.tabs.get(tabId, current => { if (current?.status === 'complete') finish() })
      })
    }
    const webRecords = records.filter(r => /^https?:\/\//i.test(r.url || '')).map(r => ({ url: r.url, title: r.title, lastVisitTime: r.lastVisitTime }))
    const ok = await deliver(tab.id, webRecords)
    sendResponse({ ok, message: ok ? webRecords.length + ' history records transferred to the dashboard tab.' : 'Open or reload the dashboard tab, then try again.' })
  })().catch(() => sendResponse({ ok: false, message: 'History transfer failed. No data was saved by the extension.' }))
  return true
})
