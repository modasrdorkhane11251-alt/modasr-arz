#!/usr/bin/env bash
# ==============================================================================
#  💎 MODASR ARZ — نصب‌کننده و مدیریت‌گر (Installer & Manager)
#  هدف: Ubuntu 24.04 LTS  •  همچنین Ubuntu 22.04  •  Debian 11 / 12
#
#  نصب با یک دستور (به‌عنوان root):
#    bash <(curl -fsSL https://raw.githubusercontent.com/modasrdorkhane11251-alt/modasr-arz/main/install.sh)
#
#  نصب غیرتعاملی (رمز/توکن را از متغیر محیطی بدهید تا در لیست پردازه‌ها دیده نشود):
#    MODASR_TOKEN=123:ABC MODASR_PASSWORD='...' bash <(curl -fsSL URL) install --admin 111 --domain arz.example.com -y
#
#  بعد از نصب، دستور سراسری  modasr  در دسترس است.
# ==============================================================================

INSTALLER_VERSION="2.1.0"
DEFAULT_REPO="https://github.com/modasrdorkhane11251-alt/modasr-arz.git"

APP_NAME="modasr-bot"
CONF_FILE="/etc/modasr.conf"
LOG_FILE="/var/log/modasr-install.log"
CLI_PATH="/usr/local/bin/modasr"
BACKUP_DIR="/root/modasr-backups"
NGINX_SITE="/etc/nginx/sites-available/modasr"
LOGROTATE_FILE="/etc/logrotate.d/modasr"

# تنظیمات ذخیره‌شده‌ی نصب قبلی (INSTALL_DIR / REPO_URL / BRANCH)
[ -f "$CONF_FILE" ] && . "$CONF_FILE"
INSTALL_DIR="${MODASR_DIR:-${INSTALL_DIR:-/opt/modasr-arz}}"
REPO_URL="${MODASR_REPO:-${REPO_URL:-$DEFAULT_REPO}}"
BRANCH="${MODASR_BRANCH:-${BRANCH:-}}"

# پارامترهای خط فرمان
A_TOKEN="${MODASR_TOKEN:-}"; A_ADMIN=""; A_NAME=""; A_DOMAIN=""; A_CHANNEL=""; A_PASSWORD="${MODASR_PASSWORD:-}"; A_PORT=""; A_EMAIL="${MODASR_EMAIL:-}"
ASSUME_YES=0; NO_SSL=0; NO_FIREWALL=0; PURGE=0; FORCE=0; RESTORE_FILE=""

