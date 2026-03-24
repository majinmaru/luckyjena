#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(process.cwd(), 'data');
const SOURCE_URL = 'https://raw.githubusercontent.com/smok95/lotto/main/results/all.json';

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      'Accept': 'application/json,text/plain,*/*',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = (await res.text()).trim();
  if (!text) throw new Error(`Empty response for ${url}`);
  return JSON.parse(text);
}

function normalizeDraw(raw) {
  return {
    drwNo: Number(raw.draw_no),
    drwNoDate: String(raw.date || '').slice(0, 10),
    nums: (raw.numbers || []).map(Number).sort((a, b) => a - b),
    bonusNo: Number(raw.bonus_no || 0),
  };
}

function buildStats(history, updatedAt) {
  const freq = {};
  for (let i = 1; i <= 45; i += 1) freq[i] = 0;
  history.forEach(draw => draw.nums.forEach(n => { freq[n] += 1; }));
  return {
    latestDrwNo: history.length ? history[history.length - 1].drwNo : 0,
    totalDraws: history.length,
    updatedAt,
    freq,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const raw = await fetchJson(SOURCE_URL);
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('원본 전체 회차 데이터가 비어 있습니다.');
  }

  const history = raw.map(normalizeDraw)
    .filter(d => d.drwNo && d.nums.length === 6)
    .sort((a, b) => a.drwNo - b.drwNo);

  const updatedAt = new Date().toISOString();
  const latest = history[history.length - 1];
  const stats = buildStats(history, updatedAt);

  fs.writeFileSync(path.join(OUT_DIR, 'history.json'), JSON.stringify({
    latestDrwNo: latest.drwNo,
    totalDraws: history.length,
    updatedAt,
    draws: history,
  }, null, 2));

  fs.writeFileSync(path.join(OUT_DIR, 'stats.json'), JSON.stringify(stats, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'latest.json'), JSON.stringify({
    latestDrwNo: latest.drwNo,
    updatedAt,
    latestDraw: latest,
  }, null, 2));

  console.log(`Done. latestDrwNo=${latest.drwNo}, totalDraws=${history.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
