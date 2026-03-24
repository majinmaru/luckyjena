# Lotto GitHub Pages 버전

이 프로젝트는 Netlify Functions 없이 GitHub Pages에서 동작하도록 바꾼 버전입니다.

## 폴더 구조

```text
index.html
data/
  latest.json
  history.json
  stats.json
scripts/
  build-data.js
.github/
  workflows/
    update-lotto-data.yml
```

## 핵심 동작 방식

- 브라우저는 `data/history.json`, `data/stats.json`, `data/latest.json`만 읽습니다.
- `scripts/build-data.js`가 동행복권 회차 데이터를 받아 JSON 파일을 생성합니다.
- GitHub Actions가 매주 자동으로 data 파일을 갱신합니다.
- 확률분석 탭의 `data 파일 다시 불러오기` 버튼은 저장소에 올라온 최신 JSON을 다시 읽습니다.

## 처음 올린 뒤 해야 할 일

1. 저장소에 이 파일들을 그대로 업로드합니다.
2. `Actions` 탭에서 `Update lotto data` 워크플로를 수동 실행합니다.
3. 실행이 끝나면 `data/history.json`, `data/stats.json`, `data/latest.json`이 실제 데이터로 채워집니다.
4. GitHub Pages에서 사이트를 새로고침하고 `data 파일 다시 불러오기` 버튼을 누릅니다.

## Pages 설정

- Settings → Pages
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/(root)`

## 주의

- 동행복권 회차 데이터는 GitHub Actions가 먼저 생성해야 합니다.
- 처음 업로드 직후에는 `data/*.json`이 비어 있을 수 있습니다.
- 새 회차를 당겨오고 싶으면 Actions에서 `Update lotto data`를 다시 실행하면 됩니다.
