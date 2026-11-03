import type { Interest, Product, RecordItem } from './types'

const TERMS: Record<string, string[]> = {
  Technology: ['technology','tech','computer','laptop','phone','software','gadget','electronics','camera','gaming'],
  Style: ['fashion','clothing','shoes','style','beauty','skincare','makeup','apparel','sneaker'],
  Home: ['home','furniture','decor','kitchen','garden','appliance','bed','lighting'],
  Travel: ['travel','hotel','flight','trip','airline','vacation','destination'],
  Food: ['food','recipe','restaurant','coffee','grocery','cooking','meal'],
  Outdoors: ['outdoor','hiking','camping','running','fitness','bike','sports','trail'],
  Books: ['book','reading','author','novel','library','kindle'],
  Entertainment: ['movie','music','streaming','concert','tv','film','show'],
  'Personal finance': ['budget','investing','banking','credit card','savings','finance'],
}
const BRANDS = ['Adidas','Amazon','Apple','Best Buy','Canon','Costco','Dell','Etsy','Google','IKEA','LEGO','Microsoft','Nike','Patagonia','Samsung','Sephora','Sony','Starbucks','Target','Walmart']
const SENSITIVE = /\b(medical|health condition|diagnos\w*|religio\w*|church|mosque|synagogue|temple|bible|quran|torah|christian|catholic|muslim|islam|hindu|buddhis\w*|jewish|politic\w*|election|vote|sexual orientation|sexuality|gay|lesbian|transgender|dating profile)\b/i
const safeText = (s: string) => SENSITIVE.test(s) ? '' : s

