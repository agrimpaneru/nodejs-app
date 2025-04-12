#!/bin/bash

# Set variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
BACKUP_FILENAME="mongodb_backup_${TIMESTAMP}.gz"

# Ensure backup directory exists
mkdir -p ${BACKUP_DIR}

# Run mongodump and compress the output
echo "Starting MongoDB backup at $(date)"
mongodump --host mongodb --port 27017 --username root --password example --authenticationDatabase admin --gzip --archive=${BACKUP_DIR}/${BACKUP_FILENAME}

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup completed successfully: ${BACKUP_DIR}/${BACKUP_FILENAME}"
  # Keep only the 7 most recent backups
  ls -t ${BACKUP_DIR}/mongodb_backup_*.gz | tail -n +8 | xargs rm -f
  echo "Removed old backups, keeping the 7 most recent ones"
else
  echo "Backup failed!"
fi

echo "Backup process completed at $(date)"