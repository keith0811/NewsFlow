# MySQL Database Setup for External Server

## Server Requirements
- Ubuntu 20.04+ or CentOS 7+
- MySQL 8.0+
- At least 2GB RAM
- 10GB+ disk space

## Step 1: Install MySQL on Your Server

### Ubuntu/Debian:
```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install mysql-server

# Secure MySQL installation
sudo mysql_secure_installation
```

### CentOS/RHEL:
```bash
# Install MySQL repository
sudo yum install mysql-server

# Start and enable MySQL
sudo systemctl start mysqld
sudo systemctl enable mysqld

# Get temporary root password
sudo grep 'temporary password' /var/log/mysqld.log

# Secure installation
sudo mysql_secure_installation
```

## Step 2: Configure MySQL for Remote Access

### 1. Edit MySQL Configuration
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Find and change:
```ini
# FROM:
bind-address = 127.0.0.1

# TO:
bind-address = 0.0.0.0
```

### 2. Restart MySQL
```bash
sudo systemctl restart mysql
```

## Step 3: Create NewsFlow Database and User

Login to MySQL as root:
```bash
mysql -u root -p
```

Run these SQL commands:
```sql
-- Create the database
CREATE DATABASE newsflow;

-- Create user with remote access (% = wildcard for any IP)
CREATE USER 'newsflow_user'@'%' IDENTIFIED BY 'your_secure_password_here';

-- Grant all privileges on newsflow database
GRANT ALL PRIVILEGES ON newsflow.* TO 'newsflow_user'@'%';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify user creation
SELECT user, host FROM mysql.user WHERE user = 'newsflow_user';

-- Exit MySQL
EXIT;
```

## Step 4: Configure Firewall

### Ubuntu (UFW):
```bash
# Allow MySQL port
sudo ufw allow 3306

# Check firewall status
sudo ufw status
```

### CentOS (Firewalld):
```bash
# Allow MySQL port
sudo firewall-cmd --permanent --add-port=3306/tcp
sudo firewall-cmd --reload

# Check firewall status
sudo firewall-cmd --list-all
```

## Step 5: Test Remote Connection

From your local machine or another server:
```bash
# Test connection
mysql -h YOUR_SERVER_IP -u newsflow_user -p

# If successful, you should see MySQL prompt
# Type EXIT; to disconnect
```

## Step 6: Initialize NewsFlow Schema

### Option A: Using the init.sql file
```bash
# Upload init.sql to your server, then run:
mysql -h YOUR_SERVER_IP -u newsflow_user -p newsflow < init.sql
```

### Option B: Manual setup
```sql
-- Connect to your database
mysql -h YOUR_SERVER_IP -u newsflow_user -p newsflow

-- Copy and paste the contents of init.sql file
-- (All the CREATE TABLE statements and INSERT statements)
```

## Step 7: Update Environment Variables

Update your `.env` file with your server details:
```env
DATABASE_URL=mysql://newsflow_user:your_secure_password_here@YOUR_SERVER_IP:3306/newsflow
MYSQL_HOST=YOUR_SERVER_IP
MYSQL_USER=newsflow_user
MYSQL_PASSWORD=your_secure_password_here
MYSQL_DATABASE=newsflow
```

## Step 8: Security Best Practices

### 1. Use Strong Password
```sql
-- Change to a strong password
ALTER USER 'newsflow_user'@'%' IDENTIFIED BY 'Very$ecure&Complex!Password123';
FLUSH PRIVILEGES;
```

### 2. Limit IP Access (Optional)
If you know the specific IP addresses that will connect:
```sql
-- Drop the wildcard user
DROP USER 'newsflow_user'@'%';

-- Create user for specific IP
CREATE USER 'newsflow_user'@'YOUR_APP_SERVER_IP' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON newsflow.* TO 'newsflow_user'@'YOUR_APP_SERVER_IP';
FLUSH PRIVILEGES;
```

### 3. Enable SSL (Recommended)
```sql
-- Check if SSL is enabled
SHOW VARIABLES LIKE 'have_ssl';

-- If not enabled, configure SSL in my.cnf:
[mysqld]
ssl-ca=/path/to/ca.pem
ssl-cert=/path/to/server-cert.pem
ssl-key=/path/to/server-key.pem
```

## Troubleshooting Common Issues

### Connection Timeout (ETIMEDOUT)
1. **Check firewall**: Ensure port 3306 is open
2. **Check MySQL binding**: Verify bind-address = 0.0.0.0
3. **Check user permissions**: Ensure user has '%' or specific IP access
4. **Test connection**: Use mysql command line to test

### Access Denied
```sql
-- Check user exists and permissions
SELECT user, host FROM mysql.user WHERE user = 'newsflow_user';
SHOW GRANTS FOR 'newsflow_user'@'%';
```

### Can't Connect to MySQL Server
1. **Service running**: `sudo systemctl status mysql`
2. **Port listening**: `sudo netstat -tulpn | grep 3306`
3. **Logs**: `sudo tail -f /var/log/mysql/error.log`

## Verification Commands

```bash
# Check MySQL is running
sudo systemctl status mysql

# Check port is listening on all interfaces
sudo netstat -tulpn | grep 3306

# Test local connection
mysql -u newsflow_user -p newsflow

# Test remote connection (from another machine)
mysql -h YOUR_SERVER_IP -u newsflow_user -p newsflow
```

## Example Working Configuration

Your final setup should look like this:

**Server: YOUR_SERVER_IP (e.g., 103.47.29.22)**
- MySQL 8.0 running
- Port 3306 open in firewall
- bind-address = 0.0.0.0

**Database: newsflow**
- User: newsflow_user@'%'
- Password: your_secure_password
- Full privileges on newsflow database

**Application Connection:**
```env
DATABASE_URL=mysql://newsflow_user:your_secure_password@103.47.29.22:3306/newsflow
```

After completing these steps, your NewsFlow application should connect successfully to your external MySQL database.