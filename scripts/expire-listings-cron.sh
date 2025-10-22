#!/bin/bash

# Expire Listings Cron Script
# Run this script daily via cron: 0 2 * * * /path/to/expire-listings.sh

# Configuration
APP_URL="https://your-app-domain.com"  # Replace with your actual domain
CRON_SECRET="your-secret-key"          # Replace with a secure secret

# Log file
LOG_FILE="/var/log/expire-listings.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "Starting listing expiration check..."

# Call the API
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$APP_URL/api/cron/expire-listings" \
    -H "Authorization: Bearer $CRON_SECRET" \
    -H "Content-Type: application/json")

# Extract HTTP status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ]; then
    log "Success: $RESPONSE_BODY"
else
    log "Error: HTTP $HTTP_CODE - $RESPONSE_BODY"
fi

log "Listing expiration check completed."














