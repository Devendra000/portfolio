// Turns OCR text from a screenshot (application page, notice, admit card) into
// tracker fields with plain pattern matching — no AI. Handles the Nepali labels
// used by NRB / PSC / bank portals plus common English ones. Anything it can't
// find is simply left out; the user reviews the form before saving.

import type { Organization, PaymentStatus, Status } from './schema'

export type Extracted = {
  organization?: Organization
  position?: string
  level?: string
  advertisementNo?: string
  rollNumber?: string
  status?: Status
  appliedDate?: string
  deadline?: string
  examDate?: string
  fee?: number
  paymentStatus?: PaymentStatus
  paidAmount?: number
  paidDate?: string
  paymentMethod?: string
  voucherNumber?: string
  link?: string
  notes?: string
}

const DEVANAGARI_DIGITS = '०१२३४५६७८९'
const toAscii = (s: string) => s.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)))

const ORG_PATTERNS: [Organization, RegExp][] = [
  ['NRB', /nrb\.org\.np|rastra\s*bank|राष्ट्र\s*बैंक/i],
  ['PSC', /psc\.gov\.np|lok\s*sewa|public\s*service\s*commission|लोक\s*सेवा/i],
  ['RBB', /rbb\.com\.np|rastriya\s*banijya|राष्ट्रिय\s*वाणिज्य/i],
  ['ADBL', /adbl|agricultural\s*development\s*bank|कृषि\s*विकास\s*बैंक/i],
  ['NBL', /nepal\s*bank\s*l|nbl\.com\.np|नेपाल\s*बैंक/i],
  ['NTC', /ntc\.net\.np|nepal\s*telecom|नेपाल\s*टेलिकम/i],
  ['NEA', /nea\.org\.np|electricity\s*authority|विद्युत\s*प्राधिकरण/i],
]

// Common post titles → English. Longest phrases first so "सहायक निर्देशक"
// wins over "सहायक". Unknown words stay in Nepali.
const TERMS: [string, string][] = [
  ['सहायक निर्देशक', 'Assistant Director'],
  ['उप निर्देशक', 'Deputy Director'],
  ['उपनिर्देशक', 'Deputy Director'],
  ['निर्देशक', 'Director'],
  ['सहायक प्रबन्धक', 'Assistant Manager'],
  ['प्रबन्धक', 'Manager'],
  ['अधिकृत', 'Officer'],
  ['सहायक', 'Assistant'],
  ['सूचना प्रविधि', 'Information Technology'],
  ['कम्प्युटर इन्जिनियर', 'Computer Engineer'],
  ['कम्प्युटर', 'Computer'],
  ['इन्जिनियर', 'Engineer'],
  ['प्रशासन', 'Administration'],
  ['लेखा', 'Accounts'],
  ['कानून', 'Law'],
  ['नेपाल', 'Nepal'],
  ['विविध', 'Miscellaneous'],
  ['इन्जिनियरिङ', 'Engineering'],
  ['न्याय', 'Judicial'],
  ['परराष्ट्र', 'Foreign Affairs'],
  ['शिक्षा', 'Education'],
  ['स्वास्थ्य', 'Health'],
  ['सेवा', 'Service'],
]
const translatePost = (s: string) => TERMS.reduce((acc, [np, en]) => acc.split(np).join(en), s).replace(/\s+/g, ' ').trim()

const pad = (n: string) => n.padStart(2, '0')

/** "17/11/2026", "17-11-2026", "2026-11-17", "2026/11/17" → "2026-11-17". Nepal writes day first. */
function parseAdDate(raw: string): string | undefined {
  const s = toAscii(raw)
  let m = s.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (m && +m[1] < 2050) return valid(m[1], m[2], m[3]) // 2083/08/01 is Bikram Sambat — skip
  m = s.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/)
  if (m && +m[3] < 2050) return +m[2] > 12 ? valid(m[3], m[1], m[2]) : valid(m[3], m[2], m[1])
  return undefined
}
function valid(y: string, mo: string, d: string) {
  const iso = `${y}-${pad(mo)}-${pad(d)}`
  const t = new Date(`${iso}T00:00:00Z`)
  return !Number.isNaN(t.getTime()) && t.toISOString().startsWith(iso) ? iso : undefined
}

