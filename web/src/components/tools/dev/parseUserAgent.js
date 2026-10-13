// A small regex-based user agent parser: browser, engine, OS, device type, and known bots.
// Order matters in every table below: more specific tokens (Edge, Opera, Samsung) come before the
// generic ones they also contain (Chrome, Safari). Returns null fields when something isn't found.

const BOTS = [
  ['Googlebot', /Googlebot(?:-[A-Za-z]+)?\/?([\d.]+)?/i],
  ['Google-InspectionTool', /Google-InspectionTool\/?([\d.]+)?/i],
  ['Google AdsBot', /AdsBot-Google(?:-Mobile)?/i],
  ['Google Read Aloud', /Google-Read-Aloud/i],
  ['Bingbot', /bingbot\/?([\d.]+)?/i],
  ['BingPreview', /BingPreview\/?([\d.]+)?/i],
  ['DuckDuckBot', /DuckDuckBot\/?([\d.]+)?/i],
  ['Baiduspider', /Baiduspider\/?([\d.]+)?/i],
  ['YandexBot', /YandexBot\/?([\d.]+)?/i],
  ['Applebot', /Applebot\/?([\d.]+)?/i],
  ['Slurp (Yahoo)', /Yahoo! Slurp/i],
  ['GPTBot (OpenAI)', /GPTBot\/?([\d.]+)?/i],
  ['ChatGPT-User (OpenAI)', /ChatGPT-User\/?([\d.]+)?/i],
  ['OAI-SearchBot (OpenAI)', /OAI-SearchBot\/?([\d.]+)?/i],
  ['ClaudeBot (Anthropic)', /ClaudeBot\/?([\d.]+)?/i],
  ['Claude-User (Anthropic)', /Claude-User\/?([\d.]+)?/i],
  ['PerplexityBot', /PerplexityBot\/?([\d.]+)?/i],
  ['CCBot (Common Crawl)', /CCBot\/?([\d.]+)?/i],
  ['Bytespider', /Bytespider/i],
  ['AhrefsBot', /AhrefsBot\/?([\d.]+)?/i],
  ['SemrushBot', /SemrushBot\/?([\d.~a-z]+)?/i],
  ['MJ12bot', /MJ12bot\/?v?([\d.]+)?/i],
  ['DotBot', /DotBot\/?([\d.]+)?/i],
  ['facebookexternalhit', /facebookexternalhit\/?([\d.]+)?/i],
  ['Meta-ExternalAgent', /meta-externalagent\/?([\d.]+)?/i],
  ['Twitterbot', /Twitterbot\/?([\d.]+)?/i],
  ['LinkedInBot', /LinkedInBot\/?([\d.]+)?/i],
  ['Slackbot', /Slackbot(?:-LinkExpanding)?\s?([\d.]+)?/i],
  ['Discordbot', /Discordbot\/?([\d.]+)?/i],
  ['TelegramBot', /TelegramBot/i],
  ['WhatsApp', /WhatsApp\/?([\d.]+)?/i],
  ['Pinterestbot', /Pinterestbot\/?([\d.]+)?/i],
  ['UptimeRobot', /UptimeRobot\/?([\d.]+)?/i],
  ['Pingdom', /Pingdom/i],
  ['Lighthouse', /Chrome-Lighthouse/i],
  ['HeadlessChrome', /HeadlessChrome\/?([\d.]+)?/i],
  ['curl', /^curl\/([\d.]+)/i],
  ['Wget', /^Wget\/([\d.]+)/i],
  ['Python Requests', /python-requests\/([\d.]+)/i],
  ['Python urllib', /Python-urllib\/([\d.]+)/i],
  ['aiohttp', /aiohttp\/([\d.]+)/i],
  ['Go HTTP client', /Go-http-client\/([\d.]+)/i],
  ['Node fetch (undici)', /^(?:node|undici)(?:-fetch)?\/?([\d.]+)?/i],
  ['axios', /axios\/([\d.]+)/i],
  ['okhttp', /okhttp\/([\d.]+)/i],
  ['Java', /^Java\/([\d._]+)/i],
  ['PostmanRuntime', /PostmanRuntime\/([\d.]+)/i],
  ['Insomnia', /insomnia\/([\d.]+)/i],
]

