import { describe, expect, it } from 'vitest'
import { infer, parseFiles, recommendations } from './analysis'
import type { RecordItem } from './types'

describe('local consumer analysis', () => {
  it('infers topic labels from supplied URL and title evidence', () => {
    const records: RecordItem[] = [
      { id: 'fixture-1', source: 'test-only fixture', title: 'Laptop reviews', url: 'https://example.test/reviews', domain: 'example.test', kind: 'visit', text: 'Laptop reviews' },
      { id: 'fixture-2', source: 'test-only fixture', title: 'Camera guide', url: 'https://sample.test/camera', domain: 'sample.test', kind: 'visit', text: 'Camera guide' },
    ]
    const result = infer(records)
    expect(result.interests.map(x => x.label)).toContain('Technology')
    expect(result.uniqueDomains).toBe(2)
  })

  it('labels a known brand only when it appears in supplied evidence', () => {
    const result = infer([{ id: 'fixture-brand', source: 'test-only fixture', title: 'Camera guide', url: 'https://www.sony.com/camera', domain: 'sony.com', kind: 'visit', text: 'Camera guide' }])
    expect(result.brands.map(x => x.label)).toContain('Sony')
  })

  it('omits sensitive signals from extracted records', async () => {
    const file = new File([JSON.stringify([
      { title: 'Health diagnosis information', url: 'https://example.test/health' },
      { title: 'Camera reviews', url: 'https://example.test/camera' },
    ])], 'history.json', { type: 'application/json' })
    const records = await parseFiles([file])
    expect(records.map(x => x.title)).toEqual(['Camera reviews'])
    expect(infer(records).interests.some(x => /health/i.test(x.label))).toBe(false)
  })

  it('parses nested Google Takeout history and converts microsecond timestamps', async () => {
    const time = 1_735_689_600_000_000
    const file = new File([JSON.stringify({ 'Browser History': [
      { title: 'Camera buying guide', url: 'https://example.test/camera', time_usec: time },
    ] })], 'Takeout History.json', { type: 'application/json' })
    const records = await parseFiles([file])
    expect(records).toHaveLength(1)
    expect(records[0].source).toBe('Google Takeout')
    expect(records[0].date?.getUTCFullYear()).toBe(2025)
  })

  it('uses user-authored ChatGPT messages and removes common quoted blocks', async () => {
    const file = new File([JSON.stringify([{ mapping: {
      a: { message: { author: { role: 'user' }, content: { parts: ['I like cameras. “assistant quote”', '> quoted line'] } } },
      b: { message: { author: { role: 'assistant' }, content: { parts: ['I recommend a camera.'] } } },
    } }])], 'conversations.json', { type: 'application/json' })
    const records = await parseFiles([file])
    expect(records).toHaveLength(1)
    expect(records[0].text).toContain('I like cameras.')
    expect(records[0].text).not.toContain('assistant quote')
    expect(records[0].text).not.toContain('quoted line')
  })

  it('scores only supplied products from overlapping interest labels', () => {
    const records: RecordItem[] = [{ id: 'fixture-3', source: 'test-only fixture', title: 'Running shoe reviews', url: 'https://example.test/shoes', domain: 'example.test', kind: 'visit', text: 'Running shoe reviews' }]
    const products = [{ name: 'Trail shoe', url: 'https://shop.example/item', category: 'Books', source: 'test-only fixture' }]
    expect(recommendations(records, products)).toEqual([])
    const matching = [{ name: 'Outdoor hiking pack', url: 'https://shop.example/pack', category: 'Outdoors', source: 'test-only fixture' }]
    expect(recommendations([{ ...records[0], text: 'Hiking trails and outdoor gear' }], matching)[0]?.score).toBeGreaterThan(0)
  })
})
