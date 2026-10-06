#!/usr/bin/env bash
# میانبر قدیمی: معادل  modasr update
cd "$(dirname "$0")" || exit 1
exec bash ./install.sh update "$@"
