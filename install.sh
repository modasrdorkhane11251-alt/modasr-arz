#!/usr/bin/env bash

# ==============================================================================
# 🚀 اسکریپت نصب و راه‌اندازی خودکار ربات و مینی‌اپ نرخ لحظه‌ای (Modasr Arzbot)
# سازگار با Ubuntu 20.04/22.04/24.04 و Debian 11/12
# ==============================================================================

set -e

# رنگ‌ها برای خروجی زیبا در ترمینال
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "    💎 سامانه جامع نرخ لحظه‌ای طلا، ارز، کریپتو و مینی‌اپ تلگرام      "
echo "              نصب و راه‌اندازی اختصاصی روی سرور مجازی (VPS)           "
echo "======================================================================"
echo -e "${NC}"

# ۱. بررسی دسترسی روت
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}⚠️ پیشنهاد می‌شود این اسکریپت را با دسترسی root یا دستور sudo bash install.sh اجرا کنید.${NC}\n"
fi

# ۲. دریافت تعاملی و اعتبارسنجی آنلاین توکن ربات از تلگرام
echo -e "${PURPLE}${BOLD}[ مرحله ۱: تنظیم و اعتبارسنجی توکن ربات تلگرام ]${NC}"

BOT_TOKEN=""
BOT_USERNAME=""
BOT_NAME=""

while true; do
  echo -e "${CYAN}لطفاً توکن ربات تلگرام خود را وارد کنید (دریافت شده از @BotFather):${NC}"
  read -r -p "🔑 Bot Token: " INPUT_TOKEN

  if [ -z "$INPUT_TOKEN" ]; then
    echo -e "${RED}❌ وارد کردن توکن الزامی است. لطفاً توکن ربات خود را پیست کنید.${NC}\n"
    continue
  fi

  BOT_TOKEN="$INPUT_TOKEN"

  echo -e "${YELLOW}⏳ در حال بررسی و اعتبارسنجی توکن با سرورهای تلگرام...${NC}"
  ME_RESPONSE=$(curl -s --max-time 10 "https://api.telegram.org/bot${BOT_TOKEN}/getMe" || true)

  if echo "$ME_RESPONSE" | grep -q '"ok":true'; then
    BOT_USERNAME=$(echo "$ME_RESPONSE" | grep -o '"username":"[^"]*' | cut -d'"' -f4)
    BOT_NAME=$(echo "$ME_RESPONSE" | grep -o '"first_name":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✔ توکن معتبر است!${NC}"
    echo -e "   🤖 نام ربات شما: ${BOLD}${BOT_NAME}${NC}"
    echo -e "   🔗 یوزرنیم ربات: ${BOLD}@${BOT_USERNAME}${NC}\n"
    break
  else
    echo -e "${RED}❌ توکن وارد شده نامعتبر است یا ارتباط با سرورهای تلگرام برقرار نشد.${NC}"
    echo -e "پاسخ تلگرام: $ME_RESPONSE\n"
    read -r -p "آیا مایلید مجدداً توکن را وارد کنید؟ (y/n) [پیش‌فرض: y]: " RETRY_TOKEN
    RETRY_TOKEN="${RETRY_TOKEN:-y}"
    if [ "$RETRY_TOKEN" != "y" ] && [ "$RETRY_TOKEN" != "Y" ]; then
      BOT_USERNAME="Modasr_Arzbot"
      break
    fi
  fi
done

# ۳. دریافت آیدی عددی ادمین
echo -e "${PURPLE}${BOLD}[ مرحله ۲: مشخصات مدیریت و کانال ]${NC}"
echo -e "${CYAN}شناسه عددی تلگرام ادمین (برای دسترسی به پنل مدیریت و دریافت گزارش خطاها در پیوی):${NC}"
echo -e "${YELLOW}💡 نکته: برای پیدا کردن آیدی عددی خود می‌توانید در تلگرام به ربات @userinfobot پیام دهید.${NC}"

ADMIN_ID=""
while true; do
  read -r -p "👤 Admin Numeric ID: " INPUT_ADMIN
  if [ -n "$INPUT_ADMIN" ]; then
    ADMIN_ID="$INPUT_ADMIN"
    break
  else
    echo -e "${RED}❌ لطفاً شناسه عددی تلگرام خود را وارد کنید.${NC}"
  fi
done

# آیدی کانال برای ارسال خودکار
echo -e "\n${CYAN}آیدی کانال تلگرام برای ارسال خودکار ساعتی نرخ‌ها (همراه با @ / اختیاری):${NC}"
read -r -p "📢 Channel ID (مثال: @MyChannel): " INPUT_CHANNEL
CHANNEL_ID="${INPUT_CHANNEL:-@MODASR_ARZ}"

# ۴. تنظیمات وب‌سرور و دامنه
echo -e "\n${PURPLE}${BOLD}[ مرحله ۳: تنظیمات دامنه و پورت سرور ]${NC}"
echo -e "${CYAN}در صورت داشتن دامنه یا ساب‌دامین اختصاصی برای مینی‌اپ و پنل مدیریت، آن را وارد کنید:${NC}"
echo -e "(اگر دامنه ندارید، کافیست ${BOLD}Enter${NC} بزنید تا با IP سرور اجرا شود)"
read -r -p "🌐 Domain / Subdomain (اختیاری): " DOMAIN_NAME

DEFAULT_PORT="3000"
read -r -p "🔌 Server Port [پیش‌فرض: ${DEFAULT_PORT}]: " INPUT_PORT
APP_PORT="${INPUT_PORT:-$DEFAULT_PORT}"

echo -e "\n${GREEN}✔ تمامی مشخصات شما با موفقیت دریافت و آماده اعمال شدند.${NC}\n"

# ۵. آپدیت پکیج‌های سیستم و نصب وابستگی‌های لینوکس
echo -e "${CYAN}📦 در حال بررسی و آماده‌سازی پکیج‌های سیستمی...${NC}"
apt-get update -y >/dev/null 2>&1 || true
apt-get install -y curl git build-essential ufw >/dev/null 2>&1 || true

# ۶. بررسی و نصب Node.js 22 LTS
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1 | tr -d 'v')" -lt 20 ]; then
  echo -e "${YELLOW}⚙️ در حال نصب Node.js 22 LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1
  apt-get install -y nodejs >/dev/null 2>&1
  echo -e "${GREEN}✔ Node.js $(node -v) و npm $(npm -v) با موفقیت نصب شدند.${NC}"
