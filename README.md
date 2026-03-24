# Lotto GitHub Pages 작동 버전

이 버전은 GitHub Pages에서 바로 돌아가도록 **실제 회차 데이터가 이미 포함된 상태**로 만들어졌습니다.

## 핵심 방식

- 사이트는 `data/history.json`, `data/stats.json`, `data/latest.json`만 읽습니다.
- 확률분석 탭에서는 저장한 티켓 1개를 골라:
  - 각 번호의 과거 출현 퍼센티지를 표시하고
  - 그 6개 퍼센티지를 서로 곱한 값을 조합 점수처럼 보여주고
  - 과거에 **동일한 6개 조합**이 당첨된 회차가 있는지 확인합니다.
- 티켓을 조회할 때마다 전체 회차를 다시 불러오지 않습니다.
- 로컬 캐시(`localStorage`)도 사용해서 두 번째부터는 더 빠릅니다.

## 현재 포함 데이터

- 최신 반영 회차: 1216회
- 전체 회차 수: 1216회
- 최신 추첨일: 2026-03-21

## 폴더 구조

```text
index.html
data/
  history.json
  stats.json
  latest.json
scripts/
  build-data.js
.github/
  workflows/
    update-lotto-data.yml
```

## GitHub에 올릴 때

압축파일을 풀고, **안의 내용물**을 저장소 루트에 올리세요.

정상 구조:

```text
index.html
data/
scripts/
.github/
package.json
README.md
```

## Pages 설정

- Settings → Pages
- Source: Deploy from a branch
- Branch: `main`
- Folder: `/(root)`

## 데이터 업데이트

이미 데이터가 들어 있으므로 처음부터 분석이 됩니다.

새 회차를 반영하고 싶으면:
1. Actions 탭으로 이동
2. `Update lotto data` 실행
3. 사이트에서 `data 다시 불러오기` 클릭

## 참고

업데이트 스크립트는 GitHub에서 접근 가능한 공개 JSON 미러를 사용합니다.