# رنگ‌ها
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; CYAN=$'\033[0;36m'; YELLOW=$'\033[1;33m'
PURPLE=$'\033[0;35m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; NC=$'\033[0m'

# ------------------------------------------------------------------------------
# ابزارهای نمایش
# ------------------------------------------------------------------------------
say()  { echo -e "$*"; }
ok()   { echo -e "  ${GREEN}✔${NC} $*"; }
warn() { echo -e "  ${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "  ${RED}✘${NC} $*" >&2; }
die()  { err "$*"; exit 1; }
step() { echo -e "\n${PURPLE}${BOLD}▶ $*${NC}"; }

banner() {
  clear 2>/dev/null || true
  echo -e "${CYAN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════════════════╗"
  echo "  ║                                                              ║"
  echo "  ║        💎  MODASR ARZ  —  Gold • Forex • Crypto Bot          ║"
  echo "  ║            ربات و مینی‌اپ نرخ لحظه‌ای تلگرام                  ║"
  echo "  ║                                                              ║"
  echo "  ╚══════════════════════════════════════════════════════════════╝"
  echo -e "${NC}${DIM}  installer v${INSTALLER_VERSION}${NC}\n"
}

# اجرای بی‌صدا یک دستور/تابع با نمایش وضعیت؛ خروجی کامل در لاگ ذخیره می‌شود
run_quiet() {
  local desc="$1"; shift
  printf "  ${CYAN}⏳ %s...${NC}" "$desc"
  if "$@" >>"$LOG_FILE" 2>&1; then
    printf "\r  ${GREEN}✔ %s${NC}\033[K\n" "$desc"
    return 0
  fi
  printf "\r  ${RED}✘ %s${NC}\033[K\n" "$desc"
  echo -e "${YELLOW}  ── آخرین خطوط لاگ (${LOG_FILE}) ──${NC}"
  tail -n 15 "$LOG_FILE" | sed 's/^/    /'
  return 1
}

confirm() { # confirm "سوال" [default y|n]
  local q="$1" def="${2:-y}" ans hint="Y/n"
  [ "$def" = "n" ] && hint="y/N"
  [ "$ASSUME_YES" = "1" ] && return 0
  if [ ! -t 0 ]; then [ "$def" = "y" ]; return; fi
  read -r -p "$(echo -e "  ${YELLOW}?${NC} ${q} [${hint}]: ")" ans
  ans="${ans:-$def}"
  [[ "$ans" =~ ^[Yy]$ ]]
}

# ------------------------------------------------------------------------------
# اعتبارسنجی ورودی‌ها
# ------------------------------------------------------------------------------
valid_token()      { [[ "$1" =~ ^[0-9]{6,12}:[A-Za-z0-9_-]{30,}$ ]]; }
valid_admin()      { [[ "$1" =~ ^[0-9]{5,15}$ ]]; }
valid_domain()     { [[ "$1" =~ ^([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$ ]]; }
valid_domain_opt() { [ -z "$1" ] || valid_domain "$1"; }
valid_channel_opt(){ [ -z "$1" ] || [[ "$1" =~ ^@[A-Za-z][A-Za-z0-9_]{4,31}$ ]]; }
valid_port()       { [[ "$1" =~ ^[0-9]+$ ]] && [ "$1" -ge 1 ] && [ "$1" -le 65535 ]; }
valid_password()   { [ "${#1}" -ge 8 ] && [[ "$1" != *\"* ]] && [[ "$1" != *\\* ]]; }

prompt() { # prompt VAR "برچسب" "پیش‌فرض" validator "پیام خطا"
  local var="$1" label="$2" def="$3" validator="$4" errmsg="$5" val
  while true; do
    if [ -n "$def" ]; then
      read -r -p "$(echo -e "  ${CYAN}›${NC} ${label} [${def}]: ")" val; val="${val:-$def}"
    else
      read -r -p "$(echo -e "  ${CYAN}›${NC} ${label}: ")" val
    fi
    if [ -z "$validator" ] || "$validator" "$val"; then
      printf -v "$var" '%s' "$val"; return 0
    fi
    err "$errmsg"
  done
}

gen_password() { head -c 96 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 20; }
gen_secret()   { openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n' | head -c 64; }

# ------------------------------------------------------------------------------
# ابزارهای فایل .env
# ------------------------------------------------------------------------------
get_env() { # get_env KEY
  [ -f "$INSTALL_DIR/.env" ] || return 0
  grep -E "^$1=" "$INSTALL_DIR/.env" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'
}

set_env() { # set_env KEY VALUE
  local file="$INSTALL_DIR/.env"
  [ -f "$file" ] || { : > "$file"; chmod 600 "$file"; }
  SETENV_K="$1" SETENV_V="$2" awk '
    BEGIN { k = ENVIRON["SETENV_K"]; v = ENVIRON["SETENV_V"]; found = 0 }
    index($0, k "=") == 1 { print k "=\"" v "\""; found = 1; next }
    { print }
    END { if (!found) print k "=\"" v "\"" }
  ' "$file" > "$file.tmp" && mv "$file.tmp" "$file" && chmod 600 "$file"
}

# مقدارهای امنیتی جدید را در نصب‌های قدیمی هم به‌صورت خودکار می‌سازد (بدون دست زدن به مقدارهای موجود)
ensure_env_defaults() {
  [ -n "$(get_env SESSION_SECRET)" ]     || set_env SESSION_SECRET "$(gen_secret)"
  [ -n "$(get_env SESSION_TTL_HOURS)" ]  || set_env SESSION_TTL_HOURS "24"
  [ -n "$(get_env DISABLE_TUNNEL)" ]     || set_env DISABLE_TUNNEL "$([ -n "$(get_env DOMAIN)" ] && echo true || echo false)"
  chmod 600 "$INSTALL_DIR/.env" 2>/dev/null || true
}

# ------------------------------------------------------------------------------
# بررسی‌های اولیه سیستم
# ------------------------------------------------------------------------------
need_root() { [ "$(id -u)" -eq 0 ] || die "این دستور باید با کاربر root اجرا شود (ابتدا «sudo -i» بزنید)."; }

check_os() {
  command -v apt-get >/dev/null 2>&1 || die "فقط سیستم‌های Ubuntu/Debian پشتیبانی می‌شوند."
  if [ -f /etc/os-release ]; then
    . /etc/os-release
    case "$ID" in
      ubuntu|debian) ok "سیستم‌عامل: ${PRETTY_NAME}" ;;
      *) warn "سیستم‌عامل ${PRETTY_NAME} تست نشده است؛ ادامه می‌دهیم." ;;
    esac
  fi
}

installed() { [ -d "$INSTALL_DIR/.git" ] && [ -f "$INSTALL_DIR/.env" ]; }
need_installed() { installed || die "ربات هنوز نصب نشده است (مسیر: $INSTALL_DIR). ابتدا «modasr install» را اجرا کنید."; }

public_ip() {
  curl -s --max-time 6 https://api.ipify.org 2>/dev/null \
    || curl -s --max-time 6 https://ifconfig.me 2>/dev/null \
    || hostname -I 2>/dev/null | awk '{print $1}'
}

resolve_ip() { getent ahostsv4 "$1" 2>/dev/null | awk '{print $1; exit}'; }

# ------------------------------------------------------------------------------
# تلگرام
# ------------------------------------------------------------------------------
BOT_USERNAME=""; BOT_NAME=""
tg_getme() { # tg_getme TOKEN  -> 0 معتبر | 1 نامعتبر | 2 عدم اتصال
  local resp
  resp="$(curl -s --max-time 12 "https://api.telegram.org/bot$1/getMe" 2>/dev/null)"
  [ -z "$resp" ] && return 2
  echo "$resp" | grep -q '"ok":true' || return 1
  BOT_USERNAME="$(echo "$resp" | grep -o '"username":"[^"]*' | cut -d'"' -f4)"
  BOT_NAME="$(echo "$resp" | grep -o '"first_name":"[^"]*' | cut -d'"' -f4)"
  return 0
}

# ------------------------------------------------------------------------------
# مراحل نصب
# ------------------------------------------------------------------------------
APT="env DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=180 -y"

pkg_base()  { $APT update && $APT install curl git ca-certificates build-essential openssl fontconfig fonts-dejavu-core logrotate; }
pkg_nginx() { $APT install nginx certbot python3-certbot-nginx; }

# Vite 8 به Node ‎>=20.19 یا ‎>=22.12 نیاز دارد
node_ok() {
  command -v node >/dev/null 2>&1 || return 1
  local v maj min; v="$(node -v | tr -d v)"; maj="${v%%.*}"; min="${v#*.}"; min="${min%%.*}"
  { [ "$maj" -eq 20 ] && [ "$min" -ge 19 ]; } || { [ "$maj" -eq 22 ] && [ "$min" -ge 12 ]; } || [ "$maj" -gt 22 ]
}
install_node() {
  curl -fsSL --retry 3 --retry-delay 2 https://deb.nodesource.com/setup_22.x -o /tmp/nodesource_setup.sh \
    && bash /tmp/nodesource_setup.sh && rm -f /tmp/nodesource_setup.sh && $APT install nodejs
}
install_pm2() { npm install -g pm2; }

fetch_code() {
  if [ -d "$INSTALL_DIR/.git" ]; then
    git -C "$INSTALL_DIR" fetch --quiet origin ${BRANCH:+"$BRANCH"} \
      && git -C "$INSTALL_DIR" reset --hard FETCH_HEAD
  else
    if [ -e "$INSTALL_DIR" ] && [ -n "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
      echo "مسیر $INSTALL_DIR از قبل وجود دارد و خالی نیست." >&2; return 1
    fi
    git clone ${BRANCH:+-b "$BRANCH"} "$REPO_URL" "$INSTALL_DIR"
  fi
}

npm_install() {
  # با وجود package-lock.json نسخه‌ها دقیقاً قفل می‌شوند (npm ci)؛ در غیر این صورت npm install
  if [ -f "$INSTALL_DIR/package-lock.json" ]; then
    (cd "$INSTALL_DIR" && npm ci --no-audit --no-fund)
  else
    (cd "$INSTALL_DIR" && npm install --no-audit --no-fund)
  fi
}
npm_build()   { (cd "$INSTALL_DIR" && npm run build); }

pm2_start() {
  (cd "$INSTALL_DIR" && pm2 delete "$APP_NAME" >/dev/null 2>&1; pm2 start ecosystem.config.cjs && pm2 save)
}
pm2_boot() {
  pm2 startup systemd -u root --hp /root || true
  pm2 save
  systemctl enable pm2-root >/dev/null 2>&1 || true
  systemctl is-enabled pm2-root >/dev/null 2>&1   # 0 = بعد از ریبوت خودکار بالا می‌آید
}

# چرخش لاگ‌ها (PM2 + لاگ نصب) تا دیسک پر نشود
write_logrotate() {
  cat > "$LOGROTATE_FILE" <<LOGEOF
${PM2_HOME:-/root/.pm2}/logs/*.log /var/log/modasr-install.log {
    daily
    rotate 14
    maxsize 50M
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
    su root root
}
LOGEOF
}

# سرورهای ۵۱۲MB–۱GB هنگام build (vite) بدون swap از کار می‌افتند
ensure_swap() {
  local mem_mb swap_mb
  mem_mb="$(awk '/MemTotal/{print int($2/1024)}' /proc/meminfo)"
  swap_mb="$(awk '/SwapTotal/{print int($2/1024)}' /proc/meminfo)"
  [ "${mem_mb:-0}" -ge 1900 ] && return 0
  [ "${swap_mb:-0}" -gt 0 ] && return 0
  [ -e /swapfile ] && return 0
  (fallocate -l 1G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=1024 status=none) \
    && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile \
    && { grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab; }
}

migrate_legacy_data() {
  local old="" d
  for d in /root/modasr-arz /home/*/modasr-arz; do
    [ -d "$d/data" ] && [ "$d" != "$INSTALL_DIR" ] && { old="$d"; break; }
  done
  [ -z "$old" ] && return 0
  [ -f "$INSTALL_DIR/data/users.txt" ] && return 0
  if confirm "نصب قدیمی در $old پیدا شد. کاربران و گروه‌ها منتقل شوند؟" y; then
    mkdir -p "$INSTALL_DIR/data"
    local f
    for f in users.txt groups.txt blocked.txt bot_status.txt emoji_config.json; do
      [ -f "$old/data/$f" ] && cp "$old/data/$f" "$INSTALL_DIR/data/$f"
    done
    ok "داده‌های قبلی منتقل شد."
  fi
}

write_data_configs() {
  local d="$INSTALL_DIR/data"; mkdir -p "$d"
  if [ ! -f "$d/channel_poster_config.json" ]; then
    if [ -n "$CHANNEL_ID" ]; then
      cat > "$d/channel_poster_config.json" <<EOF
{
  "isEnabled": true,
  "channelId": "${CHANNEL_ID}",
  "intervalMinutes": 60,
  "postMode": "image_card_and_summary",
  "lastPostStatus": "pending"
}
EOF
    else
      cat > "$d/channel_poster_config.json" <<EOF
{
  "isEnabled": false,
  "channelId": "",
  "intervalMinutes": 60,
  "postMode": "image_card_and_summary",
  "lastPostStatus": "pending"
}
EOF
    fi
  fi
  if [ ! -f "$d/ad_config.json" ]; then
    if [ -n "$CHANNEL_ID" ]; then
      cat > "$d/ad_config.json" <<EOF
{
  "buttonText": "📢 عضویت در کانال رسمی ↗️",
  "buttonUrl": "https://t.me/${CHANNEL_ID#@}",
  "headerIntro": "MØD†SR.lua ᶻ z ƪARZ",
  "isEnabled": true,
  "enableCharts": true,
  "watermarkTag": "${CHANNEL_ID}"
}
EOF
    else
      cat > "$d/ad_config.json" <<EOF
{
  "buttonText": "",
  "buttonUrl": "",
  "headerIntro": "MØD†SR.lua ᶻ z ƪARZ",
  "isEnabled": false,
  "enableCharts": true,
  "watermarkTag": ""
}
EOF
    fi
  fi
  if [ ! -f "$d/admin_alert_config.json" ]; then
    cat > "$d/admin_alert_config.json" <<EOF
{
  "isEnabled": true,
  "adminId": ${ADMIN_ID},
  "notifyOnApiErrors": true,
  "notifyOnTelegramErrors": true,
  "notifyOnChannelErrors": true,
  "notifyOnUserBugReports": true,
  "minSeverity": "all",
  "rateLimitMinutes": 2
}
EOF
  fi
}

write_nginx() {
  # ریت‌لیمیت (باید در محدوده‌ی http باشد → conf.d)
  cat > /etc/nginx/conf.d/modasr-ratelimit.conf <<'EOF'
limit_req_zone $binary_remote_addr zone=modasr_api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=modasr_login:10m rate=5r/m;
map $http_upgrade $modasr_connection_upgrade { default upgrade; '' close; }
EOF
  cat > "$NGINX_SITE" <<'EOF'
server {
    listen 80;
    server_name __DOMAIN__;
    client_max_body_size 21m;   # بزرگ‌ترین درخواست مجاز: بازیابی بک‌آپ (۲۰MB)
    limit_req_status 429;
    client_header_timeout 15s;
    client_body_timeout 30s;

    # هدرهای امنیتی (X-Frame-Options عمداً نیست؛ مینی‌اپ داخل تلگرام وب باز می‌شود)
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    server_tokens off;

    # صفحه‌ی ورود پنل: حداکثر ۵ تلاش در دقیقه برای هر آی‌پی
    location = /api/auth/login {
        limit_req zone=modasr_login burst=5 nodelay;
        proxy_pass http://127.0.0.1:__PORT__;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        limit_req zone=modasr_api burst=80 nodelay;
        proxy_pass http://127.0.0.1:__PORT__;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $modasr_connection_upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
  sed -i "s/__DOMAIN__/${DOMAIN_NAME}/g; s/__PORT__/${APP_PORT}/g" "$NGINX_SITE"
  ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/modasr
  nginx -t && systemctl enable --now nginx && systemctl reload nginx
}

# فایروال + Fail2Ban (پورت SSH به‌صورت خودکار تشخیص داده می‌شود تا قفل نشوید)
ssh_ports() {
  { sshd -T 2>/dev/null | awk '/^port /{print $2}'
    ss -H -ltnp 2>/dev/null | awk '/"sshd"/{n=split($4,a,":"); print a[n]}'
  } | sort -un | tr '\n' ' '
}

harden_server() {
  local ports p; ports="$(ssh_ports)"; ports="${ports:-22}"
  $APT install ufw fail2ban || return 1
  ufw default deny incoming  >/dev/null || return 1
  ufw default allow outgoing >/dev/null || return 1
  for p in $ports; do ufw limit "${p}/tcp" >/dev/null || return 1; done   # SSH + محدودیت تلاش اتصال
  ufw allow 80/tcp >/dev/null && ufw allow 443/tcp >/dev/null || return 1
  [ -z "$DOMAIN_NAME" ] && ufw allow "${APP_PORT}/tcp" >/dev/null
  ufw --force enable >/dev/null || return 1
  local jail_ports; jail_ports="$(echo $ports | tr ' ' ',')"
  cat > /etc/fail2ban/jail.d/modasr.conf <<F2BEOF
[sshd]
enabled = true
backend = systemd
port = ${jail_ports}
maxretry = 5
findtime = 10m
bantime = 1h
F2BEOF
  # ریت‌لیمیت Nginx (اسکنرها / فشار روی ورود پنل) → بن موقت؛ فقط وقتی لاگ Nginx وجود دارد
  if [ -n "$DOMAIN_NAME" ] && [ -f /var/log/nginx/error.log ]; then
    cat >> /etc/fail2ban/jail.d/modasr.conf <<F2BEOF

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 20
findtime = 10m
bantime = 1h
F2BEOF
  fi
  systemctl enable --now fail2ban && systemctl restart fail2ban
}

issue_ssl() { # issue_ssl DOMAIN
  local mail_args=(--register-unsafely-without-email)
  [ -n "$A_EMAIL" ] && mail_args=(--email "$A_EMAIL")
  certbot --nginx -d "$1" --non-interactive --agree-tos "${mail_args[@]}" \
    --redirect --keep-until-expiring || return 1
  systemctl enable --now certbot.timer >/dev/null 2>&1 || true   # تمدید خودکار
}

install_cli() {
  local src="$INSTALL_DIR/install.sh"
  [ -f "$src" ] || return 0
  cp "$src" "${CLI_PATH}.tmp" && chmod 755 "${CLI_PATH}.tmp" && mv -f "${CLI_PATH}.tmp" "$CLI_PATH"
  cat > "$CONF_FILE" <<EOF
INSTALL_DIR="${INSTALL_DIR}"
REPO_URL="${REPO_URL}"
BRANCH="${BRANCH}"
EOF
}

wait_healthy() {
  local port="$1" i
  for i in $(seq 1 40); do
    curl -fs --max-time 3 "http://127.0.0.1:${port}/health" 2>/dev/null | grep -q '"status":"ok"' && return 0
    sleep 1
  done
  return 1
}

# ------------------------------------------------------------------------------
# دستور: install
# ------------------------------------------------------------------------------
collect_inputs() {
  step "اطلاعات ربات"

  # توکن
  BOT_TOKEN=""
  if [ -n "$A_TOKEN" ]; then
    valid_token "$A_TOKEN" || die "فرمت توکن نامعتبر است."
    tg_getme "$A_TOKEN"; local rc=$?
    [ $rc -eq 1 ] && die "تلگرام این توکن را نپذیرفت."
    [ $rc -eq 2 ] && die "اتصال به api.telegram.org برقرار نشد (فیلترینگ یا قطعی شبکه سرور)."
    BOT_TOKEN="$A_TOKEN"
  else
    [ -t 0 ] || die "در حالت غیرتعاملی باید --token را بدهید."
    while true; do
      prompt BOT_TOKEN "توکن ربات (از @BotFather)" "" valid_token "فرمت توکن درست نیست (مثال: 123456789:AAxxxx...)"
      printf "  ${YELLOW}⏳ اعتبارسنجی توکن...${NC}"
      tg_getme "$BOT_TOKEN"; local rc=$?
      if [ $rc -eq 0 ]; then printf "\r\033[K"; break; fi
      printf "\r\033[K"
      [ $rc -eq 2 ] && err "اتصال به تلگرام برقرار نشد." || err "تلگرام این توکن را نپذیرفت."
    done
  fi
  ok "ربات تأیید شد: ${BOLD}${BOT_NAME}${NC} (@${BOT_USERNAME})"
  [ -n "$A_NAME" ] && BOT_USERNAME="${A_NAME#@}"

  # آیدی ادمین
  ADMIN_ID=""
  if [ -n "$A_ADMIN" ]; then
    valid_admin "$A_ADMIN" || die "آیدی ادمین باید عدد باشد."
    ADMIN_ID="$A_ADMIN"
  else
    [ -t 0 ] || die "در حالت غیرتعاملی باید --admin را بدهید."
    say "  ${DIM}آیدی عددی خود را از ربات @userinfobot بگیرید.${NC}"
    prompt ADMIN_ID "آیدی عددی ادمین" "" valid_admin "آیدی باید فقط عدد باشد."
  fi

  # کانال
  CHANNEL_ID=""
  if [ -n "$A_CHANNEL" ]; then
    valid_channel_opt "$A_CHANNEL" || die "فرمت کانال نامعتبر است (مثال: @MyChannel)."
    CHANNEL_ID="$A_CHANNEL"
  elif [ -t 0 ]; then
    say "  ${DIM}ربات باید در کانال ادمین باشد. برای رد کردن Enter بزنید.${NC}"
    prompt CHANNEL_ID "کانال ارسال ساعتی (مثال: @MyChannel)" "" valid_channel_opt "فرمت درست: @MyChannel"
  fi

  step "دامنه و پورت"
  DOMAIN_NAME=""
  if [ -n "$A_DOMAIN" ]; then
    valid_domain "$A_DOMAIN" || die "دامنه نامعتبر است."
    DOMAIN_NAME="$A_DOMAIN"
  elif [ -t 0 ]; then
    say "  ${DIM}دامنه‌ی شما باید از قبل به IP همین سرور وصل شده باشد (رکورد A).${NC}"
    say "  ${DIM}برای مینی‌اپ تلگرام و SSL دامنه لازم است. بدون دامنه Enter بزنید.${NC}"
    prompt DOMAIN_NAME "دامنه / ساب‌دامین" "" valid_domain_opt "فرمت دامنه نامعتبر است (مثال: arz.example.com)"
  fi

  APP_PORT="3000"
  if [ -n "$A_PORT" ]; then
    valid_port "$A_PORT" || die "پورت نامعتبر است."
    APP_PORT="$A_PORT"
  elif [ -t 0 ]; then
    prompt APP_PORT "پورت برنامه" "3000" valid_port "پورت باید عددی بین 1 و 65535 باشد."
  fi

  step "رمز پنل مدیریت"
  ADMIN_PASSWORD=""; GENERATED_PASS=0
  if [ -n "$A_PASSWORD" ]; then
    valid_password "$A_PASSWORD" || die "رمز باید حداقل ۸ کاراکتر باشد و شامل \" یا \\ نباشد."
    ADMIN_PASSWORD="$A_PASSWORD"
  elif [ -t 0 ]; then
    local p1 p2
    say "  ${DIM}حداقل ۸ کاراکتر. برای ساخت رمز تصادفی Enter بزنید.${NC}"
    while true; do
      read -r -s -p "$(echo -e "  ${CYAN}›${NC} رمز پنل: ")" p1; echo ""
      if [ -z "$p1" ]; then ADMIN_PASSWORD="$(gen_password)"; GENERATED_PASS=1; break; fi
      if ! valid_password "$p1"; then err "رمز ضعیف یا نامعتبر است (حداقل ۸ کاراکتر، بدون \" و \\)."; continue; fi
      read -r -s -p "$(echo -e "  ${CYAN}›${NC} تکرار رمز: ")" p2; echo ""
      [ "$p1" = "$p2" ] && { ADMIN_PASSWORD="$p1"; break; }
      err "دو رمز یکسان نیستند."
    done
  else
    ADMIN_PASSWORD="$(gen_password)"; GENERATED_PASS=1
  fi
  [ "$GENERATED_PASS" = "1" ] && ok "رمز تصادفی ساخته شد."
}

cmd_install() {
  need_root
  : > "$LOG_FILE"; chmod 600 "$LOG_FILE"
  banner
  step "بررسی سیستم"
  check_os
  collect_inputs

  # مرور نهایی
  step "خلاصه‌ی نصب"
  say "  ربات:      @${BOT_USERNAME}"
  say "  ادمین:     ${ADMIN_ID}"
  say "  کانال:     ${CHANNEL_ID:-—}"
  say "  دامنه:     ${DOMAIN_NAME:-— (دسترسی با IP)}"
  say "  پورت:      ${APP_PORT}"
  say "  مسیر نصب:  ${INSTALL_DIR}"
  echo ""
  confirm "نصب شروع شود؟" y || die "نصب لغو شد."

  # بررسی دی‌ان‌اس قبل از هر کاری
  local DO_SSL=0 SERVER_IP DNS_IP
  SERVER_IP="$(public_ip)"
  if [ -n "$DOMAIN_NAME" ] && [ "$NO_SSL" != "1" ]; then
    DNS_IP="$(resolve_ip "$DOMAIN_NAME")"
    if [ -n "$DNS_IP" ] && [ "$DNS_IP" = "$SERVER_IP" ]; then
      ok "دی‌ان‌اس درست است: ${DOMAIN_NAME} → ${DNS_IP}"
      DO_SSL=1
    else
      warn "دامنه ${DOMAIN_NAME} به ${DNS_IP:-هیچ آی‌پی‌ای} اشاره می‌کند ولی آی‌پی این سرور ${SERVER_IP} است."
      warn "صدور SSL الان شکست می‌خورد. بعد از اصلاح رکورد A، دستور «modasr ssl» را بزنید."
    fi
  fi

  step "نصب پیش‌نیازها"
  run_quiet "آماده‌سازی swap (فقط برای RAM کم)" ensure_swap || warn "ساخت swap ممکن نشد؛ اگر build با کمبود حافظه شکست خورد، swap دستی بسازید."
  run_quiet "به‌روزرسانی و نصب بسته‌های سیستم" pkg_base || exit 1
  if node_ok; then ok "Node.js $(node -v) آماده است"; else run_quiet "نصب Node.js 22" install_node || exit 1; fi
  if command -v pm2 >/dev/null 2>&1; then ok "PM2 آماده است"; else run_quiet "نصب PM2" install_pm2 || exit 1; fi

  step "دریافت و ساخت پروژه"
  pm2 delete "$APP_NAME" >/dev/null 2>&1 || true
  run_quiet "دریافت کد از گیت‌هاب" fetch_code || exit 1
  [ -z "$BRANCH" ] && BRANCH="$(git -C "$INSTALL_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)"

  if ss -ltn 2>/dev/null | grep -qE "[:.]${APP_PORT}[[:space:]]"; then
    die "پورت ${APP_PORT} توسط برنامه‌ی دیگری استفاده می‌شود. پورت دیگری انتخاب کنید (--port)."
  fi

  migrate_legacy_data
  set_env BOT_TOKEN "$BOT_TOKEN"
  set_env ADMIN_ID "$ADMIN_ID"
  set_env BOT_USERNAME "$BOT_USERNAME"
  set_env ADMIN_PASSWORD "$ADMIN_PASSWORD"
  set_env PORT "$APP_PORT"
  set_env DOMAIN "$DOMAIN_NAME"
  ensure_env_defaults
  ok "فایل .env با دسترسی محدود ساخته شد"
  write_data_configs

  run_quiet "نصب وابستگی‌های npm" npm_install || exit 1
  run_quiet "ساخت نسخه‌ی نهایی (build)" npm_build || exit 1

  step "اجرای سرویس"
  run_quiet "راه‌اندازی با PM2" pm2_start || exit 1
  run_quiet "فعال‌سازی اجرای خودکار بعد از ریبوت" pm2_boot || warn "اجرای خودکار بعد از ریبوت تأیید نشد؛ «modasr doctor» را بزنید."
  run_quiet "تنظیم چرخش لاگ‌ها (logrotate)" write_logrotate || warn "logrotate تنظیم نشد."

  if [ -n "$DOMAIN_NAME" ]; then
    step "وب‌سرور و SSL"
    run_quiet "نصب Nginx و Certbot" pkg_nginx || warn "نصب Nginx ناموفق بود."
    run_quiet "پیکربندی Nginx برای ${DOMAIN_NAME}" write_nginx || warn "پیکربندی Nginx ناموفق بود."
    if [ "$DO_SSL" = "1" ]; then
      run_quiet "صدور گواهی SSL رایگان (Let's Encrypt)" issue_ssl "$DOMAIN_NAME" \
        || warn "SSL صادر نشد. بعد از رفع مشکل، «modasr ssl» را بزنید."
    fi
  fi

  if [ "$NO_FIREWALL" != "1" ]; then
    step "امنیت سرور"
    if confirm "فایروال (UFW) و Fail2Ban فعال شود؟ (پورت SSH خودکار باز می‌ماند)" y; then
      run_quiet "فعال‌سازی UFW و Fail2Ban" harden_server || warn "سخت‌سازی سرور ناموفق بود؛ نصب ادامه پیدا می‌کند."
    fi
  fi

  install_cli
  step "بررسی نهایی"
  if wait_healthy "$APP_PORT"; then ok "سرویس بالا آمد و پاسخ می‌دهد (/health)"; else
    warn "سرویس هنوز پاسخ نمی‌دهد. لاگ‌ها را ببینید:  modasr logs"
  fi

  local PANEL_URL MINI_URL SSL_STATE="Not active" RUN_STATE="Starting"
  if [ -n "$DOMAIN_NAME" ]; then
    if [ -f "/etc/letsencrypt/live/${DOMAIN_NAME}/fullchain.pem" ]; then
      PANEL_URL="https://${DOMAIN_NAME}"; SSL_STATE="Active"
    else
      PANEL_URL="http://${DOMAIN_NAME}"
    fi
  else
    PANEL_URL="http://${SERVER_IP}:${APP_PORT}"; SSL_STATE="— (no domain)"
    warn "بدون دامنه، پنل روی HTTP ساده است و رمز رمزنگاری‌نشده می‌رود. برای استفاده‌ی واقعی دامنه + SSL بگیرید (modasr ssl --domain ...)."
  fi
  MINI_URL="${PANEL_URL}/mini-modasr-arz"
  curl -fs --max-time 4 "http://127.0.0.1:${APP_PORT}/health" 2>/dev/null | grep -q '"status":"ok"' && RUN_STATE="Running"

  echo -e "\n${GREEN}${BOLD}  ╔══════════════════════════════════════════════════════════════╗"
  echo -e "  ║           ✅  MODASR ARZ Installed Successfully              ║"
  echo -e "  ╚══════════════════════════════════════════════════════════════╝${NC}\n"
  say "  ${BOLD}Panel:${NC}      ${PANEL_URL}"
  say "  ${BOLD}Mini App:${NC}   ${MINI_URL}"
  say "  ${BOLD}Telegram:${NC}   Connected (@${BOT_USERNAME}) • Long Polling"
  say "  ${BOLD}Storage:${NC}    OK (${INSTALL_DIR}/data)"
  say "  ${BOLD}SSL:${NC}        ${SSL_STATE}"
  say "  ${BOLD}Status:${NC}     ${RUN_STATE}"
  echo ""
  say "  🔐 رمز پنل:  ${BOLD}${ADMIN_PASSWORD}${NC}"
  [ "$GENERATED_PASS" = "1" ] && warn "این رمز تصادفی است؛ همین حالا جایی ذخیره‌اش کنید (تغییر: modasr passwd)."
  [ "$RUN_STATE" != "Running" ] && warn "سرویس هنوز پاسخ نمی‌دهد؛ «modasr logs» را ببینید."
  [ -n "$DOMAIN_NAME" ] && [ "$SSL_STATE" != "Active" ] && warn "پنل هنوز بدون HTTPS است؛ بعد از اصلاح دی‌ان‌اس «modasr ssl» را بزنید."
  echo ""
  say "  ${PURPLE}${BOLD}دستورات مدیریت:${NC}"
  say "   ${CYAN}modasr${NC}            منوی مدیریت"
  say "   ${CYAN}modasr status${NC}     وضعیت سرویس"
  say "   ${CYAN}modasr logs${NC}       لاگ‌های زنده"
  say "   ${CYAN}modasr update${NC}     به‌روزرسانی"
  say "   ${CYAN}modasr backup${NC}     پشتیبان‌گیری"
  say "   ${CYAN}modasr passwd${NC}     تغییر رمز پنل"
  say "   ${CYAN}modasr help${NC}       راهنمای کامل"
  echo ""
  say "  ${YELLOW}⚠ امنیت:${NC} اگر توکن ربات را جایی فرستادید/لو رفت، از @BotFather دستور /revoke بزنید."
  echo ""
}

# ------------------------------------------------------------------------------
# دستور: update
# ------------------------------------------------------------------------------
backup_data() {
  mkdir -p "$BACKUP_DIR"; chmod 700 "$BACKUP_DIR"
  local f="$BACKUP_DIR/modasr-$(date +%Y%m%d-%H%M%S)-${RANDOM}.tar.gz"
  tar -czf "$f" -C "$INSTALL_DIR" data .env 2>/dev/null && chmod 600 "$f" && echo "$f"
  ls -1t "$BACKUP_DIR"/modasr-*.tar.gz 2>/dev/null | tail -n +11 | xargs -r rm -f
}

do_update_steps() {
  git -C "$INSTALL_DIR" fetch --quiet origin ${BRANCH:+"$BRANCH"} && git -C "$INSTALL_DIR" reset --hard FETCH_HEAD
}

rollback_update() { # rollback_update FULL_COMMIT_HASH
  git -C "$INSTALL_DIR" reset --hard "$1" >>"$LOG_FILE" 2>&1
  run_quiet "نصب وابستگی‌های نسخه‌ی قبلی" npm_install
  run_quiet "ساخت نسخه‌ی قبلی" npm_build
  run_quiet "ری‌استارت سرویس" pm2_start
}

cmd_update() {
  need_root; need_installed
  : > "$LOG_FILE"; chmod 600 "$LOG_FILE"
  banner
  [ -z "$BRANCH" ] && BRANCH="$(git -C "$INSTALL_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)"

  local before after before_full
  before="$(git -C "$INSTALL_DIR" rev-parse --short HEAD)"
  before_full="$(git -C "$INSTALL_DIR" rev-parse HEAD)"
  step "بررسی نسخه‌ی جدید"
  git -C "$INSTALL_DIR" fetch --quiet origin ${BRANCH:+"$BRANCH"} 2>>"$LOG_FILE" || die "اتصال به گیت‌هاب برقرار نشد."
  after="$(git -C "$INSTALL_DIR" rev-parse --short FETCH_HEAD)"
  if [ "$before" = "$after" ] && [ "$FORCE" != "1" ]; then
    ok "شما آخرین نسخه را دارید (${before})."
    return 0
  fi
  say "  نسخه‌ی فعلی: ${before}  →  نسخه‌ی جدید: ${after}"
  git -C "$INSTALL_DIR" log --oneline "HEAD..FETCH_HEAD" 2>/dev/null | head -8 | sed 's/^/    • /'
  echo ""
  confirm "به‌روزرسانی انجام شود؟" y || die "لغو شد."

  local bk; bk="$(backup_data)"; [ -n "$bk" ] && ok "پشتیبان‌گیری: $bk"
  run_quiet "دریافت کد جدید" do_update_steps || exit 1
  ensure_env_defaults
  if ! run_quiet "به‌روزرسانی وابستگی‌ها" npm_install || ! run_quiet "ساخت نسخه‌ی نهایی" npm_build; then
    warn "به‌روزرسانی شکست خورد؛ بازگشت به نسخه‌ی قبلی (${before})..."
    rollback_update "$before_full"
    die "به‌روزرسانی لغو شد و نسخه‌ی قبلی بازگردانده شد. جزئیات: $LOG_FILE"
  fi
  run_quiet "ری‌استارت سرویس" pm2_start || exit 1
  write_logrotate
  install_cli

  local port; port="$(get_env PORT)"; port="${port:-3000}"
  wait_healthy "$port" && ok "سرویس بالا آمد (نسخه ${after})" || warn "سرویس پاسخ نمی‌دهد؛ «modasr logs» را ببینید."
}

# ------------------------------------------------------------------------------
# دستور: remove
# ------------------------------------------------------------------------------
cmd_remove() {
  need_root
  banner
  installed || warn "نصبی در $INSTALL_DIR پیدا نشد؛ فقط باقی‌مانده‌ها پاک می‌شوند."
  warn "این کار ربات، پیکربندی Nginx و دستور modasr را حذف می‌کند."
  confirm "مطمئنید که می‌خواهید حذف کنید؟" n || die "لغو شد."

  if [ -d "$INSTALL_DIR/data" ]; then
    if [ "$PURGE" = "1" ]; then
      warn "پارامتر --purge: داده‌ها بدون پشتیبان پاک می‌شوند."
    else
      local bk; bk="$(backup_data)"; [ -n "$bk" ] && ok "از داده‌ها پشتیبان گرفته شد: $bk"
    fi
  fi

  pm2 delete "$APP_NAME" >/dev/null 2>&1; pm2 save >/dev/null 2>&1
  ok "سرویس متوقف و حذف شد"
  rm -f /etc/nginx/sites-enabled/modasr "$NGINX_SITE" /etc/nginx/conf.d/modasr-ratelimit.conf "$LOGROTATE_FILE"
  command -v nginx >/dev/null 2>&1 && nginx -t >/dev/null 2>&1 && systemctl reload nginx >/dev/null 2>&1
  ok "پیکربندی Nginx حذف شد"
  if [ -n "$INSTALL_DIR" ] && [ "$INSTALL_DIR" != "/" ] && { [ -f "$INSTALL_DIR/server.ts" ] || [ -f "$INSTALL_DIR/.env" ]; }; then
    rm -rf "$INSTALL_DIR"
  else
    warn "مسیر $INSTALL_DIR شبیه پوشه‌ی پروژه نیست؛ حذف نشد."
  fi
  rm -f "$CONF_FILE"
  ok "فایل‌های پروژه حذف شد"
  say "  ${DIM}(گواهی SSL و Node/PM2 دست‌نخورده ماندند.)${NC}"
  rm -f "$CLI_PATH"
  ok "حذف کامل شد."
}

# ------------------------------------------------------------------------------
# دستور: ssl
# ------------------------------------------------------------------------------
cmd_ssl() {
  need_root; need_installed
  local domain="${A_DOMAIN:-$(get_env DOMAIN)}"
  [ -n "$domain" ] || die "دامنه‌ای تنظیم نشده است. با «modasr ssl --domain arz.example.com» دامنه را بدهید."
  valid_domain "$domain" || die "دامنه نامعتبر است."
  : > "$LOG_FILE"; chmod 600 "$LOG_FILE"

  local sip dip; sip="$(public_ip)"; dip="$(resolve_ip "$domain")"
  if [ "$dip" != "$sip" ]; then
    warn "دامنه ${domain} به ${dip:-هیچ آی‌پی‌ای} اشاره می‌کند ولی آی‌پی سرور ${sip} است."
    confirm "با این وجود تلاش شود؟" n || die "ابتدا رکورد A دامنه را اصلاح کنید."
  fi
  if [ "$domain" != "$(get_env DOMAIN)" ]; then set_env DOMAIN "$domain"; fi
  DOMAIN_NAME="$domain"; APP_PORT="$(get_env PORT)"; APP_PORT="${APP_PORT:-3000}"
  command -v nginx >/dev/null 2>&1 || run_quiet "نصب Nginx و Certbot" pkg_nginx || exit 1
  run_quiet "پیکربندی Nginx" write_nginx || exit 1
  run_quiet "صدور / تمدید گواهی SSL" issue_ssl "$domain" || exit 1
  certbot renew --quiet >>"$LOG_FILE" 2>&1 || true
  ok "SSL فعال است: https://${domain}"
  pm2 restart "$APP_NAME" >/dev/null 2>&1
}

# ------------------------------------------------------------------------------
# دستور: status / logs / restart / passwd
# ------------------------------------------------------------------------------
cmd_status() {
  need_installed
  local port domain token ver cert
  port="$(get_env PORT)"; port="${port:-3000}"; domain="$(get_env DOMAIN)"; token="$(get_env BOT_TOKEN)"
  ver="$(git -C "$INSTALL_DIR" log -1 --format='%h  %cd' --date=short 2>/dev/null)"
  echo ""
  say "  ${BOLD}📊 وضعیت MODASR ARZ${NC}"
  say "  نسخه:       ${ver}"
  say "  مسیر:       ${INSTALL_DIR}"

  local pmstat
  pmstat="$(pm2 describe "$APP_NAME" 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | awk -F'│' '$2 ~ /^ *status *$/ {gsub(/ /,"",$3); print $3; exit}')"
  if [ "$pmstat" = "online" ]; then say "  سرویس:      ${GREEN}● online${NC}"; else say "  سرویس:      ${RED}● ${pmstat:-متوقف}${NC}"; fi

  if curl -fs --max-time 4 "http://127.0.0.1:${port}/health" 2>/dev/null | grep -q '"status":"ok"'; then
    say "  وب‌سرور:    ${GREEN}● پاسخ می‌دهد (پورت ${port})${NC}"
  else
    say "  وب‌سرور:    ${RED}● پاسخ نمی‌دهد${NC}"
  fi

  if [ -n "$token" ] && tg_getme "$token"; then
    say "  تلگرام:     ${GREEN}● @${BOT_USERNAME}${NC}"
  else
    say "  تلگرام:     ${RED}● توکن نامعتبر یا عدم اتصال${NC}"
  fi

  if [ -n "$domain" ]; then
    say "  دامنه:      ${domain}"
    cert="/etc/letsencrypt/live/${domain}/fullchain.pem"
    if [ -f "$cert" ]; then
      say "  SSL:        ${GREEN}● تا $(openssl x509 -enddate -noout -in "$cert" | cut -d= -f2)${NC}"
    else
      say "  SSL:        ${YELLOW}● فعال نیست (modasr ssl)${NC}"
    fi
  fi
  say "  رمز پنل:    $([ -n "$(get_env ADMIN_PASSWORD)" ] && echo "${GREEN}تنظیم شده${NC}" || echo "${RED}تنظیم نشده (modasr passwd)${NC}")"
  echo ""
  pm2 status "$APP_NAME" 2>/dev/null
}

cmd_doctor() {
  need_installed
  local port domain bad=0 v
  port="$(get_env PORT)"; port="${port:-3000}"; domain="$(get_env DOMAIN)"
  c_ok()   { ok "$1"; }
  c_bad()  { err "$1"; bad=$((bad+1)); }
  c_warn() { warn "$1"; }
  echo ""; say "  ${BOLD}🩺 بررسی سلامت نصب${NC}\n"

  node_ok && c_ok "Node.js $(node -v)" || c_bad "نسخه‌ی Node مناسب نیست (نیاز: >=20.19 یا >=22.12)"
  [ "$(stat -c %a "$INSTALL_DIR/.env" 2>/dev/null)" = "600" ] && c_ok ".env دسترسی 600 دارد" || c_bad ".env باید دسترسی 600 داشته باشد:  chmod 600 $INSTALL_DIR/.env"
  [ -n "$(get_env ADMIN_PASSWORD)" ] && c_ok "رمز پنل تنظیم شده" || c_bad "رمز پنل تنظیم نشده (modasr passwd)"
  v="$(get_env SESSION_SECRET)"
  [ "${#v}" -ge 32 ] && c_ok "SESSION_SECRET تنظیم شده" || c_bad "SESSION_SECRET تنظیم نشده (modasr update آن را می‌سازد)"

  pm2 describe "$APP_NAME" 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g' | grep -qE 'status[^a-z]*online' \
    && c_ok "سرویس PM2 در حال اجراست" || c_bad "سرویس PM2 متوقف است (modasr logs)"
  systemctl is-enabled pm2-root >/dev/null 2>&1 && c_ok "PM2 بعد از ریبوت خودکار بالا می‌آید" || c_bad "اجرای خودکار PM2 بعد از ریبوت فعال نیست:  pm2 startup systemd -u root --hp /root && pm2 save"
  curl -fs --max-time 4 "http://127.0.0.1:${port}/health" 2>/dev/null | grep -q '"status":"ok"' \
    && c_ok "/health پاسخ می‌دهد" || c_bad "/health پاسخ نمی‌دهد"

  local listen; listen="$(ss -H -ltn 2>/dev/null | awk -v p=":${port}" '$4 ~ p"$" {print $4; exit}')"
  if [ -n "$domain" ]; then
    case "$listen" in 127.0.0.1:*|\[::1\]:*) c_ok "برنامه فقط روی loopback گوش می‌دهد (${listen})" ;;
      *) c_warn "برنامه روی ${listen:-?} گوش می‌دهد؛ با دامنه بهتر است فقط روی 127.0.0.1 باشد (HOST=127.0.0.1 و modasr restart)" ;; esac
    if command -v nginx >/dev/null 2>&1; then
      nginx -t >/dev/null 2>&1 && c_ok "پیکربندی Nginx معتبر است" || c_bad "nginx -t خطا دارد"
      systemctl is-active nginx >/dev/null 2>&1 && c_ok "Nginx فعال است" || c_bad "Nginx فعال نیست"
    else c_bad "Nginx نصب نیست"; fi
    [ -f "/etc/letsencrypt/live/${domain}/fullchain.pem" ] && c_ok "گواهی SSL موجود است" || c_warn "SSL فعال نیست (modasr ssl)"
    systemctl is-enabled certbot.timer >/dev/null 2>&1 && c_ok "تمدید خودکار SSL فعال است" || c_warn "certbot.timer فعال نیست"
  else
    c_warn "دامنه تنظیم نشده؛ پنل روی HTTP ساده در دسترس است"
  fi

  command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active" && c_ok "فایروال UFW فعال است" || c_warn "UFW فعال نیست"
  systemctl is-active fail2ban >/dev/null 2>&1 && c_ok "Fail2Ban فعال است" || c_warn "Fail2Ban فعال نیست"
  [ -f "$LOGROTATE_FILE" ] && c_ok "چرخش لاگ‌ها تنظیم شده" || c_warn "logrotate تنظیم نشده (modasr update)"

  local free_mb; free_mb="$(df -Pm "$INSTALL_DIR" | awk 'NR==2{print $4}')"
  [ "${free_mb:-0}" -ge 500 ] && c_ok "فضای آزاد دیسک: ${free_mb}MB" || c_bad "فضای دیسک کم است (${free_mb}MB)"
  echo ""
  if [ "$bad" -eq 0 ]; then say "  ${GREEN}${BOLD}همه‌چیز سالم است.${NC}\n"; else say "  ${RED}${BOLD}${bad} مشکل پیدا شد.${NC}\n"; return 1; fi
}

cmd_logs()    { need_installed; pm2 logs "$APP_NAME" --lines 60; }
cmd_restart() { need_root; need_installed; pm2 restart "$APP_NAME" && ok "ری‌استارت شد."; }

cmd_backup() {
  need_root; need_installed
  local f; f="$(backup_data)"
  [ -n "$f" ] || die "پشتیبان‌گیری ناموفق بود."
  ok "پشتیبان ساخته شد (کاربران، تنظیمات و فایل .env):"
  say "   ${BOLD}${f}${NC}"
  say "   ${DIM}برای انتقال به کامپیوتر:  scp root@IP:${f} .${NC}"
}

cmd_restore() {
  need_root; need_installed
  local f="$RESTORE_FILE"
  if [ -z "$f" ]; then
    local list; list="$(ls -1t "$BACKUP_DIR"/modasr-*.tar.gz 2>/dev/null | head -10)"
    [ -n "$list" ] || die "هیچ پشتیبانی در $BACKUP_DIR پیدا نشد. مسیر فایل را بدهید:  modasr restore /path/backup.tar.gz"
    [ -t 0 ] || die "مسیر فایل پشتیبان را بدهید:  modasr restore /path/backup.tar.gz"
    say "  ${BOLD}پشتیبان‌های موجود:${NC}"
    local i=1 line
    while IFS= read -r line; do say "   ${CYAN}${i})${NC} $line"; i=$((i+1)); done <<< "$list"
    local n; read -r -p "$(echo -e "  ${CYAN}›${NC} شماره‌ی پشتیبان [1]: ")" n; n="${n:-1}"
    f="$(echo "$list" | sed -n "${n}p")"
  fi
  [ -f "$f" ] || die "فایل پیدا نشد: $f"
  tar -tzf "$f" 2>/dev/null | grep -qE '^(data/|\.env$)' || die "این فایل یک پشتیبان معتبر MODASR نیست."
  # فقط data/ و .env مجاز است؛ مسیر مطلق یا «..» (جایگزینی کد برنامه / path traversal) رد می‌شود
  local bad; bad="$(tar -tzf "$f" 2>/dev/null | grep -vE '^(data(/.*)?|\.env)$' | head -1)"
  [ -z "$bad" ] || die "پشتیبان شامل مسیر غیرمجاز است و رد شد: $bad"
  tar -tzf "$f" 2>/dev/null | grep -qE '(^|/)\.\.(/|$)' && die "پشتیبان شامل مسیر «..» است و رد شد."
  warn "اطلاعات فعلی با محتوای این پشتیبان جایگزین می‌شود."
  confirm "ادامه دهم؟" n || die "لغو شد."
  local tmp; tmp="$(mktemp)"; cp "$f" "$tmp"
  local safety; safety="$(backup_data)"; [ -n "$safety" ] && ok "نسخه‌ی فعلی هم ذخیره شد: $safety"
  pm2 stop "$APP_NAME" >/dev/null 2>&1
  tar -xzf "$tmp" -C "$INSTALL_DIR" --no-same-owner && chmod 600 "$INSTALL_DIR/.env" 2>/dev/null
  rm -f "$tmp"
  pm2 restart "$APP_NAME" >/dev/null 2>&1
  local port; port="$(get_env PORT)"; port="${port:-3000}"
  wait_healthy "$port" && ok "بازیابی انجام شد و سرویس بالا آمد." || warn "بازیابی انجام شد ولی سرویس پاسخ نمی‌دهد؛ «modasr logs» را ببینید."
}

cmd_passwd() {
  need_root; need_installed
  local pw="$A_PASSWORD" generated=0
  if [ -z "$pw" ]; then
    if [ -t 0 ]; then
      local p2
      say "  ${DIM}حداقل ۸ کاراکتر. برای رمز تصادفی Enter بزنید.${NC}"
      while true; do
        read -r -s -p "$(echo -e "  ${CYAN}›${NC} رمز جدید: ")" pw; echo ""
        if [ -z "$pw" ]; then pw="$(gen_password)"; generated=1; break; fi
        valid_password "$pw" || { err "رمز ضعیف یا نامعتبر است."; continue; }
        read -r -s -p "$(echo -e "  ${CYAN}›${NC} تکرار رمز: ")" p2; echo ""
        [ "$pw" = "$p2" ] && break
        err "دو رمز یکسان نیستند."
      done
    else
      pw="$(gen_password)"; generated=1
    fi
  else
    valid_password "$pw" || die "رمز باید حداقل ۸ کاراکتر باشد و شامل \" یا \\ نباشد."
  fi
  set_env ADMIN_PASSWORD "$pw"
  pm2 restart "$APP_NAME" >/dev/null 2>&1
  ok "رمز پنل تغییر کرد و همه‌ی نشست‌های قبلی بسته شدند."
  [ "$generated" = "1" ] && say "  🔐 رمز جدید: ${BOLD}${pw}${NC}"
}

# ------------------------------------------------------------------------------
# راهنما و منو
# ------------------------------------------------------------------------------
cmd_help() {
  cat <<EOF

  ${BOLD}modasr${NC} <command> [options]

  ${PURPLE}${BOLD}دستورها${NC}
    install     نصب ربات و پنل
    update      به‌روزرسانی (با پشتیبان‌گیری خودکار)
    remove      حذف ربات (با پشتیبان از داده‌ها)
    ssl         صدور / تمدید گواهی SSL
    status      نمایش وضعیت سرویس
    logs        لاگ‌های زنده
    restart     ری‌استارت ربات
    backup      پشتیبان‌گیری از کاربران، تنظیمات و .env
    restore     بازیابی از پشتیبان (modasr restore [فایل])
    passwd      تغییر رمز پنل مدیریت
    doctor      بررسی سلامت (Node, PM2, Nginx, SSL, UFW, Fail2Ban, ...)
    menu        منوی تعاملی (پیش‌فرض)

  ${PURPLE}${BOLD}پارامترهای نصب${NC}
    --token <T>       توکن ربات تلگرام
    --admin <ID>      آیدی عددی ادمین
    --name <user>     یوزرنیم ربات (اختیاری)
    --channel <@ch>   کانال ارسال ساعتی (اختیاری)
    --domain <d>      دامنه (مثال: arz.example.com)
    --port <N>        پورت برنامه (پیش‌فرض 3000)
    --password <P>    رمز پنل (اگر ندهید تصادفی ساخته می‌شود). امن‌تر: متغیر MODASR_PASSWORD
    --email <mail>    ایمیل برای Let's Encrypt (اختیاری؛ متغیر MODASR_EMAIL)
    --repo <url>      آدرس مخزن گیت
    --branch <b>      شاخه‌ی گیت
    --no-ssl          عدم صدور SSL
    --no-firewall     عدم فعال‌سازی UFW و Fail2Ban
    -y, --yes         بدون پرسیدن سؤال تأیید
    --purge           (برای remove) حذف داده‌ها بدون پشتیبان
    --force           (برای update) به‌روزرسانی اجباری
    -h, --help        نمایش این راهنما

  ${PURPLE}${BOLD}مثال‌ها${NC}
    modasr install --token 123:ABC --admin 111 --domain arz.example.com -y
    modasr update
    modasr passwd --password 'MyNewStrongPass'
    modasr ssl --domain arz.example.com

EOF
}

cmd_menu() {
  need_root
  while true; do
    banner
    if installed; then
      say "  ${GREEN}● نصب شده${NC}  ${DIM}($(git -C "$INSTALL_DIR" log -1 --format='%h' 2>/dev/null))${NC}\n"
    else
      say "  ${YELLOW}● نصب نشده${NC}\n"
    fi
    say "   ${CYAN} 1)${NC} نصب MODASR ARZ"
    say "   ${CYAN} 2)${NC} به‌روزرسانی"
    say "   ${CYAN} 3)${NC} حذف کامل"
    say "   ${CYAN} 4)${NC} صدور / تمدید SSL"
    say "   ${CYAN} 5)${NC} وضعیت سرویس"
    say "   ${CYAN} 6)${NC} مشاهده‌ی لاگ‌ها"
    say "   ${CYAN} 7)${NC} تغییر رمز پنل"
    say "   ${CYAN} 8)${NC} ری‌استارت ربات"
    say "   ${CYAN} 9)${NC} پشتیبان‌گیری"
    say "   ${CYAN}10)${NC} بازیابی از پشتیبان"
    say "   ${CYAN}11)${NC} راهنما و پارامترها"
    say "   ${CYAN}12)${NC} بررسی سلامت (doctor)"
    say "   ${CYAN} 0)${NC} خروج"
    echo ""
    local c; read -r -p "$(echo -e "  ${BOLD}انتخاب شما:${NC} ")" c
    case "$c" in
      1)  (cmd_install); read -r -p "  Enter برای بازگشت..." _ ;;
      2)  (cmd_update);  read -r -p "  Enter برای بازگشت..." _ ;;
      3)  (cmd_remove);  read -r -p "  Enter برای بازگشت..." _ ;;
      4)  (cmd_ssl);     read -r -p "  Enter برای بازگشت..." _ ;;
      5)  (cmd_status);  read -r -p "  Enter برای بازگشت..." _ ;;
      6)  (cmd_logs) ;;
      7)  (cmd_passwd);  read -r -p "  Enter برای بازگشت..." _ ;;
      8)  (cmd_restart); read -r -p "  Enter برای بازگشت..." _ ;;
      9)  (cmd_backup);  read -r -p "  Enter برای بازگشت..." _ ;;
      10) (cmd_restore); read -r -p "  Enter برای بازگشت..." _ ;;
      11) cmd_help;      read -r -p "  Enter برای بازگشت..." _ ;;
      12) (cmd_doctor);  read -r -p "  Enter برای بازگشت..." _ ;;
      0|q|Q) exit 0 ;;
      *) ;;
    esac
  done
}

