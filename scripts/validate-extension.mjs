import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const manifest = JSON.parse(readFileSync(new URL('../extension/manifest.json', import.meta.url)))
const popup = readFileSync(new URL('../extension/popup.js', import.meta.url), 'utf8')
const background = readFileSync(new URL('../extension/background.js', import.meta.url), 'utf8')
const content = readFileSync(new URL('../extension/content.js', import.meta.url), 'utf8')

assert.equal(manifest.manifest_version, 3)
assert.deepEqual(manifest.optional_permissions, ['history'])
assert.deepEqual(manifest.permissions, [])
assert.deepEqual(manifest.host_permissions, ['https://sydneymoncher-ops.github.io/*'])
assert.deepEqual(manifest.content_scripts[0].matches, ['https://sydneymoncher-ops.github.io/Consumer-profile/*'])
assert.match(popup, /addEventListener\('click'/)
assert.match(popup, /permissions\.request\(\{\s*permissions: \['history'\]/)
assert.match(background, /message\?\.type !== 'CIL_ANALYZE'/)
assert.match(background, /chrome\.history\.search\(/)
assert.match(background, /Consumer-profile\//)
assert.match(background, /https\?:/)
assert.match(content, /message\?\.type !== 'CIL_DELIVER_HISTORY'/)
assert.match(content, /CIL_DISCONNECT/)
assert.doesNotMatch(manifest.permissions.join(' '), /cookies|webRequest|tabs|storage/)
assert.doesNotMatch(popup + background + content, /chrome\.cookies|chrome\.storage|fetch\(|XMLHttpRequest/)

console.log('Extension static checks passed: MV3, history-only optional permission, fixed dashboard origin/path, explicit user action, HTTP(S)-only transfer, disconnect handler, and no storage or network API.')
console.log('This is static validation; real Chrome installation, permission prompt, and transfer remain untested.')
