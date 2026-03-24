#!/usr/bin/env node
/**
 * GitHub Pages용 로또 데이터 생성 스크립트
 * - 동행복권 회차별 JSON을 수집
 * - data/history.json, data/stats.json, data/latest.json 생성
 *
 * 실행:
 *   node scripts/build-data.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(process.cwd(), 'data');
const ENDPOINT = 'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  if (text.startsWith('<')) throw new Error(`HTML response for ${url}`);
  return JSON.parse(text);
}

function estimateLatestDraw() {
  const first = Date.UTC(2002, 11, 7, 11, 40); // 2002-12-07 20:40 KST
  const nowUTC = Date.now();
  const kstNow = nowUTC + 9 * 3600 * 1000;
  const todayKST = new Date(kstNow);
  const dow = todayKST.getUTCDay();
  const hour = todayKST.getUTCHours();
  const min = todayKST.getUTCMinutes();
  const drawDone = dow !== 6 || hour > 20 || (hour === 20 && min >= 50);
  const weeks = Math.floor((kstNow - first) / (7 * 24 * 3600 * 1000));
  return drawDone ? weeks + 1 : weeks;
}

async function fetchDraw(drwNo) {
  const json = await fetchJson(`${ENDPOINT}${drwNo}`);
  if (!json || json.returnValue !== 'success') {
    return null;
  }
  const nums = [
    Number(json.drwtNo1),
    Number(json.drwtNo2),
    Number(json.drwtNo3),
    Number(json.drwtNo4),
    Number(json.drwtNo5),
    Number(json.drwtNo6),
  ].sort((a, b) => a - b);

  return {
    drwNo: Number(json.drwNo),
    drwNoDate: json.drwNoDate,
    nums,
    bonusNo: Number(json.bnusNo),
  };
}

async function resolveLatestDraw() {
  let guess = estimateLatestDraw();

  for (let i = 0; i < 6; i += 1) {
    const draw = await fetchDraw(guess + 1);
    if (draw) {
      guess += 1;
      continue;
    }
    break;
  }
  while (guess > 1) {
    const draw = await fetchDraw(guess);
    if (draw) return guess;
    guess -= 1;
  }
  throw new Error('최신 회차를 확인하지 못했습니다.');
}

function buildStats(history, updatedAt) {
  const freq = {};
  for (let i = 1; i <= 45; i += 1) freq[i] = 0;

  history.forEach(draw => {
    draw.nums.forEach(n => {
      freq[n] = (freq[n] || 0) + 1;
    });
  });

  return {
    latestDrwNo: history.length ? history[history.length - 1].drwNo : 0,
    totalDraws: history.length,
    updatedAt,
    freq,
    winNums: history,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const latestDrwNo = await resolveLatestDraw();
  const history = [];
  const BATCH_DELAY = 80;

  for (let drwNo = 1; drwNo <= latestDrwNo; drwNo += 1) {
    const draw = await fetchDraw(drwNo);
    if (!draw) throw new Error(`${drwNo}회차를 불러오지 못했습니다.`);
    history.push(draw);

    if (drwNo % 50 === 0 || drwNo === latestDrwNo) {
      console.log(`Fetched ${drwNo}/${latestDrwNo}`);
    }
    await sleep(BATCH_DELAY);
  }

  const updatedAt = new Date().toISOString();
  const latest = {
    latestDrwNo,
    updatedAt,
    latestDraw: history[history.length - 1] || null,
  };
  const stats = buildStats(history, updatedAt);

  fs.writeFileSync(path.join(OUT_DIR, 'history.json'), JSON.stringify({
    latestDrwNo,
    updatedAt,
    draws: history,
  }, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'stats.json'), JSON.stringify(stats, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, 'latest.json'), JSON.stringify(latest, null, 2));

  console.log(`Done. latestDrwNo=${latestDrwNo}, totalDraws=${history.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
