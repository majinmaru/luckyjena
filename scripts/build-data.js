const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUT_DIR = path.join(process.cwd(), 'data');

function fetchUrl(url, hop = 0) {
  return new Promise((resolve, reject) => {
    if (hop > 5) return reject(new Error('too many redirects'));
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, {
      timeout: 4000,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json,*/*' },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        res.resume();
        return resolve(fetchUrl(next, hop + 1));
      }
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', c => raw += c);
      res.on('end', () => {
        const t = raw.trim();
        if (!t) return reject(new Error('empty response'));
        if (t.startsWith('<')) return reject(new Error('html response'));
        try { resolve(JSON.parse(t)); }
        catch (e) { reject(new Error('json parse error: ' + t.slice(0, 80))); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function fetchDraw(drwNo) {
  return fetchUrl(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function estimateLatest() {
  const first = Date.UTC(2002, 11, 7, 11, 40);
  const nowUTC = Date.now();
  const todayKST = new Date(nowUTC + 9 * 3600 * 1000);
  const dayOfWeek = todayKST.getUTCDay();
  const hourKST = todayKST.getUTCHours();
  const minKST = todayKST.getUTCMinutes();
  const drawDone = dayOfWeek !== 6 || hourKST > 20 || (hourKST === 20 && minKST >= 50);
  const weeks = Math.floor((nowUTC + 9 * 3600 * 1000 - first) / (7 * 24 * 3600 * 1000));
  return drawDone ? weeks + 1 : weeks;
}

async function fetchBatch(numbers) {
  const CONC = 20;
  const results = [];
  for (let i = 0; i < numbers.length; i += CONC) {
    const chunk = numbers.slice(i, i + CONC);
    const settled = await Promise.allSettled(chunk.map(n => fetchDraw(n)));
    settled.forEach(r => {
      if (r.status === 'fulfilled' && r.value?.returnValue === 'success') results.push(r.value);
    });
    if (i + CONC < numbers.length) await sleep(120);
  }
  return results;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const latestDrwNo = estimateLatest();
  const numbers = Array.from({ length: latestDrwNo }, (_, i) => i + 1);
  const draws = await fetchBatch(numbers);

  const freq = {};
  for (let i = 1; i <= 45; i++) freq[i] = 0;
  const winNums = [];

  draws.forEach(d => {
    const nums = [d.drwtNo1, d.drwtNo2, d.drwtNo3, d.drwtNo4, d.drwtNo5, d.drwtNo6]
      .filter(n => n >= 1 && n <= 45)
      .sort((a, b) => a - b);
    nums.forEach(n => freq[n]++);
    winNums.push({ drwNo: d.drwNo, drwNoDate: d.drwNoDate, nums });
  });

  const now = Date.now();
  fs.writeFileSync(path.join(OUT_DIR, 'latest.json'), JSON.stringify({ latestDrwNo, updatedAt: now }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'stats.json'), JSON.stringify({
    latestDrwNo,
    totalDraws: draws.length,
    freq,
    winNums,
    updatedAt: now
  }, null, 2));

  console.log(`Done: ${draws.length} draws -> ${OUT_DIR}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
