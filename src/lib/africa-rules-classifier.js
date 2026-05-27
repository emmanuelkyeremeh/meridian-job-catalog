/**
 * Rule-based Africa eligibility classifier.
 * Returns yes | no | maybe — LLM is only needed for maybe.
 */

const AFRICA_TERMS = [
  'algeria', 'angola', 'benin', 'botswana', 'burkina faso', 'burundi', 'cabo verde', 'cape verde',
  'cameroon', 'central african republic', 'chad', 'comoros', 'congo', 'côte d\'ivoire', 'ivory coast',
  'djibouti', 'egypt', 'equatorial guinea', 'eritrea', 'eswatini', 'swaziland', 'ethiopia', 'gabon',
  'gambia', 'ghana', 'guinea', 'guinea-bissau', 'kenya', 'lesotho', 'liberia', 'libya', 'madagascar',
  'malawi', 'mali', 'mauritania', 'mauritius', 'morocco', 'mozambique', 'namibia', 'niger', 'nigeria',
  'rwanda', 'são tomé', 'senegal', 'seychelles', 'sierra leone', 'somalia', 'south africa', 'south sudan',
  'sudan', 'tanzania', 'togo', 'tunisia', 'uganda', 'zambia', 'zimbabwe', 'africa', 'african',
  'sub-saharan', 'lagos', 'nairobi', 'cape town', 'johannesburg', 'accra', 'cairo', 'casablanca',
  'dakar', 'addis ababa', 'dar es salaam', 'kampala', 'kigali', 'lusaka', 'harare', 'maputo', 'tunis',
  'algiers', 'abuja', 'durban', 'pretoria', 'mombasa', 'kumasi', 'ibadan', 'kinshasa', 'luanda',
  'douala', 'abidjan', 'rabat', 'imo state', 'rivers state',
];

const GLOBAL_REMOTE_RES = [
  /\bremote\s+worldwide\b/i,
  /\bworldwide\s+remote\b/i,
  /\bworld\s+wide\s*-\s*remote\b/i,
  /\bwork\s+from\s+anywhere\b/i,
  /\banywhere\s+in\s+the\s+world\b/i,
  /\bglobally\s+distributed\b/i,
  /\bglobal\s+remote\b/i,
  /\bremote\s*-\s*global\b/i,
  /\bhome\s+based\s*-\s*worldwide\b/i,
  /\bopen\s+to\s+(?:all|any)\s+(?:locations?|countries?)\b/i,
  /\bhire\s+in\s+\d+\+\s+countries\b/i,
  /\b100%\s+remote\s+worldwide\b/i,
];

const EMEA_RES = [
  /\bemea\b/i,
  /\beurope,\s*middle\s+east\s+and\s+africa\b/i,
  /\beurope\s+middle\s+east\s+africa\b/i,
  /\bmiddle\s+east\s*(?:&|and)\s*africa\b/i,
  /\bhome\s+based\s*-\s*emea\b/i,
  /\bremote\s*-\s*emea\b/i,
];

