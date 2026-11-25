#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# 매일 백업: DB(pg_dump) + 파일 볼륨(myapp_data) → ~/myapp-backup/YYYY-MM-DD/
#   14일 지난 날짜 폴더는 자동 삭제. 실패하면 exit≠0 (crontab 로그에 남음).
#   사용: deploy/backup.sh [compose 폴더, 기본 ~/bustime_atec]
#   ※ 같은 서버 디스크라 서버 고장엔 무력 → 주 1회 다른 곳(NAS 등)으로 복사 권장.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="${1:-$HOME/bustime_atec}"
DEST_ROOT="${BACKUP_DIR:-$HOME/myapp-backup}"
KEEP_DAYS=14

dest="$DEST_ROOT/$(TZ=Asia/Seoul date +%F)"
mkdir -p "$dest"
cd "$APP_DIR"

# DB 전체(스키마+데이터). 임시 파일에 쓰고 성공해야 이름 변경 → 반쪽 백업 방지.
docker compose exec -T db pg_dump -U app app | gzip > "$dest/db.sql.gz.tmp"
mv "$dest/db.sql.gz.tmp" "$dest/db.sql.gz"

# 파일 볼륨(PDF 등) 통째로. 읽기 전용으로 붙여서 묶는다.
docker run --rm -v myapp_data:/d:ro postgres:17 tar czf - -C /d . > "$dest/files.tar.gz.tmp"
mv "$dest/files.tar.gz.tmp" "$dest/files.tar.gz"

find "$DEST_ROOT" -mindepth 1 -maxdepth 1 -type d -mtime +"$KEEP_DAYS" -exec rm -rf {} +

# crontab 실행 기록(~/myapp-cron.log)은 최근 2000줄만 남긴다(로그 무한 누적 방지).
#   cron 이 이 파일을 >> 로 열고 있으므로 mv 대신 같은 파일에 덮어써서 줄인다.
LOG="${CRON_LOG:-$HOME/myapp-cron.log}"
if [ -f "$LOG" ]; then
  tail -n 2000 "$LOG" > "$LOG.tmp" && cat "$LOG.tmp" > "$LOG" && rm -f "$LOG.tmp"
fi

echo "$(date '+%F %T') 백업 완료: $dest ($(du -sh "$dest" | cut -f1))"
