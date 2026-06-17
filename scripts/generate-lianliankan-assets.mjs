import fs from 'node:fs/promises';
import path from 'node:path';

const SPECS_PATH = 'src/data/lianliankanThemeSpecs.json';
const THEMES_TS_PATH = 'src/data/lianliankanThemes.ts';

const SPECS = JSON.parse(await fs.readFile(SPECS_PATH, 'utf8'));
const KEY = (await fs.readFile('docs/minimax/key', 'utf8')).trim();
const URL_API = 'https://api.minimaxi.com/v1/image_generation';
const CONCURRENCY = 4;

async function runWithPool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

async function genOne(prompt) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const r = await fetch(URL_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${KEY}`,
        },
        body: JSON.stringify({
          model: 'image-01',
          prompt,
          aspect_ratio: '1:1',
          response_format: 'url',
          n: 1,
          prompt_optimizer: true,
        }),
      });
      const j = await r.json();
      if (j.base_resp?.status_code === 0) return j.data.image_urls[0];
      throw new Error(`status ${j.base_resp?.status_code}: ${j.base_resp?.status_msg}`);
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise(r => setTimeout(r, 500 * 2 ** attempt));
    }
  }
}

async function download(url, dest) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, buf);
}

function buildThemesTs(specs) {
  const themes = specs.themes.map(t => {
    const tiles = t.items.map(it => ({
      id: `${t.id}-${it.id}`,
      image: `/static/lianliankan/${t.id}/${it.id}.jpg`,
      label: it.label,
    }));
    return `  {\n    id: '${t.id}',\n    name: '${t.name}',\n    icon: '${t.icon}',\n    tiles: [\n${tiles.map(ti => `      { id: '${ti.id}', image: '${ti.image}', label: '${ti.label}' },`).join('\n')}\n    ],\n  },`;
  }).join('\n');

  return `// 此文件由 scripts/generate-lianliankan-assets.mjs 生成，请勿手工编辑
export interface Tile {
  id: string;
  image: string;
  label: string;
}

export interface Theme {
  id: 'fruit' | 'animal' | 'transport' | 'plant';
  name: string;
  icon: string;
  tiles: Tile[];
}

export const THEMES: Theme[] = [
${themes}
];
`;
}

const failed = [];
for (const spec of SPECS.themes) {
  console.log(`\n=== theme: ${spec.name} (${spec.items.length} items) ===`);
  await runWithPool(spec.items, CONCURRENCY, async (item) => {
    const dest = `src/static/lianliankan/${spec.id}/${item.id}.jpg`;
    try {
      await fs.access(dest);
      console.log(`  ✓ skip ${item.id} (exists)`);
      return;
    } catch {}
    try {
      const url = await genOne(item.prompt);
      await download(url, dest);
      console.log(`  ✓ ${item.id}`);
    } catch (e) {
      console.error(`  ✗ ${item.id}: ${e.message}`);
      failed.push({ theme: spec.id, item: item.id, error: e.message });
    }
  });
}

await fs.mkdir('src/static/lianliankan', { recursive: true });
await fs.writeFile('src/static/lianliankan/_failed.json', JSON.stringify(failed, null, 2));
await fs.writeFile(THEMES_TS_PATH, buildThemesTs(SPECS));
console.log(`\nDone. ${failed.length} failed.`);