function domainOf(url?: string) {
  try { return new URL(url!).hostname.replace(/^www\./,'') } catch { return undefined }
}
function isoDate(v: unknown): Date | undefined {
  if (typeof v === 'number') { const d = new Date(v > 1e14 ? v / 1000 : v > 1e12 ? v : v * 1000); return isNaN(+d) ? undefined : d }
  if (typeof v === 'string' && v) { const d = new Date(v); return isNaN(+d) ? undefined : d }
}
function asRecords(input: unknown, source: string): RecordItem[] {
  const isRow = (v: any) => v && typeof v === 'object' && !Array.isArray(v) && ('url' in v || 'URL' in v || 'product_url' in v || 'title' in v || 'name' in v || 'product_name' in v)
  const flatten = (v: any): any[] => Array.isArray(v) ? v.flatMap(x => isRow(x) ? [x] : flatten(x)) : isRow(v) ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(flatten) : []
  const arr = flatten(input)
  const out: RecordItem[] = []
  for (const [i, item] of arr.entries()) {
    if (!item || typeof item !== 'object') continue
    const x = item as Record<string,any>
    const candidate = typeof x.url === 'string' ? x.url : typeof x.URL === 'string' ? x.URL : typeof x.product_url === 'string' ? x.product_url : undefined
    const url = candidate && /^https?:\/\//i.test(candidate) ? candidate : undefined
    const title = String(x.title ?? x.name ?? x.product_name ?? '')
    const date = isoDate(x.lastVisitTime ?? x.time_usec ?? x.time ?? x.date ?? x.timestamp ?? x.purchaseDate)
    const text = safeText([title, url ?? '', x.text ?? ''].join(' ').trim())
    if (!text) continue
    out.push({ id: source + '-' + i, source, title: title || domainOf(url) || 'Imported record', url, domain: domainOf(url), date, kind: source === 'orders' ? 'order' : source === 'catalog' ? 'product' : 'visit', text, category: typeof x.category === 'string' ? x.category : undefined, price: typeof (x.price ?? x.amount) === 'string' || typeof (x.price ?? x.amount) === 'number' ? String(x.price ?? x.amount) : undefined, image: typeof (x.image ?? x.image_url) === 'string' ? (x.image ?? x.image_url) : undefined })
  }
  return out
}
function chatRecords(data: any): RecordItem[] {
  const items: RecordItem[] = []
  const conversations = Array.isArray(data) ? data : [data]
  conversations.forEach((conv: any, ci: number) => {
    const messages = conv?.messages ?? Object.values(conv?.mapping ?? {}).map((v:any)=>v?.message).filter(Boolean)
    for (const [mi, msg] of messages.entries()) {
      const role = msg?.author?.role ?? msg?.role
      if (role !== 'user') continue
      const content = msg?.content
      const parts = Array.isArray(content?.parts) ? content.parts : Array.isArray(content) ? content : [content?.text ?? content]
      const text = safeText(parts.filter((p:any)=>typeof p==='string'&&!p.trimStart().startsWith('>')).join(' ').replace(/^\s*>.*$/gm,'').replace(/“[^”]*”|"[^"]*"/gs,' [quoted text omitted] ').slice(0,5000))
      if (text) items.push({id:`chat-${ci}-${mi}`,source:'ChatGPT export',title:'User statement',date:isoDate(msg.create_time ?? msg.timestamp),kind:'statement',text})
    }
  })
  return items
}
function csvRows(text: string): Record<string,string>[] {
  const rows: string[][]=[]; let row:string[]=[]; let cell=''; let quoted=false
  for(let i=0;i<text.length;i++){const c=text[i]; if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++} else if(c==='"')quoted=!quoted; else if(c===','&&!quoted){row.push(cell);cell=''} else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell=''} else cell+=c}
  row.push(cell);if(row.some(Boolean))rows.push(row)
  const headers=(rows.shift()??[]).map(x=>x.trim().toLowerCase())
  return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??''])))
}
export function parseFiles(files: File[]): Promise<RecordItem[]> {
  return Promise.all(files.map(async file => {
    const raw=await file.text(); const ext=file.name.split('.').pop()?.toLowerCase()
    let source = /conversations?/i.test(file.name) ? 'ChatGPT export' : /order|purchase/i.test(file.name) ? 'orders' : /catalog|product/i.test(file.name) ? 'catalog' : /history|takeout/i.test(file.name) ? 'Google Takeout' : 'CSV/JSON import'
    if(ext==='csv') return asRecords(csvRows(raw), source)
    try {const data=JSON.parse(raw); if(source==='ChatGPT export')return chatRecords(data); return asRecords(data,source)} catch {return []}
  })).then(groups=>groups.flat())
}
export function infer(records: RecordItem[]) {
  const visits=records.filter(r=>r.kind==='visit')
  const domains=new Map<string,number>()
  visits.forEach(r=>{if(r.domain)domains.set(r.domain,(domains.get(r.domain)??0)+1)})
  const words=new Map<string,Set<string>>()
  for(const r of records) for(const [category,terms] of Object.entries(TERMS)) if(terms.some(t=>r.text.toLowerCase().includes(t))) {
    if(!words.has(category))words.set(category,new Set()); words.get(category)!.add(r.id)
  }
  const brands: Interest[]=BRANDS.map(label=>{const matching=records.filter(r=>(r.domain+' '+r.title+' '+r.text).toLowerCase().includes(label.toLowerCase()));return {label,count:matching.length,evidence:matching.slice(0,4).map(r=>r.title),confidence:Math.min(.94,.55+matching.length*.08)}}).filter(b=>b.count>0).sort((a,b)=>b.count-a.count)
  const interests: Interest[]=Array.from(words,([label,ids])=>({label,count:ids.size,evidence:records.filter(r=>ids.has(r.id)).slice(0,4).map(r=>r.title),confidence:Math.min(.94,.48+ids.size*.08)})).sort((a,b)=>b.count-a.count)
  const byHour=new Array(24).fill(0),byWeekHour=Array.from({length:7},()=>new Array(24).fill(0)); visits.forEach(r=>{if(r.date){byHour[r.date.getHours()]++;byWeekHour[r.date.getDay()][r.date.getHours()]++}})
  const dated=visits.filter(r=>r.date).sort((a,b)=>+a.date!-+b.date!)
  const shopping=records.filter(r=>(r.kind==='visit'||r.kind==='order')&&/amazon|walmart|target|bestbuy|etsy|ebay|shop|store|product|price/i.test((r.domain??'')+' '+r.title+' '+r.text))
  const priceComparisons=visits.filter(r=>/price|compare|review|vs\.?\s|best .* under|alternative/i.test(r.text))
  const uniqueDomains=domains.size, repetition=visits.length ? visits.length / Math.max(uniqueDomains,1) : 0
  const peak=byHour.indexOf(Math.max(...byHour))
  return {visits,domains,interests,brands,byHour,byWeekHour,dated,shopping,priceComparisons,uniqueDomains,repetition,peak}
}
export function recommendations(records: RecordItem[], products: Product[]) {
 const profile=infer(records)
 return products.map(p=>{const productTerms=((p.category??'')+' '+p.name).toLowerCase().split(/\s+/).map(w=>w.replace(/s$/,''));const match=(items:Interest[])=>items.filter(i=>productTerms.some(w=>w.length>3&&(i.label.toLowerCase().includes(w)||w.includes(i.label.toLowerCase().replace(/s$/,'')))));const topics=match(profile.interests),brands=match(profile.brands),related=[...topics,...brands].reduce((sum,i)=>sum+i.count,0);return {...p,matches:[...brands.map(x=>x.label),...topics.map(x=>x.label)],score:Math.min(99,Math.round(related*14))}}).filter(p=>p.score>0).sort((a,b)=>b.score-a.score)
}