else
  echo -e "${GREEN}✔ Node.js $(node -v) آماده است.${NC}"
fi

# ۷. نصب PM2
if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}⚙️ در حال نصب ابزار مدیریت پروسه PM2...${NC}"
  npm install -g pm2 >/dev/null 2>&1
  echo -e "${GREEN}✔ PM2 نصب شد.${NC}"
fi

# ۸. تولید فایل تنظیمات .env اختصاصی برای این سرور
echo -e "${CYAN}📝 در حال تولید فایل کانفیگ .env...${NC}"
cat <<EOF > .env
BOT_TOKEN="${BOT_TOKEN}"
ADMIN_ID="${ADMIN_ID}"
BOT_USERNAME="${BOT_USERNAME}"
PORT="${APP_PORT}"
NODE_ENV="production"
DOMAIN="${DOMAIN_NAME}"
EOF

# ۹. مقداردهی فایل‌های تنظیمات اختصاصی در پوشه data/
mkdir -p data

cat <<EOF > data/ad_config.json
{
  "buttonText": "📢 عضویت در کانال رسمی ↗️",
  "buttonUrl": "https://t.me/${CHANNEL_ID#@}",
  "headerIntro": "MØD†SR.lua ᶻ z ƪARZ",
  "isEnabled": true,
  "enableCharts": true,
  "watermarkTag": "${CHANNEL_ID} | MODASRP"
}
EOF

cat <<EOF > data/channel_poster_config.json
{
  "isEnabled": true,
  "channelId": "${CHANNEL_ID}",
  "intervalMinutes": 60,
  "postMode": "image_card_and_summary",
  "lastPostStatus": "pending"
}
EOF

cat <<EOF > data/admin_alert_config.json
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