const GENERIC_BOT = /bot\b|crawler|spider|crawling|scraper|fetcher|preview|monitor|headless/i

const BROWSERS = [
  ['Microsoft Edge', /Edg(?:e|A|iOS)?\/([\d.]+)/],
  ['Opera', /(?:OPR|Opera|OPT)\/([\d.]+)/],
  ['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
  ['Vivaldi', /Vivaldi\/([\d.]+)/],
  ['Yandex Browser', /YaBrowser\/([\d.]+)/],
  ['UC Browser', /UCBrowser\/([\d.]+)/],
  ['Brave', /Brave\/([\d.]+)/],
  ['DuckDuckGo', /DuckDuckGo\/([\d.]+)/],
  ['Arc', /Arc\/([\d.]+)/],
  ['Electron', /Electron\/([\d.]+)/],
  ['Facebook in-app', /FBAV\/([\d.]+)|FBAN/],
  ['Instagram in-app', /Instagram ([\d.]+)/],
  ['Android WebView', /; wv\).+Version\/([\d.]+)/],
  ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
  ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
  ['Safari', /Version\/([\d.]+).*Safari\//],
  ['Internet Explorer', /(?:MSIE |Trident\/.*rv:)([\d.]+)/],
]

const ENGINES = [
  ['EdgeHTML', /Edge\/([\d.]+)/],
  ['Blink', /(?:Chrome|CriOS|Chromium)\/([\d.]+)/],
  ['Gecko', /rv:([\d.]+)\) Gecko\/\d+/],
  ['WebKit', /AppleWebKit\/([\d.]+)/],
  ['Trident', /Trident\/([\d.]+)/],
  ['Presto', /Presto\/([\d.]+)/],
]

const MAC_RELEASES = { 10: 'Yosemite', 11: 'El Capitan', 12: 'Sierra', 13: 'High Sierra', 14: 'Mojave', 15: 'Catalina' }
const WINDOWS_NT = { '10.0': '10 or 11', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.2': 'XP x64', '5.1': 'XP', '5.0': '2000' }

function detectOs(ua) {
  let m
  if ((m = ua.match(/Windows Phone(?: OS)? ([\d.]+)/))) return { name: 'Windows Phone', version: m[1] }
  if ((m = ua.match(/Windows NT ([\d.]+)/))) return { name: 'Windows', version: WINDOWS_NT[m[1]] || m[1] }
  if (/Windows/.test(ua)) return { name: 'Windows', version: null }
  if ((m = ua.match(/(?:iPhone|iPad|iPod).*? OS ([\d_]+)/))) return { name: /iPad/.test(ua) ? 'iPadOS' : 'iOS', version: m[1].replace(/_/g, '.') }
  if ((m = ua.match(/CrOS [\w]+ ([\d.]+)/))) return { name: 'ChromeOS', version: m[1] }
  if ((m = ua.match(/Android ([\d.]+)/))) return { name: 'Android', version: m[1] }
  if (/Android/.test(ua)) return { name: 'Android', version: null }
  if ((m = ua.match(/Mac OS X ([\d_.]+)/))) {
    const version = m[1].replace(/_/g, '.')
    const minor = Number(version.split('.')[1])
    // Browsers freeze the reported macOS version at 10.15.7, so newer releases also show as 10.15.
    const note = version.startsWith('10.15') ? 'Catalina or later' : MAC_RELEASES[minor]
    return { name: 'macOS', version: note ? `${version} (${note})` : version }
  }
  if (/Macintosh/.test(ua)) return { name: 'macOS', version: null }
  if (/HarmonyOS/.test(ua)) return { name: 'HarmonyOS', version: (ua.match(/HarmonyOS ([\d.]+)/) || [])[1] || null }
  if (/KaiOS\/([\d.]+)/.test(ua)) return { name: 'KaiOS', version: ua.match(/KaiOS\/([\d.]+)/)[1] }
  if (/Tizen/.test(ua)) return { name: 'Tizen', version: (ua.match(/Tizen ([\d.]+)/) || [])[1] || null }
  if (/Ubuntu/.test(ua)) return { name: 'Ubuntu', version: null }
  if (/Fedora/.test(ua)) return { name: 'Fedora', version: null }
  if (/FreeBSD/.test(ua)) return { name: 'FreeBSD', version: null }
  if (/Linux/.test(ua)) return { name: 'Linux', version: null }
  return { name: null, version: null }
}

const VENDORS = [
  ['Apple', /iPhone|iPad|iPod|Macintosh/],
  ['Samsung', /SAMSUNG|SM-[A-Z]\d|GT-[A-Z]\d/i],
  ['Google', /Pixel/],
  ['Huawei', /HUAWEI|Huawei|HarmonyOS/],
  ['Xiaomi', /Xiaomi|Redmi|\bMi \d|POCO/],
  ['OnePlus', /OnePlus|ONEPLUS/],
  ['Motorola', /moto[ \w]|Motorola/],
  ['Nokia', /Nokia/],
  ['LG', /\bLG[- ]|LM-[A-Z]\d/],
  ['Sony', /Xperia|Sony/],
  ['Amazon', /Kindle|Silk|AFT[A-Z]/],
  ['Microsoft', /Xbox|Windows Phone/],
]

function detectDevice(ua, os) {
  let m
  const vendor = VENDORS.find(([, re]) => re.test(ua))?.[0] || null
  let model = null
  if ((m = ua.match(/(iPhone|iPad|iPod)/))) model = m[1]
  else if ((m = ua.match(/Android [\d.]+; (?:[a-z]{2}[-_][a-zA-Z]{2}; )?([^;)]+?)(?: Build\/[^;)]+)?[;)]/))) model = m[1].trim() === 'K' ? null : m[1].trim()

  let type = 'desktop'
  if (/SmartTV|SMART-TV|Tizen.*TV|Web0S|webOS.*TV|AppleTV|HbbTV|BRAVIA|Roku|CrKey|AFT[A-Z]/i.test(ua)) type = 'smart TV'
  else if (/PlayStation|Xbox|Nintendo/i.test(ua)) type = 'console'
  else if (/iPad|Tablet|PlayBook|Silk|Kindle/i.test(ua) || (os.name === 'Android' && !/Mobile/.test(ua))) type = 'tablet'
  else if (/Mobi|iPhone|iPod|Windows Phone|IEMobile|Opera Mini|KaiOS/i.test(ua)) type = 'mobile'
  else if (/Watch|wearable/i.test(ua)) type = 'wearable'
  return { type, vendor, model }
}

