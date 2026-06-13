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

/**
 * STRONG global-remote signals: genuine worldwide / Africa-inclusive eligibility.
 * These are trustworthy enough to RESCUE a job whose location names a non-Africa region
 * (e.g. "Remote, US" but the body says "open to candidates anywhere in the world").
 */
const STRONG_GLOBAL_RES = [
  /\bremote\s+worldwide\b/i,
  /\bworldwide\s+remote\b/i,
  /\bworld\s+wide\s*-\s*remote\b/i,
  /\bwork\s+from\s+anywhere\s+in\s+the\s+world\b/i,
  /\bwork\s+from\s+anywhere\b/i,
  /\bwork\s+from\s+any\s+country\b/i,
  /\banywhere\s+in\s+the\s+world\b/i,
  /\bglobally\s+distributed\b/i,
  /\bglobal\s+remote\b/i,
  /\bremote\s*-\s*global\b/i,
  /\bhome\s+based\s*-\s*worldwide\b/i,
  /\bopen\s+to\s+(?:all|any)\s+(?:locations?|countries?)\b/i,
  /\bopen\s+to\s+candidates?\s+(?:located\s+)?(?:anywhere|outside\s+(?:the\s+)?(?:us|usa|united\s+states))\b/i,
  /\bhire\s+in\s+\d+\+?\s+countries\b/i,
  /\bhire\s+(?:from\s+)?anywhere\b/i,
  /\b100%\s+remote\s+worldwide\b/i,
  /\b(?:excluding|except)\s+(?:the\s+)?(?:us|u\.s\.|usa|united\s+states|canada)\b/i,
  /\bnon[- ]us\s+remote\b/i,
  /\bremote\s*\(\s*excluding\s+(?:the\s+)?(?:us|usa|united\s+states)\s*\)/i,
  /\b(?:outside|beyond)\s+(?:the\s+)?(?:us|u\.s\.|usa|united\s+states|canada)\b/i,
  /\b(?:any|all)\s+(?:countries?|locations?)\s+(?:except|excluding)\s+(?:the\s+)?(?:us|u\.s\.|usa|canada)\b/i,
  /\bafrica(?:n)?\s+time\s*zone\b/i,
  /\b(?:eat|wat|cat|sast|west\s+africa\s+time|central\s+africa\s+time|east\s+africa\s+time|south\s+africa\s+standard\s+time)\b/i,
];

/**
 * WEAK global-remote signals: company-culture / benefit / product boilerplate that
 * frequently appears in US-only or region-locked postings ("we're a remote-first company",
 * "we offer global payroll via Deel", "collaborate across all time zones").
 * These DO NOT override an explicit non-Africa location lock; they only help when the
 * location is open or a bare "Remote".
 */
const WEAK_GLOBAL_RES = [
  /\bfully\s+distributed\b/i,
  /\blocation[- ]independent\b/i,
  /\bpay\s+(?:you\s+)?in\s+any\s+currency\b/i,
  /\bglobal\s+payroll\b/i,
  /\b(?:any|all)\s+time\s*zones?\b/i,
  /\btime\s*zone[- ]agnostic\b/i,
  /\bremote[- ]first\b/i,
  /\bvia\s+(?:deel|remote\.com|oyster|remofirst|multiplier)\b/i,
  /\b(?:deel|remote\.com|oyster|papaya\s+global|velocity\s+global|multiplier)\s+(?:eor|employer\s+of\s+record)\b/i,
  /\bemployer\s+of\s+record\b/i,
  /\bEOR\b/,
  /\b(?:gmt|utc|cet)\s*[+-]?\s*\d*\s*(?:to|–|-)\s*(?:gmt|utc|cet)?\s*[+-]?\s*\d*/i,
  /\bGMT[+]?[0-3]\b/,
  /\bUTC[+]?[0-3]\b/,
];

/** Backward-compatible union of all global-remote patterns. */
const GLOBAL_REMOTE_RES = [...STRONG_GLOBAL_RES, ...WEAK_GLOBAL_RES];

