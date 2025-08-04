#!/bin/bash

# 핫딜 만료 관리 시스템 Cron Job 설정 스크립트
# 이 스크립트는 시스템 레벨에서 cron job을 설정합니다

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리 확인
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT_PATH="$PROJECT_ROOT/scripts/process-expired-hotdeals.ts"
LOG_PATH="$PROJECT_ROOT/logs"

echo -e "${BLUE}🔄 핫딜 만료 관리 Cron Job 설정${NC}"
echo -e "${BLUE}=$(printf '=%.0s' {1..50})${NC}"

# 로그 디렉토리 생성
mkdir -p "$LOG_PATH"

echo -e "${CYAN}\n📍 프로젝트 정보:${NC}"
echo -e "${GRAY}  - 프로젝트 루트: $PROJECT_ROOT${NC}"
echo -e "${GRAY}  - 스크립트 경로: $SCRIPT_PATH${NC}"
echo -e "${GRAY}  - 로그 경로: $LOG_PATH${NC}"

# 스크립트 존재 여부 확인
if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}❌ 스크립트를 찾을 수 없습니다: $SCRIPT_PATH${NC}"
    exit 1
fi

# Node.js와 npx 경로 확인
NODE_PATH=$(which node)
NPX_PATH=$(which npx)

if [ -z "$NODE_PATH" ] || [ -z "$NPX_PATH" ]; then
    echo -e "${RED}❌ Node.js 또는 npx를 찾을 수 없습니다${NC}"
    echo -e "${YELLOW}Node.js가 설치되어 있는지 확인하세요${NC}"
    exit 1
fi

echo -e "${CYAN}\n🔧 시스템 환경:${NC}"
echo -e "${GRAY}  - Node.js: $NODE_PATH${NC}"
echo -e "${GRAY}  - NPX: $NPX_PATH${NC}"

# Cron job 생성
CRON_COMMAND="cd $PROJECT_ROOT && $NPX_PATH tsx $SCRIPT_PATH --apply >> $LOG_PATH/expiry-cron.log 2>&1"

echo -e "${CYAN}\n📋 Cron Job 설정:${NC}"
echo -e "${GRAY}  명령어: $CRON_COMMAND${NC}"

# Cron 표현식 설명
echo -e "${CYAN}\n⏰ 실행 스케줄 옵션:${NC}"
echo -e "${GRAY}  1. 매시간 실행 (권장): 0 * * * *${NC}"
echo -e "${GRAY}  2. 매 2시간 실행: 0 */2 * * *${NC}"
echo -e "${GRAY}  3. 매 6시간 실행: 0 */6 * * *${NC}"
echo -e "${GRAY}  4. 매일 자정 실행: 0 0 * * *${NC}"

# 사용자 선택
echo -e "${YELLOW}\n어떤 스케줄을 선택하시겠습니까?${NC}"
echo "1) 매시간 실행 (권장)"
echo "2) 매 2시간 실행"
echo "3) 매 6시간 실행" 
echo "4) 매일 자정 실행"
echo "5) 사용자 정의"
echo "6) 설정하지 않고 종료"

read -p "선택하세요 (1-6): " choice

case $choice in
    1)
        CRON_SCHEDULE="0 * * * *"
        SCHEDULE_DESC="매시간 실행"
        ;;
    2)
        CRON_SCHEDULE="0 */2 * * *"
        SCHEDULE_DESC="매 2시간 실행"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        SCHEDULE_DESC="매 6시간 실행"
        ;;
    4)
        CRON_SCHEDULE="0 0 * * *"
        SCHEDULE_DESC="매일 자정 실행"
        ;;
    5)
        echo "Cron 표현식을 입력하세요 (예: 0 * * * *):"
        read -p "표현식: " CRON_SCHEDULE
        SCHEDULE_DESC="사용자 정의 ($CRON_SCHEDULE)"
        ;;
    6)
        echo -e "${YELLOW}설정을 취소합니다${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}잘못된 선택입니다${NC}"
        exit 1
        ;;
esac

# Cron job 라인 생성
CRON_LINE="$CRON_SCHEDULE $CRON_COMMAND"

echo -e "${CYAN}\n✅ 설정될 Cron Job:${NC}"
echo -e "${GREEN}  스케줄: $SCHEDULE_DESC${NC}"
echo -e "${GRAY}  명령어: $CRON_LINE${NC}"

# 확인
echo -e "${YELLOW}\nCron Job을 설정하시겠습니까? (y/N)${NC}"
read -p "확인: " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    # 기존 cron job이 있는지 확인하고 제거
    echo -e "${CYAN}\n🔍 기존 Cron Job 확인 중...${NC}"
    
    # 현재 crontab 백업
    crontab -l > /tmp/crontab_backup.txt 2>/dev/null || echo "" > /tmp/crontab_backup.txt
    
    # 기존 핫딜 관련 cron job 제거
    grep -v "process-expired-hotdeals" /tmp/crontab_backup.txt > /tmp/crontab_new.txt || true
    
    # 새로운 cron job 추가
    echo "# 핫딜 만료 자동 관리 - $SCHEDULE_DESC" >> /tmp/crontab_new.txt
    echo "$CRON_LINE" >> /tmp/crontab_new.txt
    
    # 새로운 crontab 설치
    crontab /tmp/crontab_new.txt
    
    # 임시 파일 정리
    rm -f /tmp/crontab_backup.txt /tmp/crontab_new.txt
    
    echo -e "${GREEN}✅ Cron Job이 성공적으로 설정되었습니다!${NC}"
    
    # 설정 확인
    echo -e "${CYAN}\n📋 현재 Cron Job 목록:${NC}"
    crontab -l | grep -A1 -B1 "process-expired-hotdeals" || echo -e "${GRAY}  (관련 항목 없음)${NC}"
    
    # 로그 확인 안내
    echo -e "${CYAN}\n📊 로그 확인 방법:${NC}"
    echo -e "${GRAY}  실시간 로그: tail -f $LOG_PATH/expiry-cron.log${NC}"
    echo -e "${GRAY}  최근 로그: tail -20 $LOG_PATH/expiry-cron.log${NC}"
    
    # 수동 테스트 안내
    echo -e "${CYAN}\n🧪 수동 테스트:${NC}"
    echo -e "${GRAY}  npx tsx scripts/process-expired-hotdeals.ts --stats${NC}"
    echo -e "${GRAY}  npx tsx scripts/process-expired-hotdeals.ts --apply${NC}"
    
else
    echo -e "${YELLOW}설정을 취소했습니다${NC}"
    exit 0
fi

echo -e "${GREEN}\n🎉 Cron Job 설정이 완료되었습니다!${NC}"