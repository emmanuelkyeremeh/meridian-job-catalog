import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
const forbidden = /(?:supabase|openrouter|huggingface|anthropic|cloudinary|firebase|hubstaff|dotenv|process\.env|https?\.request|\bfetch\s*\()/i;
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(file);
    else if (file.endsWith('.js') && !file.endsWith('.test.js') && forbidden.test(readFileSync(file, 'utf8'))) {
      throw new Error(`External service or environment dependency requires review: ${file}`);
    }
  }
}
scan('src'); console.log('Scope check passed: runtime contains no configured external-service integrations.');
