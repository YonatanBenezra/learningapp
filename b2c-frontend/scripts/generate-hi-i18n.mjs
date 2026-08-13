/**
 * One-off generator: builds hi.ts, marketing-hi.ts, locale-sections-hi.ts from es templates + HI map.
 * Run: node scripts/generate-hi-i18n.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, '../src/i18n/messages');

/** @type {Record<string, string>} */
const HI = JSON.parse(fs.readFileSync(path.join(__dirname, 'hi-translations.json'), 'utf8'));

function escapeTsString(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function formatObject(obj, indent = 2) {
  const pad = ' '.repeat(indent);
  const lines = ['{'];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const needsMultiline = value.length > 72 || value.includes('\n');
      if (needsMultiline && !value.includes("'")) {
        lines.push(`${pad}${key}:`);
        lines.push(`${pad}  '${escapeTsString(value)}',`);
      } else {
        lines.push(`${pad}${key}: '${escapeTsString(value)}',`);
      }
    }
  }
  lines.push(`${' '.repeat(indent - 2)}} as const;`);
  return lines.join('\n');
}

function parseExportObjects(content) {
  const results = [];
  const re = /export const (\w+) = (\{[\s\S]*?\}) as const;/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const name = m[1];
    const body = m[2];
    const keys = {};
    const keyRe = /^\s+(\w+):\s*(?:'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|([\s\S]*?)),?\s*$/gm;
    let km;
    const objText = body.slice(1, -1);
    const lines = objText.split('\n');
    let currentKey = null;
    let currentVal = '';
    for (const line of lines) {
      const single = line.match(/^\s+(\w+):\s*'((?:\\'|[^'])*)',?\s*$/);
      if (single) {
        keys[single[1]] = single[2].replace(/\\'/g, "'");
        continue;
      }
      const start = line.match(/^\s+(\w+):\s*$/);
      if (start) {
        currentKey = start[1];
        currentVal = '';
        continue;
      }
      const cont = line.match(/^\s+'((?:\\'|[^'])*)',?\s*$/);
      if (currentKey && cont) {
        keys[currentKey] = cont[1].replace(/\\'/g, "'");
        currentKey = null;
      }
    }
    results.push({ name, keys });
  }
  return results;
}

function esNameToHi(esName) {
  return esName.replace(/Es$/, 'Hi');
}

function translateKey(fullKey, esValue) {
  if (HI[fullKey]) return HI[fullKey];
  throw new Error(`Missing Hindi translation for: ${fullKey}`);
}

// --- locale-sections-hi.ts ---
const esSections = fs.readFileSync(path.join(messagesDir, 'locale-sections-es.ts'), 'utf8');
const sectionExports = parseExportObjects(esSections);
const hiSectionLines = [];
for (const { name, keys } of sectionExports) {
  const hiName = esNameToHi(name);
  const sectionPrefix = name.replace(/Es$/, '').replace(/^marketingSections/, 'marketingSections');
  const prefixMap = {
    profileEs: 'profile',
    notificationsEs: 'notifications',
    playerEs: 'player',
    assessmentRunnerEs: 'assessmentRunner',
    exercisesEs: 'exercises',
    marketplaceEs: 'marketplace',
    labsEs: 'labs',
    instructorEs: 'instructor',
    adminCommonEs: 'adminCommon',
    settingsExtraEs: 'settings',
    authExtraEs: 'authExtra',
    navbarExtraEs: 'navbarExtra',
    marketingSectionsEs: 'marketing',
  };
  const prefix = prefixMap[name] ?? name;
  const hiKeys = {};
  for (const [k, v] of Object.entries(keys)) {
    const fullKey = `${prefix}.${k}`;
    hiKeys[k] = translateKey(fullKey, v);
  }
  hiSectionLines.push(`export const ${hiName} = ${formatObject(hiKeys)}`);
  hiSectionLines.push('');
}
fs.writeFileSync(path.join(messagesDir, 'locale-sections-hi.ts'), hiSectionLines.join('\n'));

// --- marketing-hi.ts ---
const esMarketing = fs.readFileSync(path.join(messagesDir, 'marketing-es.ts'), 'utf8');
const marketingExport = parseExportObjects(esMarketing)[0];
const hiMarketingKeys = {};
for (const [k, v] of Object.entries(marketingExport.keys)) {
  hiMarketingKeys[k] = translateKey(`marketing.${k}`, v);
}
fs.writeFileSync(
  path.join(messagesDir, 'marketing-hi.ts'),
  `export const marketingHi = ${formatObject(hiMarketingKeys)}\n`,
);

// --- hi.ts inline sections from es.ts ---
const esMain = fs.readFileSync(path.join(messagesDir, 'es.ts'), 'utf8');
const inlineSections = [
  'common',
  'nav',
  'auth',
  'dashboard',
  'courses',
  'subscription',
  'createCourse',
  'assessments',
  'settings',
  'profileMenu',
  'achievements',
  'admin',
];

/** crude parse of inline object in es.ts */
function parseInlineSection(content, sectionName) {
  const re = new RegExp(`${sectionName}: \\{([\\s\\S]*?)\\n  \\},`, 'm');
  const m = content.match(re);
  if (!m) throw new Error(`Section not found: ${sectionName}`);
  const keys = {};
  const body = m[1];
  const keyRe = /^\s+(\w+):\s*'((?:\\'|[^'])*)',?\s*$/gm;
  let km;
  while ((km = keyRe.exec(body)) !== null) {
    keys[km[1]] = km[2].replace(/\\'/g, "'");
  }
  // multiline strings
  const multiRe = /^\s+(\w+):\s*\n\s+'((?:\\'|[^'])*)',/gm;
  while ((km = multiRe.exec(body)) !== null) {
    keys[km[1]] = km[2].replace(/\\'/g, "'");
  }
  return keys;
}

const hiInline = {};
for (const sec of inlineSections) {
  const keys = parseInlineSection(esMain, sec);
  hiInline[sec] = {};
  for (const [k, v] of Object.entries(keys)) {
    hiInline[sec][k] = translateKey(`${sec}.${k}`, v);
  }
}

// settings spreads settingsExtraHi - handled in hi.ts template
const hiTs = `import { marketingHi } from './marketing-hi';
import {
  profileHi,
  notificationsHi,
  playerHi,
  assessmentRunnerHi,
  exercisesHi,
  marketplaceHi,
  labsHi,
  instructorHi,
  adminCommonHi,
  settingsExtraHi,
  authExtraHi,
  navbarExtraHi,
  marketingSectionsHi,
} from './locale-sections-hi';

export const messages = {
  common: ${formatObject(hiInline.common, 4).replace('} as const;', '  },')},
  nav: ${formatObject(hiInline.nav, 4).replace('} as const;', '  },')},
  auth: ${formatObject(hiInline.auth, 4).replace('} as const;', '  },')},
  dashboard: ${formatObject(hiInline.dashboard, 4).replace('} as const;', '  },')},
  courses: ${formatObject(hiInline.courses, 4).replace('} as const;', '  },')},
  subscription: ${formatObject(hiInline.subscription, 4).replace('} as const;', '  },')},
  createCourse: ${formatObject(hiInline.createCourse, 4).replace('} as const;', '  },')},
  assessments: ${formatObject(hiInline.assessments, 4).replace('} as const;', '  },')},
  settings: {
${Object.entries(hiInline.settings)
  .map(([k, v]) => `    ${k}: '${escapeTsString(v)}',`)
  .join('\n')}
    ...settingsExtraHi,
  },
  profileMenu: ${formatObject(hiInline.profileMenu, 4).replace('} as const;', '  },')},
  achievements: ${formatObject(hiInline.achievements, 4).replace('} as const;', '  },')},
  admin: ${formatObject(hiInline.admin, 4).replace('} as const;', '  },')},
  instructor: {
    ...instructorHi,
  },
  profile: profileHi,
  notifications: notificationsHi,
  player: playerHi,
  assessmentRunner: assessmentRunnerHi,
  exercises: exercisesHi,
  marketplace: marketplaceHi,
  labs: labsHi,
  adminCommon: adminCommonHi,
  authExtra: authExtraHi,
  navbarExtra: navbarExtraHi,
  marketing: { ...marketingHi, ...marketingSectionsHi },
} as const;
`;

fs.writeFileSync(path.join(messagesDir, 'hi.ts'), hiTs);
console.log('Generated hi.ts, marketing-hi.ts, locale-sections-hi.ts');
