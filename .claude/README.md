# .claude

이 저장소는 Claude Code를 효과적으로 활용하기 위한 프롬프트 템플릿과 가이드라인을 제공합니다.

## 디렉토리 구조

```shell
.claude/
├── commands/ # Claude Code 명령어 모음
└── README.md
```

## 시작하기

1. 이 저장소를 클론하거나 다운로드합니다
2. 필요한 프롬프트 템플릿을 선택합니다
3. 프로젝트에 맞게 커스터마이징합니다

## 주요 내용

### `commands` 내용 정리

#### .claude/commands/ 작업 순서

1. setting-dev.md
   - 기본적인 next.js 프레임워크와 로컬애서 DB를 다룰 수 있도록 폴더 구조를 정리했습니다.
2. generate-prd.md
   - 프로젝트 정의, 타겟 사용자, 핵심 기능(3~5개), 데이터 관리, 인증&권한, 결제&비즈니스, 부가 기능을 사용자에게 입력을 받고 prd를 생성합니다.
   - 생각보다 작업 시간이 오래 걸려 클로드에서 진행하는 것이 좋을 수 도 있을 것 같습니다.
3. tech-lead.md
   - 생성한 prd를 기준으로 의존성과 핵심기능의 작업 순위를 정리하여 todo(task)를 생성합니다. -> 추후, taskmaster mcp와 같이 세세한 기능을 쪼개서 정리할 수 있도록 디벨롭할 예정입니다.
4. business-logic.md
   - 생성한 prd와 todo를 갖고, 비즈니스 로직을 생성합니다.
5. playwright-install.md
   - playwright MCP를 설치합니다.
     **프론트 진행**

---

**프론트 완료 후** 6. user-flow.md

- 생성한 프론트 코드베이스와 각 문서를 참고하여 DB생성에 도움이 되는 user-flow를 생성합니다.

7. gotobackend.md
   - 프론트를 전부 진행을 했다면, 로컬애서 supabase와 DrizzleORM을 사용하도록 생성한 모든 문서를 업데이트 하고, 폴더를 생성합니다. 이에 맞게 환경설정을 진행합니다.

### CursorRules

- Convert to CLAUDE.md

https://github.com/seungwonme/rules-converter

`npx rules-converter claude`

- 커서룰을 claude memory에 넣는 작업
- CLUADE.md 파일도 커서룰로 만들어서 깔끔하게 memory에 넣을 수 있도록 진행하면 좋을 것 같습니다.

### SupabaseRules

- 프론트 완료 후, .claude/commands/ 에서 'gotobackend'를 실행하고 사용하면 됩니다.