const EMEA_RES = [
  /\bemea\b/i,
  /\bcemea\b/i,
  /\bamea\b/i,
  /\bmea\b/,
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
  /\bremote\s*[-–]?\s*(?:eu|eea|europe|european union)\b/i,
  /\b(?:eu|eea|europe|european union)\s*[-–]?\s*remote\b/i,
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
  /\beligib(?:le|ility)\s+to\s+work\s+in\s+(?:the\s+)?(?:united states|u\.s\.|usa)\s+(?:only|required)\b/i,
  /\bmust\s+reside\s+in\s+(?:the\s+)?(?:us|usa|united states)\b/i,
  /\b(?:us|u\.s\.)\s+citizens?\s+only\b/i,
  /\bmust\s+be\s+(?:legally\s+)?(?:authorized|eligible)\s+to\s+work\s+in\s+canada\b/i,
  /\bauthorized\s+to\s+work\s+in\s+canada\b/i,
  /\bmust\s+(?:reside|be\s+(?:located|based))\s+in\s+canada\b/i,
  /\bcanadian\s+citizens?\s+(?:or\s+permanent\s+residents?\s+)?only\b/i,
  /\bmust\s+be\s+(?:a\s+)?canadian\s+(?:citizen|permanent\s+resident)\b/i,
  /\b(?:requires?|active)\s+(?:us\s+)?security\s+clearance\b/i,
  /\bmust\s+(?:be\s+(?:a\s+)?|hold\s+)(?:us|u\.s\.)\s+(?:citizen|green\s+card|permanent\s+resident)\b/i,
  /\bw2\s+only\b/i,
  /\bauthorized\s+to\s+work\s+in\s+(?:the\s+)?(?:united states|u\.s\.|usa)\b/i,
  /\b(?:us|u\.s\.|usa|united states)\s+citizen(?:ship)?\s+(?:required|only)\b/i,
  /\b(?:must be|required to be)\s+(?:legally\s+)?(?:located|based|residing|living)\s+in\s+(?:the\s+)?(?:eu|eea|european union)\b/i,
  /\b(?:eligible|authorized)\s+to\s+work\s+in\s+(?:the\s+)?(?:eu|eea|european union)\b/i,
  /\b(?:within|in)\s+(?:certain\s+)?(?:countries?\s+(?:within|in)\s+)?(?:the\s+)?(?:eu|eea|european union)\b/i,
  /\b(?:candidates?|applicants?)\s+based\s+in\s+(?:certain\s+)?(?:countries?\s+(?:within|in)\s+)?(?:the\s+)?(?:eu|eea|european union)\b/i,
  /\b(?:eu|eea|european union)\s+(?:member\s+)?(?:states?|countries?)\s+only\b/i,
  /\bremote\s+for\s+candidates?\s+based\s+in\s+(?:certain\s+)?(?:countries?\s+(?:within|in)\s+)?(?:the\s+)?(?:eu|eea|european union)\b/i,
];