# ۱۰. نصب پکیج‌های پروژه و بیلد نهایی
echo -e "${CYAN}📥 در حال نصب پکیج‌های NPM (npm install --legacy-peer-deps)...${NC}"
npm install --legacy-peer-deps

echo -e "${CYAN}🔨 در حال کامپایل و ساخت فایل‌های نهایی (npm run build)...${NC}"
npm run build

# ۱۱. راه‌اندازی دائم با PM2
echo -e "${CYAN}🚀 در حال راه‌اندازی ربات با PM2...${NC}"
pm2 delete modasr-bot 2>/dev/null || true
pm2 start server.js --name "modasr-bot"
pm2 save >/dev/null 2>&1
pm2 startup | tail -n 1 | bash 2>/dev/null || true

# ۱۲. راه‌اندازی Nginx و SSL در صورت تعریف دامنه
if [ -n "$DOMAIN_NAME" ]; then
  echo -e "${CYAN}🌐 در حال پیکربندی Nginx برای دامنه ${DOMAIN_NAME}...${NC}"
  apt-get install -y nginx certbot python3-certbot-nginx >/dev/null 2>&1 || true

  NGINX_CONF="/etc/nginx/sites-available/modasr"
  cat <<EOF > "$NGINX_CONF"
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

  ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
  nginx -t && systemctl reload nginx

  echo -e "${GREEN}✔ وب‌سرور Nginx تنظیم شد.${NC}"
  
  read -r -p "$(echo -e "${YELLOW}🔒 آیا مایلید گواهینامه SSL رایگان (Let's Encrypt HTTPS) برای ${DOMAIN_NAME} صادر شود؟ (y/n) [پیش‌فرض: y]: ${NC}")" SSL_CHOICE
  SSL_CHOICE="${SSL_CHOICE:-y}"
  if [ "$SSL_CHOICE" = "y" ] || [ "$SSL_CHOICE" = "Y" ]; then
    echo -e "${CYAN}در حال صدور گواهینامه SSL...${NC}"
    certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --register-unsafely-without-email || true
  fi
fi

# دریافت آی‌پی سرور
SERVER_IP=$(curl -s --max-time 5 https://api.ipify.org || hostname -I | awk '{print $1}')

# نمایش پیام نهایی و اطلاعات اتصال
echo -e "\n${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}       🎉 نصب و راه‌اندازی ربات با موفقیت به پایان رسید!             ${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}\n"

echo -e "🤖 ${BOLD}ربات فعال تلگرام:${NC} https://t.me/${BOT_USERNAME}"
echo -e "👑 ${BOLD}شناسه ادمین:${NC} ${ADMIN_ID}"
echo -e "📢 ${BOLD}کانال ارسال خودکار:${NC} ${CHANNEL_ID}"

if [ -n "$DOMAIN_NAME" ]; then
  echo -e "🌐 ${BOLD}پنل مدیریت وب:${NC} https://${DOMAIN_NAME}"
  echo -e "📱 ${BOLD}لینک مینی‌اپ:${NC} https://${DOMAIN_NAME}/mini-modasr-arz"
else
  echo -e "🌐 ${BOLD}پنل مدیریت وب:${NC} http://${SERVER_IP}:${APP_PORT}"
  echo -e "📱 ${BOLD}لینک مینی‌اپ:${NC} http://${SERVER_IP}:${APP_PORT}/mini-modasr-arz"
fi

echo -e "\n${PURPLE}${BOLD}[ دستورات کاربردی مدیریت سرور ]${NC}"
echo -e "• ${CYAN}مشاهده لاگ‌های زنده ربات:${NC}  pm2 logs modasr-bot"
echo -e "• ${CYAN}ری‌استارت کردن ربات:${NC}      pm2 restart modasr-bot"
echo -e "• ${CYAN}مشاهده وضعیت پروسه:${NC}       pm2 status"
echo -e "• ${CYAN}توقف موقت ربات:${NC}          pm2 stop modasr-bot"
echo -e "• ${CYAN}به‌روزرسانی کدها از گیت:${NC}   bash update.sh"
echo ""
