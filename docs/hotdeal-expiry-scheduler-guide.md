# 핫딜 만료 자동 관리 시스템 가이드

핫딜의 만료 시간을 자동으로 모니터링하고 관리하는 시스템입니다.

## 🎯 주요 기능

### 1. 자동 만료 처리
- 만료된 핫딜을 'ended' 상태로 자동 변경
- 배치 처리로 대용량 데이터 효율적 처리 (500개씩)
- 만료 예정 핫딜 사전 감지 및 알림

### 2. 통계 및 모니터링
- 실시간 만료 통계 제공
- 일일/주간 리포트 자동 생성
- 시스템 상태 모니터링

### 3. 스케줄러
- Node.js 기반 내장 스케줄러
- 시스템 레벨 Cron Job 지원
- 수동 실행 옵션

## 📁 구성 요소

```
lib/services/
├── hotdeal-expiry-service.ts     # 핫딜 만료 처리 서비스
└── hotdeal-scheduler.ts          # Node.js 스케줄러

scripts/
├── process-expired-hotdeals.ts   # 배치 처리 스크립트
├── run-scheduler.ts              # 스케줄러 실행 스크립트
├── setup-cron.sh                # Cron Job 설정 스크립트
└── test-expiry-system.ts         # 시스템 테스트 스크립트
```

## 🚀 사용법

### 1. 기본 사용법

#### 통계 확인
```bash
npx tsx scripts/process-expired-hotdeals.ts --stats
```

#### 만료 예정 핫딜 조회
```bash
npx tsx scripts/process-expired-hotdeals.ts --expiring
```

#### 실제 만료 처리 (Dry Run)
```bash
npx tsx scripts/process-expired-hotdeals.ts
```

#### 실제 만료 처리 (Apply)
```bash
npx tsx scripts/process-expired-hotdeals.ts --apply
```

### 2. 스케줄러 사용법

#### 스케줄러 상태 확인
```bash
npx tsx scripts/run-scheduler.ts status
```

#### 스케줄러 시작 (포그라운드)
```bash
npx tsx scripts/run-scheduler.ts start
```

#### 스케줄러 시작 (백그라운드)
```bash
npx tsx scripts/run-scheduler.ts daemon
```

#### 수동 작업 실행
```bash
# 수동 만료 처리
npx tsx scripts/run-scheduler.ts manual-expiry

# 수동 통계 리포트
npx tsx scripts/run-scheduler.ts manual-report
```

### 3. Cron Job 설정

#### 자동 설정 스크립트 실행
```bash
./scripts/setup-cron.sh
```

#### 수동 cron job 설정
```bash
# 매시간 실행
0 * * * * cd /path/to/project && npx tsx scripts/process-expired-hotdeals.ts --apply >> logs/expiry-cron.log 2>&1

# 매일 오전 9시 실행
0 9 * * * cd /path/to/project && npx tsx scripts/process-expired-hotdeals.ts --apply >> logs/expiry-cron.log 2>&1
```

## 📊 스케줄러 일정

### Node.js 스케줄러
- **만료 처리**: 매시간 정시 (0분)
- **일일 리포트**: 매일 오전 9시
- **주간 정리**: 매주 일요일 오전 6시

### 권장 Cron Job 설정
- **개발/테스트**: 매 6시간 실행
- **프로덕션**: 매시간 실행 (권장)
- **경량 운영**: 매일 실행

## 🛠️ 고급 옵션

### 배치 처리 옵션
```bash
# 배치 크기 조정 (기본: 500)
npx tsx scripts/process-expired-hotdeals.ts --batch-size=1000

# 만료 예정 기준 시간 조정 (기본: 24시간)
npx tsx scripts/process-expired-hotdeals.ts --warning-hours=48

# 7일 내 만료 예정 조회
npx tsx scripts/process-expired-hotdeals.ts --expiring --warning-hours=168
```

### 특정 핫딜 관리
```bash
# 핫딜 만료 시간 연장 (24시간)
npx tsx scripts/process-expired-hotdeals.ts --extend=핫딜ID

# 핫딜 만료 시간 연장 (사용자 정의)
npx tsx scripts/process-expired-hotdeals.ts --extend=핫딜ID --extend-hours=48
```

## 📈 모니터링

### 로그 확인
```bash
# 실시간 로그 모니터링
tail -f logs/expiry-cron.log

# 최근 로그 확인
tail -20 logs/expiry-cron.log

# 오류 로그 필터링
grep -i error logs/expiry-cron.log
```

### 시스템 상태 체크
```bash
# 현재 cron job 확인
crontab -l | grep process-expired-hotdeals

# 프로세스 확인
ps aux | grep run-scheduler

# 디스크 사용량 확인
du -sh logs/
```

## 🚨 알림 및 예외 처리

### 자동 알림 조건
- 한 번에 50개 이상 핫딜 만료
- 100개 이상 24시간 내 만료 예정
- 처리 중 오류 발생

### 오류 대응
```bash
# 시스템 테스트 실행
npx tsx scripts/test-expiry-system.ts

# 수동 복구 처리
npx tsx scripts/process-expired-hotdeals.ts --apply --batch-size=100

# 통계 재확인
npx tsx scripts/process-expired-hotdeals.ts --stats
```

## 📝 운영 가이드

### 일일 체크리스트
1. ✅ 스케줄러 상태 확인
2. ✅ 로그 파일 크기 확인
3. ✅ 만료 통계 검토
4. ✅ 오류 로그 확인

### 주간 체크리스트
1. ✅ 로그 파일 아카이브
2. ✅ 시스템 성능 점검
3. ✅ 만료율 트렌드 분석
4. ✅ 백업 및 복구 테스트

### 월간 체크리스트
1. ✅ 스케줄러 설정 최적화
2. ✅ 데이터베이스 인덱스 최적화
3. ✅ 시스템 업데이트 검토
4. ✅ 성능 벤치마크 비교

## 🔧 문제 해결

### 자주 발생하는 문제

#### 1. Cron Job이 실행되지 않음
```bash
# cron 서비스 상태 확인
sudo service cron status

# cron 로그 확인
sudo tail /var/log/cron

# 환경 변수 문제
echo "PATH=/usr/bin:/usr/local/bin" | crontab -
```

#### 2. 스케줄러가 멈춤
```bash
# 프로세스 강제 종료
pkill -f run-scheduler

# 다시 시작
npx tsx scripts/run-scheduler.ts daemon
```

#### 3. 로그 파일 크기 과다
```bash
# 로그 로테이션 설정
sudo logrotate -f /etc/logrotate.d/hotdeal-expiry

# 수동 로그 정리
find logs/ -name "*.log" -mtime +7 -delete
```

## 📞 지원 및 문의

### 시스템 관련 문의
- 개발팀: dev@hiko.kr
- 운영팀: ops@hiko.kr

### 긴급 상황 대응
1. 🚨 즉시 수동 처리 실행
2. 📞 개발팀 연락
3. 📊 상태 로그 수집
4. 🔧 임시 조치 적용

---

*마지막 업데이트: 2025-08-04*
*버전: v1.0.0*