const ONSITE_NO_RES = [
  /\bon-?site\b/i,
  /\b(?:on-?site|in-?office|in person)\s+only\b/i,
  /\bno\s+remote\b/i,
  /\bhybrid\b/i,
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

/** US state full names (region lock when present in a remote location string). */
const US_STATE_NAMES_RE =
  /\b(?:alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington(?:,?\s+d\.?c\.?| state)?|west virginia|wisconsin|wyoming)\b/i;

/** ", XX" style US state / Canadian province abbreviations (e.g. "Austin, TX", "Toronto, ON"). */
const US_CA_STATE_ABBR_RE =
  /,\s*(?:al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|ma|md|me|mi|mn|mo|ms|mt|nc|nd|ne|nh|nj|nm|nv|ny|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|va|vt|wa|wi|wv|wy|dc|on|bc|ab|mb|sk|qc|ns|nb|nl|pe)\b/i;

const MAJOR_US_CA_CITIES_RE =
  /\b(?:san francisco|new york city|los angeles|chicago|boston|seattle|austin|denver|atlanta|dallas|houston|miami|phoenix|portland|philadelphia|san diego|san jose|salt lake city|minneapolis|nashville|charlotte|raleigh|pittsburgh|columbus|kansas city|toronto|vancouver|montreal|calgary|ottawa|edmonton)\b/i;

function locationIsRegionLocked(location) {
  if (!location) return false;
  if (locationHasOpenRegion(location)) return false;
  if (containsAfricaTerm(location)) return false;
  if (locationHardNo(location)) return true;
  const loc = normalize(location);
  if (!loc.includes('remote')) return false;
  return (
    /\b(?:us|usa|u\.s\.|united states|canada|uk|united kingdom|europe|eu\b|eea|india|mexico|australia|germany|france|spain)\b/.test(loc) ||
    US_STATE_NAMES_RE.test(loc) ||
    US_CA_STATE_ABBR_RE.test(loc) ||
    MAJOR_US_CA_CITIES_RE.test(loc)
  );
}

function matchesAny(text, patterns) {
  return patterns.some((re) => re.test(text));
}

function hasStrongGlobalSignal(text) {
  return matchesAny(text, STRONG_GLOBAL_RES);
}

function hasWeakGlobalSignal(text) {
  return matchesAny(text, WEAK_GLOBAL_RES);
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

/**
 * A "rescue" overrides an explicit non-Africa location lock. Only STRONG, Africa, or EMEA
 * signals qualify — weak culture/benefit boilerplate ("remote-first", "EOR") must NOT
 * rescue a "Remote, US" / "Canada - Remote" posting, which is the main source of US/CA leakage.
 */
function hasRescueSignal(job) {
  const text = joinText(job);
  return containsAfricaTerm(text) || hasStrongGlobalSignal(text) || hasEmeaSignal(text);
}

function hasHardNoSignal(job) {
  const loc = job.location || '';
  const text = joinText(job);

  if (locationHardNo(loc) && !hasRescueSignal(job)) return true;
  // Broader region lock (e.g. "Remote in USA", "United States (Remote)") — hard no
  // unless a strong/Africa/EMEA rescue exists in the text.
  if (locationIsRegionLocked(loc) && !hasRescueSignal(job)) return true;
  if (matchesAny(text, ONSITE_NO_RES)) return true;

  if (matchesAny(text, DESCRIPTION_NO_RES) && !hasRescueSignal(job)) return true;

  const locNorm = normalize(loc);
  if (locNorm && !locNorm.includes('remote') && !containsAfricaTerm(loc) && !hasEmeaSignal(loc)) {
    const westernOnsite = /\b(?:united states|usa|u\.s\.|canada|united kingdom|uk|germany|france|spain|italy|netherlands|ireland|australia|switzerland|sweden|norway|denmark|belgium|austria|poland|portugal|japan|china|india|singapore|hong kong|israel|uae|dubai|mexico|brazil)\b/i;
    if (westernOnsite.test(loc) && !hasStrongGlobalSignal(text) && !hasEmeaSignal(text)) {
      return true;
    }
  }

  return false;
}

function isSparseJobText(job) {
  const loc = normalize(job.location || '');
  const descLen = String(job.description || '').trim().length;
  return loc.length < 2 && descLen < 40;
}

function isMarketplaceRemoteJob(job) {
  return Boolean(job.meridianMarketplaceRemote || job.meridianWorldwideRemote);
}

function localModelYesAllowed(job) {
  if (isMarketplaceRemoteJob(job)) return true;
  if (isSparseJobText(job)) return false;
  if (hasHardNoSignal(job)) return false;
  if (hasRescueSignal(job)) return true;
  const loc = normalize(job.location || '');
  const desc = String(job.description || '');
  if (hasStrongGlobalSignal(desc) || hasEmeaSignal(desc)) return true;
  if (loc.includes('remote') && desc.length >= 80) return true;
  if (containsAfricaTerm(loc)) return true;
  return false;
}

export { localModelYesAllowed, isSparseJobText, hasRescueSignal, hasHardNoSignal };

function hasHardYesSignal(job) {
  const loc = job.location || '';
  const text = joinText(job);

  if (job.meridianMarketplaceRemote) {
    return { yes: true, signal: 'marketplace-remote' };
  }
  if (job.meridianWorldwideRemote) {
    return { yes: true, signal: 'legacy-worldwide-remote' };
  }

  // Africa named in the location is always a yes.
  if (containsAfricaTerm(loc)) {
    return { yes: true, signal: 'africa-location' };
  }

  const regionLocked = locationIsRegionLocked(loc);

  // When the location explicitly locks to a non-Africa region (e.g. "Remote, US",
  // "Canada - Remote", "EU only"), ONLY a strong/Africa/EMEA rescue may flip it to yes.
  // Weak culture/benefit phrases in the body ("remote-first", "EOR") are ignored here —
  // this is the fix for US/Canada-only jobs leaking into the Africa catalog.
  if (regionLocked) {
    if (containsAfricaTerm(text)) return { yes: true, signal: 'africa-mention-over-lock' };
    if (hasStrongGlobalSignal(text)) return { yes: true, signal: 'global-remote-over-lock' };
    if (hasEmeaSignal(text) && !locationHardNo(loc)) return { yes: true, signal: 'emea-over-lock' };
    return { yes: false };
  }

  if (containsAfricaTerm(text)) {
    return { yes: true, signal: 'africa' };
  }
  if (hasStrongGlobalSignal(loc) || hasStrongGlobalSignal(text)) {
    return { yes: true, signal: 'global-remote' };
  }
  if (hasEmeaSignal(loc) || hasEmeaSignal(text)) {
    return { yes: true, signal: 'emea' };
  }

  const locNorm = normalize(loc);
  if (locNorm.includes('remote') && !locationHardNo(loc)) {
    if (locNorm.includes('distributed') || locNorm.includes('anywhere')) {
      return { yes: true, signal: 'location-remote-open' };
    }
    // Bare "Remote" with weak global signal in the body → plausibly worldwide.
    if (locationIsBareRemote(loc) && hasWeakGlobalSignal(text)) {
      return { yes: true, signal: 'bare-remote-weak-global' };
    }
  }

  return { yes: false };
}

/**
 * @returns {{ verdict: 'yes' | 'no' | 'review' | 'maybe', signal?: string, reason: string }}
 */
export function classifyAfricaJobRules(job) {
  const yes = hasHardYesSignal(job);
  if (yes.yes) {
    return { verdict: 'yes', signal: yes.signal, reason: yes.signal };
  }

  if (isSparseJobText(job)) {
    return { verdict: 'no', reason: 'missing-location-and-description' };
  }

  if (hasHardNoSignal(job)) {
    return { verdict: 'no', reason: 'region-or-eligibility-exclusion' };
  }

  const loc = job.location || '';
  const desc = job.description || '';

  // Borderline → LLM (hard yes/no handled above).
  if (locationIsBareRemote(loc)) {
    return { verdict: 'review', reason: 'vague-remote-no-scope' };
  }
  if (normalize(loc).includes('remote') && desc.length < 80 && !hasRescueSignal(job)) {
    return { verdict: 'review', reason: 'remote-thin-description' };
  }
  if (normalize(loc).includes('remote') && !hasRescueSignal(job)) {
    return { verdict: 'review', reason: 'remote-no-open-region' };
  }

  if (process.env.AFRICA_RULES_LLM_MAYBE === '1') {
    if (normalize(loc).includes('remote')) {
      return { verdict: 'maybe', reason: 'unclassified-remote' };
    }
    return { verdict: 'maybe', reason: 'insufficient-signal' };
  }

  return { verdict: 'review', reason: 'insufficient-signal' };
}

/** Jobs allowed in the live Africa catalog after rules + optional model/LLM. */
export function isAfricaEligibleForCatalog(job) {
  const result = classifyAfricaJobRules(job);
  if (result.verdict === 'yes') return true;
  if (result.verdict === 'no') return false;
  return localModelYesAllowed(job);
}

export function classifyAfricaJobsRules(jobs) {
  const yes = [];
  const no = [];
  const review = [];
  const maybe = [];

  for (const job of jobs) {
    const result = classifyAfricaJobRules(job);
    const row = { ...job, africaRuleVerdict: result.verdict, africaRuleReason: result.reason };
    if (result.signal) row.africaSignal = result.signal;
    if (result.verdict === 'yes') yes.push(row);
    else if (result.verdict === 'no') no.push(row);
    else if (result.verdict === 'maybe') maybe.push(row);
    else review.push(row);
  }

  return {
    yes,
    no,
    review,
    maybe,
    stats: {
      total: jobs.length,
      yes: yes.length,
      no: no.length,
      review: review.length,
      maybe: maybe.length,
    },
  };
}
