import { readFileSync, statSync } from 'node:fs';
import { buildCatalog } from './catalog.js';

const HELP = `Usage: npm run catalog -- <jobs.json> [--q text] [--experience intern,entry] [--verdict yes|no|review|all]

Reads local public-job records and writes a JSON catalogue to stdout.
No network requests, accounts, model calls or database connections.
Use fictional sample data for evaluation sessions. Rules are informational; check employer requirements.
`;
try {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help')) { process.stdout.write(HELP); }
  else {
    const filename = args.shift(); const options = {};
    while (args.length) {
      const flag = args.shift();
      if (!['--q', '--experience', '--verdict'].includes(flag) || !args.length || args[0].startsWith('--')) {
        throw new Error(`Unknown or incomplete option: ${flag}`);
      }
      options[flag.slice(2)] = args.shift();
    }
    if (statSync(filename).size > 20 * 1024 * 1024) throw new Error('Input file exceeds 20 MB.');
    const result = buildCatalog(JSON.parse(readFileSync(filename, 'utf8')), options);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
} catch (error) { process.stderr.write(`Meridian: ${error.message}\n`); process.exitCode = 1; }