function firstMatch(table, ua) {
  for (const [name, re] of table) {
    const m = ua.match(re)
    if (m) return { name, version: m[1] || null }
  }
  return { name: null, version: null }
}

export function parseUserAgent(input) {
  const ua = String(input || '').trim()
  const empty = { ua, browser: { name: null, version: null, major: null }, engine: { name: null, version: null }, os: { name: null, version: null }, device: { type: null, vendor: null, model: null }, bot: { isBot: false, name: null, version: null } }
  if (!ua) return empty

  let bot = { isBot: false, name: null, version: null }
  for (const [name, re] of BOTS) {
    const m = ua.match(re)
    if (m) { bot = { isBot: true, name, version: m[1] || null }; break }
  }
  if (!bot.isBot && GENERIC_BOT.test(ua)) bot = { isBot: true, name: 'Unknown bot', version: null }

  const browser = firstMatch(BROWSERS, ua)
  // Edge Legacy reported "Edge/18"; Chromium Edge uses "Edg/". Both map to Microsoft Edge.
  const engine = firstMatch(ENGINES, ua)
  // iOS browsers must use WebKit, whatever brand they report.
  if (/iPhone|iPad|iPod/.test(ua) && engine.name === 'Blink') Object.assign(engine, firstMatch([['WebKit', /AppleWebKit\/([\d.]+)/]], ua))
  if (engine.name === 'Blink' && engine.version) engine.version = engine.version.split('.')[0]
  if (!engine.name && /Gecko\//.test(ua)) Object.assign(engine, { name: 'Gecko', version: null })

  const os = detectOs(ua)
  const device = detectDevice(ua, os)
  if (bot.isBot) device.type = 'bot'

  return {
    ua,
    browser: { ...browser, major: browser.version ? browser.version.split('.')[0] : null },
    engine,
    os,
    device,
    bot,
  }
}

export default parseUserAgent
