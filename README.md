# GitHub Pages용 로또 티켓 기록 앱

기존 Netlify Functions 구조를 GitHub에서 바로 올릴 수 있는 정적 사이트 구조로 바꾼 버전임.

## 구성
- `index.html` : 메인 앱
- `data/latest.json` : 최신 회차 메타 정보
- `data/stats.json` : 전체 회차 누적 통계
- `scripts/build-data.js` : 동행복권 데이터를 받아 정적 JSON 생성
- `.github/workflows/update-lotto-data.yml` : GitHub Actions로 매주 자동 갱신

## GitHub에 올리는 방법
1. 이 폴더 전체를 새 GitHub 저장소에 업로드.
2. 저장소 Settings → Pages → Branch를 `main` / root 로 설정.
3. Actions 탭에서 `Update lotto data` 워크플로를 한 번 수동 실행.
4. 실행이 끝나면 `data/latest.json`, `data/stats.json`이 갱신되고 Pages에서 바로 동작.

## 로컬 테스트
정적 파일이라 아무 서버로 열면 됨.
예:
```bash
python -m http.server 8000
```
그 다음 브라우저에서 `http://localhost:8000` 접속.

## 데이터 갱신
- 자동: 매주 토요일 밤 이후 GitHub Actions 실행
- 수동: Actions → `Update lotto data` → `Run workflow`

## 왜 이렇게 바꿨는지
GitHub Pages는 Netlify Functions 같은 서버리스 함수를 직접 실행하지 못함.
그래서 함수 호출 구조를 정적 JSON 파일 기반 구조로 바꾸고, 데이터 생성은 GitHub Actions가 맡도록 변경함.