/** First AD date found within `window` chars after any of the labels. */
function dateAfter(text: string, labels: RegExp, window = 60): string | undefined {
  for (const m of text.matchAll(new RegExp(labels.source, 'gi'))) {
    const d = parseAdDate(text.slice(m.index! + m[0].length, m.index! + m[0].length + window))
    if (d) return d
  }
  return undefined
}

const amount = (s: string | undefined) => (s ? Number(s.replace(/,/g, '')) : undefined)

export function extractFromText(raw: string): Extracted {
  const text = raw.replace(/[ \t]+/g, ' ')
  const ascii = toAscii(text)
  const out: Extracted = {}

  out.organization = ORG_PATTERNS.find(([, re]) => re.test(text))?.[0]

  // Position — "पद : सहायक निर्देशक (सूचना प्रविधि)" or "Post: Assistant"
  const post =
    text.match(/(?:^|\s)पद\s*[:：]\s*(.+?)(?=\s+(?:विज्ञापन|बिज्ञापन|तह|श्रेणी)|\n|$)/m)?.[1] ??
    text.match(/\b(?:Post|Position|Designation)\s*(?:Name)?\s*[:：]\s*(.+?)(?=\s{2,}|\s+Adv|\n|$)/im)?.[1]
  if (post) out.position = translatePost(post).slice(0, 200)

  // Level — "Officer Level 6", "छैठौं तह", "Level: 7th"
  const level =
    text.match(/\b(?:Level|तह)\s*[:：]?\s*([\w०-९]+(?:st|nd|rd|th)?)/i)?.[0] ??
    text.match(/([^\s:]+)\s+तह\b/)?.[0]
  if (level) out.level = toAscii(level).trim()

  // Advertisement no. — "विज्ञापन नं.: १४/२०८३", "Adv. No: 12/082-83"
  const adv =
    ascii.match(/(?:विज्ञापन|बिज्ञापन)\s*न[ंं]?\.?\s*[:：]?\s*(\d+\s*\/\s*[\d-]+)/)?.[1] ??
    ascii.match(/\bAdv(?:ertisement)?\.?\s*(?:No|Number)\.?\s*[:：]?\s*(\d+\s*\/\s*[\d-]+)/i)?.[1]
  if (adv) out.advertisementNo = adv.replace(/\s+/g, '')

  // Roll number (admit card)
  const roll = ascii.match(/(?:रोल\s*न[ंं]?\.?|Roll\s*(?:No|Number)\.?)\s*[:：]?\s*([A-Z0-9-]+)/i)?.[1]
  if (roll) out.rollNumber = roll

  // Dates
  out.appliedDate = dateAfter(text, /पेश\s*गरेको\s*मिति|आवेदन\s*मिति|Appl(?:ied|ication)\s*(?:on|Date)|Submitted\s*(?:on|Date)/)
  out.examDate = dateAfter(text, /परीक्षा\s*(?:को\s*)?मिति|Exam(?:ination)?\s*Date|Date\s*of\s*Exam/)
  out.deadline = dateAfter(text, /अन्तिम\s*(?:म्याद|मिति)|Last\s*Date|Deadline|Closing\s*Date/)
  if (!out.appliedDate) out.appliedDate = dateAfter(text, /भुक्तानी\s*मिति|Payment\s*Date/)

  // Fee — "परीक्षा दस्तुर 1000.00", "Exam Fee: Rs. 1,000"
  out.fee = amount(
    ascii.match(/परीक्षा\s*दस्तुर\s*[:：]?\s*(?:रु\.?|Rs\.?|NPR)?\s*([\d,]+(?:\.\d+)?)/i)?.[1] ??
      ascii.match(/\b(?:Exam(?:ination)?\s*)?Fee\s*(?:Amount)?\s*[:：]?\s*(?:Rs\.?|NPR)?\s*([\d,]+(?:\.\d+)?)/i)?.[1],
  )

  // Payment — "भुक्तानीको अवस्था Paid", "Payment Status: Unpaid", "भुक्तान गरिएको रकम 1000.00"
  const payState = text.match(/(?:भुक्तानीको\s*अवस्था|Payment\s*Status)\s*[:：]?\s*(Unpaid|Paid|Pending|भुक्तानी\s*भएको|भुक्तानी\s*नभएको)/i)?.[1]
  if (payState) out.paymentStatus = /^(paid|भुक्तानी\s*भएको)$/i.test(payState) ? 'paid' : 'unpaid'
  out.paidAmount = amount(
    ascii.match(/भुक्तान\s*गरिएको\s*रकम\s*[:：]?\s*([\d,]+(?:\.\d+)?)/)?.[1] ??
      ascii.match(/(?:भुक्तानी\s*रकम|Paid\s*Amount|Amount\s*Paid)\s*[:：]?\s*(?:Rs\.?|NPR)?\s*([\d,]+(?:\.\d+)?)/i)?.[1],
  )
  if (out.paidAmount === 0 && out.paymentStatus !== 'paid') delete out.paidAmount
  if (out.paidAmount && !out.paymentStatus) out.paymentStatus = 'paid'
  out.paidDate = dateAfter(text, /भुक्तानी\s*मिति|Payment\s*Date|Paid\s*(?:on|Date)/)
  out.paymentMethod =
    text.match(/भुक्तानी\s*स्रोत\s*[:：]?\s*([A-Za-z][A-Za-z ]{1,20}?)(?=\s+[^\x00-\x7F]|\s*$|\n)/m)?.[1]?.trim() ??
    text.match(/\b(Khalti|eSewa|ConnectIPS|IME\s*Pay|Fonepay)\b/i)?.[1]

  // Voucher / transaction number — NRB "भुक्तानी भाउचर वा लेनदेन नम्बर वा नाम 07wEny…",
  // Khalti/eSewa/ConnectIPS receipts "Transaction ID / Reference Code", bank "Voucher No."
  const voucher = text.match(
    /(?:(?:भाउचर|लेनदेन)[^\n:]*?(?:नम्बर|नं\.?)(?:\s*वा\s*नाम)?|Voucher\s*(?:No|Number)\.?|Transaction\s*(?:ID|Code|No\.?|Number)|Txn\.?\s*(?:ID|No\.?)|Reference\s*(?:Code|ID|No\.?|Number)|Ref\.?\s*No\.?)\s*[:：#]?\s*([A-Za-z0-9][A-Za-z0-9-]{3,39})\b/i,
  )?.[1]
  if (voucher && /\d/.test(voucher)) out.voucherNumber = voucher

  // Status: roll number means admit card is out; a submitted/paid form means applied.
  if (out.rollNumber) out.status = 'admit_card'
  else if (/Submitted|पेश\s*गरेको/i.test(text) || out.paymentStatus === 'paid') out.status = 'applied'

  // Extra references worth keeping → notes
  const notes: string[] = []
  const appId = ascii.match(/आवेदन\s*आ[ईइ]डी\s*[:：]?\s*(\d+)/)?.[1] ?? ascii.match(/ApplicationID=(\d+)/i)?.[1]
  const candId = ascii.match(/उम्मेदवार\s*आ[ईइ]डी\s*[:：]?\s*(\d+)/)?.[1] ?? ascii.match(/Candidate\s*ID\s*[:：]?\s*(\d+)/i)?.[1]
  const group = text.match(/समावेसी\s*समूह\s*[:：]?\s*([^\s|]+)/)?.[1]
  if (appId) notes.push(`Application ID: ${appId}`)
  if (candId) notes.push(`Candidate ID: ${candId}`)
  const GROUPS: Record<string, string> = { 'खुला': 'Open', 'महिला': 'Women', 'दलित': 'Dalit', 'मधेशी': 'Madhesi', 'आदिवासी': 'Adibasi Janajati', 'अपाङ्ग': 'Disabled', 'पिछडिएको': 'Backward area' }
  if (group) notes.push(`Group: ${GROUPS[group] ?? group}`)
  if (notes.length) out.notes = notes.join(' · ')

  // Portal link if the address bar made it into the screenshot
  const host = text.match(/\b((?:jobs\.)?(?:nrb\.org\.np|psc\.gov\.np|rbb\.com\.np|nea\.org\.np|ntc\.net\.np|adbl\.gov\.np))\b/i)?.[1]
  if (/psconline/i.test(text)) out.link = 'https://psconline1.psc.gov.np'
  else if (host) out.link = `https://${host.toLowerCase()}`

  for (const k of Object.keys(out) as (keyof Extracted)[]) if (out[k] === undefined) delete out[k]
  return out
}

// ---- Screenshots listing several applications -----------------------------
// e.g. PSC "My Application" shows one card per post, side by side. OCR reads
// cards in a row left→right on the same line, so the Nth match of each field
// (in reading order) belongs to the Nth card. Each advertisement number marks
// one application.

// "17320-17324/2083-84", "12/082-83", "245/2082"
const AD_NO_RE = /\b(\d{2,6}(?:-\d{2,6})?\/\d{3,4}-\d{2}|\d{3,6}(?:-\d{3,6})?\/\d{3,4})\b/g
const ISO_OR_DMY_RE = /\b(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})\b/g
const SERVICE_RE = /((?:[\u0900-\u097F]+\s){1,3}सेवा)/g

