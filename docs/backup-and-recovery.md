# POS Database Backup and Recovery

## 1. Purpose

This guide documents how to back up and recover the HZ Retail POS MongoDB database.

- Database: `hz_retail_pos`
- MongoDB container: `hz-retail-pos-mongo`
- Backup directory: `~/hz-retail-pos-backups/`
- Backup format: compressed MongoDB archive (`.archive.gz`)
- Backup script: `scripts/06-backup-database.sh`

## 2. Create a Backup

From the project root, run:

```bash
cd ~/hz-retail-pos
./scripts/06-backup-database.sh
```

The script creates a timestamped archive in `~/hz-retail-pos-backups/`, validates it with MongoDB's restore utility in dry-run mode, and publishes it only after validation succeeds.

Previous backups are preserved. The script does not automatically delete old archives.

## 3. List Available Backups

```bash
ls -lh ~/hz-retail-pos-backups/
```

Choose the intended archive carefully before attempting recovery.

## 4. Validate a Backup

Replace `BACKUP_FILE` with the exact archive path:

```bash
docker exec -i hz-retail-pos-mongo \
  mongorestore --archive --gzip --dryRun --verbose \
  < "$BACKUP_FILE"
```

A successful dry run verifies that MongoDB can read the archive. It does not perform a real recovery.

## 5. Restore-Test a Backup Safely

**Do not restore directly into the production database as an initial test.**

Restore into a separate test database:

```bash
docker exec -i hz-retail-pos-mongo \
  mongorestore --archive --gzip \
  --nsFrom='hz_retail_pos.*' \
  --nsTo='hz_retail_pos_restore_test.*' \
  < "$BACKUP_FILE"
```

Compare collection counts between `hz_retail_pos` and `hz_retail_pos_restore_test` before considering the test successful.

After verification, remove only the temporary test database:

```bash
docker exec hz-retail-pos-mongo mongosh --quiet --eval \
  'db.getSiblingDB("hz_retail_pos_restore_test").dropDatabase()'
```

Confirm the target database name carefully before executing any destructive database command.

## 6. Production Recovery

Production recovery requires a planned maintenance window and a verified backup.

1. Stop new POS transactions and prevent users from making changes.
2. Preserve a fresh backup of the current production database before recovery.
3. Confirm the selected archive, database name, and recovery target.
4. Follow a separately reviewed recovery procedure appropriate to the failure.
5. Verify users, products, sales, returns, inventory movements, settings, and indexes.
6. Confirm application login, product lookup, checkout, inventory, returns, and reports.
7. Resume normal use only after verification.

Do not run a production restore casually. A restore into an existing database can conflict with current records, and destructive restore options can remove data.

## 7. Backup Storage and Retention

Current backups are stored on the same machine as the POS. They provide a separate copy of the database archive, but do not protect against complete machine or disk failure.

For stronger protection:

- Copy verified backups to a separate disk or secure off-site storage.
- Restrict access to backup archives because they contain sensitive business data and user records.
- Define an agreed retention policy before automating deletion of older backups.
- Periodically test recovery from a backup stored outside the POS machine.

## 8. Verification Record

Initial recovery test:

- Source database: `hz_retail_pos`
- Restored test database: `hz_retail_pos_restore_test`
- Collections restored: 8
- Documents restored: 47
- Restore failures: 0
- Collection counts matched: Yes
- Temporary test database removed: Yes
- Production database preserved: Yes

This verifies the tested snapshot. Repeat recovery tests periodically and after significant backup-process changes.

## 9. Operational Notes

- Never use `docker compose down -v` as a backup or recovery step.
- Never delete the production MongoDB volume to troubleshoot a restore.
- Keep the application environment file and database credentials secure.
- A database archive alone does not include the application source code, deployment configuration, or secrets required to rebuild the complete POS environment.