const LOCATION_NO_RES = [
  /\b(?:us|u\.s\.|usa|united states)\s*[-–|]?\s*remote\b/i,
  /\bremote\s*[-–(,]?\s*(?:us|u\.s\.|usa|united states)\b/i,
  /\bremote\s*\(\s*(?:us|u\.s\.|usa)\s*\)/i,
  /\b(?:us|usa|united states)\s+only\b/i,
  /\bremote\s*-\s*canada\b/i,
  /\bcanada\s*[-–]?\s*remote\b/i,
  /\bremote\s*\(\s*canada\s*\)/i,
  /\bremote\s*-\s*(?:united kingdom|uk)\b/i,
  /\b(?:united kingdom|uk)\s*[-–(]?\s*remote\b/i,
  /\bremote\s*-\s*(?:germany|france|spain|italy|netherlands|poland|ireland|sweden|norway|denmark|belgium|austria|switzerland|portugal)\b/i,
  /\b(?:germany|france|spain|italy|netherlands|poland|ireland|sweden|norway|denmark|belgium|austria|switzerland|portugal)\s*[-–]?\s*remote\b/i,
  /\bremote\s*-\s*(?:india|mexico|colombia|brazil|australia|japan|china|philippines|pakistan|argentina|chile|peru|singapore|hong kong|korea|israel|turkey|uae|dubai)\b/i,
  /\b(?:india|mexico|colombia|brazil|australia|japan|china|philippines|pakistan|argentina|chile|peru|singapore|hong kong|korea|israel|turkey|uae|dubai)\s*[-–(]?\s*remote\b/i,
  /\bnorth\s+america\s+only\b/i,
  /\b(?:eu|eea|europe|european union)\s+only\b/i,
  /\b(?:apac|latam|latin america)\s+only\b/i,
  /\b(?:us|usa|u\.s\.|united states)\s*,\s*remote\b/i,
  /\b[a-z .]+,\s*(?:usa|us)\s*\(remote\)/i,
  /\b(?:san francisco|new york|los angeles|chicago|boston|seattle|austin|denver|atlanta|dallas|houston|miami|phoenix|portland|washington,\s*dc)\b[^|]*\bor\s+remote\s*\(\s*(?:us|usa)\s*\)/i,
];

const DESCRIPTION_NO_RES = [
  /\bmust\s+be\s+(?:legally\s+)?(?:authorized|eligible)\s+to\s+work\s+in\s+(?:the\s+)?(?:united states|u\.s\.|usa)\b/i,
  /\beligible\s+to\s+work\s+in\s+(?:the\s+)?(?:united states|u\.s\.|usa)\b/i,
  /\bauthorized\s+to\s+work\s+in\s+(?:the\s+)?(?:united states|u\.s\.|usa)\b/i,
  /\b(?:us|u\.s\.|usa|united states)\s+citizen(?:ship)?\s+(?:required|only)\b/i,
];

const ONSITE_NO_RES = [
  /\b(?:on-?site|in-?office|in person)\s+only\b/i,
  /\bno\s+remote\b/i,
];

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

const AFRICA_RE = new RegExp(
  `\\b(${AFRICA_TERMS.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'i'
);

function joinText(job) {
  return [job.title, job.location, job.description].filter(Boolean).join(' ');
}

function containsAfricaTerm(text) {
  return AFRICA_RE.test(text);
}

function locationHasOpenRegion(location) {
  const loc = location || '';
  return /emea|worldwide|africa|work from anywhere|global remote/i.test(loc);
}

function locationHardNo(location) {
  if (!location || locationHasOpenRegion(location)) return false;
  return matchesAny(location, LOCATION_NO_RES);
}

function locationIsRegionLocked(location) {
  if (!location) return false;
  if (locationHasOpenRegion(location)) return false;
  if (locationHardNo(location)) return true;
  const loc = normalize(location);
  return loc.includes('remote') && /\b(?:us|usa|u\.s\.|united states|canada|uk|united kingdom|india|mexico|australia|germany|france|spain)\b/.test(loc);
}

function matchesAny(text, patterns) {
  return patterns.some((re) => re.test(text));
}

function hasGlobalRemoteSignal(text) {
  return matchesAny(text, GLOBAL_REMOTE_RES);
}

function hasEmeaSignal(text) {
  return matchesAny(text, EMEA_RES);
}

function locationIsBareRemote(location) {
  const loc = normalize(location);
  return loc === 'remote' || loc === 'remote job' || loc === 'fully remote' || loc === '100% remote';
}

function hasRescueSignal(job) {
  const text = joinText(job);
  return containsAfricaTerm(text) || hasGlobalRemoteSignal(text) || hasEmeaSignal(text);
}

function hasHardNoSignal(job) {
  const loc = job.location || '';
  const text = joinText(job);

  if (locationHardNo(loc) && !hasRescueSignal(job)) return true;
  if (matchesAny(text, ONSITE_NO_RES)) return true;

  if (matchesAny(text, DESCRIPTION_NO_RES) && !hasRescueSignal(job)) return true;

  const locNorm = normalize(loc);
  if (locNorm && !locNorm.includes('remote') && !containsAfricaTerm(loc) && !hasEmeaSignal(loc)) {
    const westernOnsite = /\b(?:united states|usa|u\.s\.|canada|united kingdom|uk|germany|france|spain|italy|netherlands|ireland|australia|switzerland|sweden|norway|denmark|belgium|austria|poland|portugal|japan|china|india|singapore|hong kong|israel|uae|dubai|mexico|brazil)\b/i;
    if (westernOnsite.test(loc) && !hasGlobalRemoteSignal(text) && !hasEmeaSignal(text)) {
      return true;
    }
  }

  return false;
}

function hasHardYesSignal(job) {
  const loc = job.location || '';
  const text = joinText(job);

  if (containsAfricaTerm(loc) || (containsAfricaTerm(text) && !locationIsRegionLocked(loc))) {
    return { yes: true, signal: 'africa' };
  }
  if (hasGlobalRemoteSignal(loc) || (hasGlobalRemoteSignal(text) && !locationIsRegionLocked(loc))) {
    return { yes: true, signal: 'global-remote' };
  }
  if (hasEmeaSignal(loc) || (hasEmeaSignal(text) && !locationIsRegionLocked(loc))) {
    return { yes: true, signal: 'emea' };
  }

  const locNorm = normalize(loc);
  if (locNorm.includes('remote') && !locationHardNo(loc)) {
    if (locNorm.includes('distributed') || locNorm.includes('anywhere')) {
      return { yes: true, signal: 'location-remote-open' };
    }
  }

  return { yes: false };
}

/**
 * @returns {{ verdict: 'yes' | 'no' | 'maybe', signal?: string, reason: string }}
 */
export function classifyAfricaJobRules(job) {
  const yes = hasHardYesSignal(job);
  if (yes.yes) {
    return { verdict: 'yes', signal: yes.signal, reason: yes.signal };
  }

  if (hasHardNoSignal(job)) {
    return { verdict: 'no', reason: 'region-or-eligibility-exclusion' };
  }

  const loc = job.location || '';
  const desc = job.description || '';
  if (locationIsBareRemote(loc) || (normalize(loc).includes('remote') && desc.length < 80)) {
    return { verdict: 'maybe', reason: 'vague-remote' };
  }

  if (normalize(loc).includes('remote')) {
    return { verdict: 'maybe', reason: 'unclassified-remote' };
  }

  return { verdict: 'maybe', reason: 'insufficient-signal' };
}

export function classifyAfricaJobsRules(jobs) {
  const yes = [];
  const no = [];
  const maybe = [];

  for (const job of jobs) {
    const result = classifyAfricaJobRules(job);
    const row = { ...job, africaRuleVerdict: result.verdict, africaRuleReason: result.reason };
    if (result.signal) row.africaSignal = result.signal;
    if (result.verdict === 'yes') yes.push(row);
    else if (result.verdict === 'no') no.push(row);
    else maybe.push(row);
  }

  return { yes, no, maybe, stats: { total: jobs.length, yes: yes.length, no: no.length, maybe: maybe.length } };
}