/** One entry per application found. Normal single-application screenshots return [extractFromText(text)]. */
export function extractMany(raw: string): Extracted[] {
  const ascii = toAscii(raw)
  const adNos = [...new Set([...ascii.matchAll(AD_NO_RE)].map((m) => m[1]))]
  if (adNos.length < 2) {
    const one = extractFromText(raw)
    return Object.keys(one).length ? [one] : []
  }

  // Fields that apply to every card on the page.
  const shared = extractFromText(raw)
  const base: Extracted = {}
  for (const k of ['organization', 'link', 'status', 'paymentStatus', 'paymentMethod'] as const) {
    if (shared[k] !== undefined) (base as Record<string, unknown>)[k] = shared[k]
  }
  if (/not\s+paid|unpaid|भुक्तानी\s*नभएको|\bPay\b/i.test(raw)) base.paymentStatus = 'unpaid'
  if (/Pending|Submitted|applied\s+for/i.test(raw)) base.status ??= 'applied'

  // Only read per-card values after the first ad number (skips header/sidebar).
  const body = ascii.slice(ascii.indexOf(adNos[0]))
  const n = adNos.length
  const nth = <T,>(list: T[], i: number) => (list.length >= n ? list[i] : undefined)

  const dates = [...body.matchAll(ISO_OR_DMY_RE)].map((m) => parseAdDate(m[1])).filter((d): d is string => !!d)
  const services = [...body.matchAll(SERVICE_RE)].map((m) => translatePost(m[1]))
  const fees = [...body.matchAll(/(?:Rs\.?|रु\.?|NPR)\s*([\d,]+(?:\.\d+)?)/gi)].map((m) => amount(m[1])!)

  return adNos.map((advertisementNo, i) => {
    const item: Extracted = { ...base, advertisementNo }
    const service = nth(services, i)
    item.position = service ?? `Adv. ${advertisementNo}`
    const date = nth(dates, i)
    if (date) item.appliedDate = date
    const fee = nth(fees, i)
    if (fee) item.fee = fee
    return item
  })
}
