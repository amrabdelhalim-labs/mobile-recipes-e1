import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('static browser assets', () => {
  it('uses the Vite base path for the favicon and ships the referenced asset', () => {
    const appRoot = resolve(__dirname, '../..');
    const html = readFileSync(resolve(appRoot, 'index.html'), 'utf8');

    expect(html).toContain('href="%BASE_URL%favicon.png"');
    expect(existsSync(resolve(appRoot, 'public/favicon.png'))).toBe(true);
  });
});