# ------------------------------------------------------------------------------
# ورودی اصلی
# ------------------------------------------------------------------------------
main() {
  local cmd="menu"
  if [ $# -gt 0 ] && [[ "$1" != -* ]]; then cmd="$1"; shift; fi

  while [ $# -gt 0 ]; do
    case "$1" in
      --token)    A_TOKEN="$2"; shift 2 ;;
      --admin)    A_ADMIN="$2"; shift 2 ;;
      --name)     A_NAME="$2"; shift 2 ;;
      --channel)  A_CHANNEL="$2"; shift 2 ;;
      --domain)   A_DOMAIN="$2"; shift 2 ;;
      --port)     A_PORT="$2"; shift 2 ;;
      --password) A_PASSWORD="$2"; shift 2 ;;
      --email)    A_EMAIL="$2"; shift 2 ;;
      --repo)     REPO_URL="$2"; shift 2 ;;
      --branch)   BRANCH="$2"; shift 2 ;;
      --no-ssl)   NO_SSL=1; shift ;;
      --no-firewall) NO_FIREWALL=1; shift ;;
      --purge)    PURGE=1; shift ;;
      --force)    FORCE=1; shift ;;
      -y|--yes)   ASSUME_YES=1; shift ;;
      -h|--help)  cmd="help"; shift ;;
      -*) die "پارامتر ناشناخته: $1  (modasr help)" ;;
      *) if [ -z "$RESTORE_FILE" ]; then RESTORE_FILE="$1"; shift; else die "ورودی اضافه: $1  (modasr help)"; fi ;;
    esac
  done

  case "$cmd" in
    install)  cmd_install ;;
    update)   cmd_update ;;
    remove|uninstall) cmd_remove ;;
    ssl|renew) cmd_ssl ;;
    status)   cmd_status ;;
    logs)     cmd_logs ;;
    restart)  cmd_restart ;;
    backup)   cmd_backup ;;
    restore)  cmd_restore ;;
    passwd|password) cmd_passwd ;;
    doctor)   cmd_doctor ;;
    help)     cmd_help ;;
    menu)     cmd_menu ;;
    *) die "دستور ناشناخته: $cmd  (modasr help)" ;;
  esac
}

# اجرای main در همان خط تا بعد از آپدیت فایل اسکریپت، خواندن ادامه‌ی آن به مشکل نخورد
[ -n "${MODASR_SOURCE_ONLY:-}" ] || { main "$@"; exit $?; }
