# 동현주™: 출처·이용 안내

동현주는 Robot Communications의 브라우저 게임(2002~2003)으로 시작해 Success가 옮긴 Game Boy Advance판 「Zooo」(일본 2003)와 Nintendo DS판 「Zoo Keeper」(일본 2004, 해외 2005 · 해외 발매 Ignition Entertainment)로 나온 동물 얼굴 셋 맞추기 퍼즐의 **보통 모드(Normal)** 규칙에서 영감을 받은 비상업적 취미 작품이다. Zoo Keeper와 Zooo는 각 권리자(Robot Communications, Success, Ignition Entertainment 등)의 상표이자 저작물이다. 동현주는 이들과 관계가 없고 승인도 받지 않았다.

## 원작에서 가져온 것

- 규칙의 큰 틀만 참고했다: 8×8 판, 이웃한 둘만 바꾸기, 맞지 않으면 되돌아오기, 얼굴마다 정해진 수를 잡으면 다음 단계, 잡을수록 다시 차는 시간 막대, 길이 없으면 판을 새로 섞기, 쌍안경(힌트), 만능 얼굴, 누르면 한 종류를 모두 잡는 특수 칸.
- 보통 모드만 만들었다. 토코톤·퀘스트·타임어택·대전 모드는 없다.
- 원작 게임의 그림은 한 점도 쓰지 않았다. 음악·효과음, 코드, 글도 쓰지 않았다. 원작 파일과 그 일부는 이 저장소에 없다.
- 구체적인 수치(목표량 3→12, 막대 32→12초, 묶음 점수와 배수, 5,000점마다 쌍안경, 보병·반짝 판의 확률)는 동현주가 정한 것이다.

## 동현주가 새로 만든 것

- 규칙 엔진(`src/engine.js`), 얼굴 판 화면, 키보드·마우스·터치·게임패드 조작, 동현랭 단계·쌍안경 규약, 예제, 합성 효과음, 문서, 시험.
- 얼굴 여덟(포동이·슈슈·라이언·초파리·둠가이·기사·꼬리콥터·보병)은 `tools/paint.py`가 글자 격자로 새로 그렸다. 동현몬과 같은 글자 팔레트와 윤곽색으로 얼굴만 16×16으로 다시 그렸다.
- 동현랭 실행기(`src/donghyun.js`)는 [동현랭 저장소](https://github.com/Raspberry-Kim/donghyun-lang)의 v1.55를 고치지 않고 썼다. 게임패드 읽기(`src/gamepad.js`)는 동현몬의 것을 고치지 않고 썼다. 휴대폰 경험(두 번 두드려도 확대되지 않기, 판에서 끌어도 화면이 밀리지 않기, 터치로 소리 열기)은 동현텐에서 가져왔다.
- 얼굴은 모두 동현 시리즈의 식구다: 포동이(동현랭), 슈슈·라이언(동현파), 초파리(동현초), 둠가이(동현둠), 기사(동현워), 꼬리콥터(동현콥), 보병(동현전).

## 포동이

포동이는 만든 사람의 강아지다. 포동이의 이름과 모습(도트 그림 포함)에 대한 권리는 MIT 코드 라이선스와 별개로 만든 사람에게 있다. 코드를 가져다 쓸 때 포동이 그림과 이름은 바꿔 쓰기를 권한다.

## 참고한 자료

- Zoo Keeper (2003 video game) — Wikipedia: https://en.wikipedia.org/wiki/Zoo_Keeper_(2003_video_game)
- Zoo Keeper — Giant Bomb: https://giantbomb.com/wiki/Games/Zoo_Keeper
- Nintendo DS review: Zoo Keeper — WorthPlaying: https://worthplaying.com/article/2005/1/29/reviews/22078-nintendo-ds-review-zoo-keeper/
- Zoo Keeper (2003) — TV Tropes: https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/ZooKeeper2003
- Zoo Keeper DS review — Kikizo: https://games.kikizo.com/reviews/ds/zookeeper.asp
- Zooo (Game Boy Advance) — RetroAchievements: https://retroachievements.org/game/6620

## 글꼴

검은고딕 Black Han Sans · Pretendard · 나눔고딕코딩 — SIL Open Font License 1.1 (`licenses/`).

## 라이선스

동현주 코드·문서: MIT (`LICENSE`). 동현랭 실행기: MIT (`licenses/DONGHYUN-MIT.txt`).
