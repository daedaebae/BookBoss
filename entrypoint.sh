#!/bin/bash
set -e

# Default environment variables if not provided
MYSQL_DATABASE=${MYSQL_DATABASE:-bookboss}
MYSQL_USER=${MYSQL_USER:-bbuser}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-bbpass}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpass}

echo "Starting BookBoss Initialization..."

# Initialize MySQL data directory if it's empty
if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "Initializing MariaDB data directory..."
    mysql_install_db --user=mysql --datadir=/var/lib/mysql > /dev/null
    
    echo "Starting MariaDB temporarily to set up users and databases..."
    mysqld --user=mysql --datadir=/var/lib/mysql --skip-networking &
    pid="$!"
    
    # Wait for MySQL to start
    for i in {30..0}; do
        if mysqladmin ping &>/dev/null; then
            break
        fi
        sleep 1
    done

    if [ "$i" = 0 ]; then
        echo >&2 "MariaDB init process failed."
        exit 1
    fi

    echo "Configuring database..."
    mysql -e "CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;"
    mysql -e "CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';"
    mysql -e "GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'localhost';"
    mysql -e "CREATE USER IF NOT EXISTS '${MYSQL_USER}'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';"
    mysql -e "GRANT ALL PRIVILEGES ON \`${MYSQL_DATABASE}\`.* TO '${MYSQL_USER}'@'%';"
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';"
    mysql -e "FLUSH PRIVILEGES;"
    
    # Run the SQL schema script
    if [ -f "/app/schema.sql" ]; then
        echo "Running schema.sql..."
        mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "/app/schema.sql"
    fi

    echo "Stopping temporary MariaDB instance..."
    if ! kill -s TERM "$pid" || ! wait "$pid"; then
        echo >&2 "MariaDB stop process failed."
        exit 1
    fi
    echo "MariaDB initialization complete."
fi

# Start MariaDB in the background
echo "Starting MariaDB service..."
mysqld --user=mysql --datadir=/var/lib/mysql &

# Wait for MariaDB to be fully ready
echo "Waiting for MariaDB to start up..."
while ! nc -z localhost 3306; do
  sleep 1
done
echo "MariaDB is ready."

# Ensure the DB schema is up to date (in case of updates using existing volume)
if [ -f "/app/schema.sql" ]; then
    echo "Applying schema.sql to ensure tables exist in case of updates..."
    # The schema should use "CREATE TABLE IF NOT EXISTS"
    mysql -u"${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" < "/app/schema.sql" || echo "Warning: Schema apply failed, might be okay if already initialized."
fi

# Run the admin user creation script (it detects if it's docker and creates admin:admin if DB is empty)
echo "Ensuring default admin user exists..."
# We pass the DB credentials as env vars so node can connect
export DB_HOST=127.0.0.1
export DB_PORT=3306
if [ -f "/app/create_docker_admin.js" ]; then
   node /app/create_docker_admin.js
fi

# Start the backup script in the background
echo "Starting background backup service..."
(
    while true; do
        sleep 86400 # 24 hours
        echo "Starting backup at $(date)..."
        mysqldump -u "${MYSQL_USER}" -p"${MYSQL_PASSWORD}" "${MYSQL_DATABASE}" > /app/backups/backup_$(date +%Y-%m-%d_%H%M%S).sql 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "Backup successful."
            # Find and delete backups older than 7 days
            find /app/backups -name 'backup_*.sql' -mtime +7 -delete
        else
            echo "Backup failed!"
        fi
    done
) &

# Start the Node.js Backend Server
echo "Starting Node.js Backend Server..."
cd /app
# We use npm start to run server.js
exec npm start
