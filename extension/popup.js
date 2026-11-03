const button = document.getElementById('connect')
const statusEl = document.getElementById('status')
const dashboard = 'https://sydneymoncher-ops.github.io/Consumer-profile/'
chrome.tabs.query({ url: dashboard + '*' }, (tabs) => {
  const tab = tabs.find(t => { try { return new URL(t.url).pathname.startsWith('/Consumer-profile/') } catch { return false } })
  if (tab?.id) chrome.tabs.sendMessage(tab.id, { type: 'CIL_GET_PERIOD' }, (response) => {
    if (response?.days) document.getElementById('days').value = String(response.days)
  })
})
button.addEventListener('click', async () => {
  button.disabled = true
  statusEl.textContent = 'Waiting for Chrome permission…'
  try {
    const approved = await chrome.permissions.request({
      permissions: ['history'],
      origins: []
    })
    if (!approved) { statusEl.textContent = 'Permission was not granted. No history was read.'; button.disabled = false; return }
    const days = Number(document.getElementById('days').value)
    chrome.runtime.sendMessage({ type: 'CIL_ANALYZE', days }, (response) => {
      if (chrome.runtime.lastError) { statusEl.textContent = 'Could not reach the dashboard. Open it and try again.'; button.disabled = false; return }
      statusEl.textContent = response?.message || 'Transfer started.'
      if (response?.ok) button.textContent = 'Transfer sent'
      else button.disabled = false
    })
  } catch (error) {
    statusEl.textContent = 'Could not request permission. Open extension settings and retry.'
    button.disabled = false
  }
})
