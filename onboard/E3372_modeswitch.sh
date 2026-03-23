#!/usr/bin/env bash
set -euo pipefail

VENDOR="3566"
PRODUCT="2001"
TTY="/dev/ttyUSB4"
LOG_TAG="[modem-init]"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $LOG_TAG $*"
}

log "Starting modem initialization (VID=$VENDOR PID=$PRODUCT)"

# 1. Switch USB mode
log "Running usb_modeswitch..."
if usb_modeswitch -v "$VENDOR" -p "$PRODUCT" -X; then
    log "usb_modeswitch completed"
else
    log "usb_modeswitch failed"
fi

# 2. Load driver
log "Loading option driver..."
modprobe option && log "Driver loaded"

# 3. Register device with driver
log "Registering device with option driver..."
echo "$VENDOR $PRODUCT ff" > /sys/bus/usb-serial/drivers/option1/new_id

# 4. Wait for device node
log "Waiting for $TTY to appear..."
for i in {1..10}; do
    if [[ -e "$TTY" ]]; then
        break
    fi
    sleep 1
done

if [[ ! -e "$TTY" ]]; then
    log "ERROR: $TTY not found"
    exit 1
fi

# 5. Check permissions
if ! ls -la "$TTY" | grep -q dialout; then
    log "ERROR: $TTY not accessible (not in dialout group)"
    exit 1
fi

log "$TTY is ready"

# 6. Send reset command
log "Sending AT^RESET..."
echo -e "AT^RESET\r" > "$TTY"

# 7. Read response
log "Reading modem response..."
timeout 2 cat "$TTY" || true

log "Done"
