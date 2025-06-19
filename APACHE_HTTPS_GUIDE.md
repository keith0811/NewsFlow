# NewsFlow with Apache HTTPS Setup

## Complete Apache Configuration for https://news.mystimatrix.com/

### Quick Setup (Automated)

Run the automated setup script:
```bash
chmod +x apache-https-setup.sh
sudo ./apache-https-setup.sh
```

### Manual Setup Steps

#### 1. Install Apache and SSL Tools
```bash
sudo apt update
sudo apt install apache2 certbot python3-certbot-apache
```

#### 2. Enable Required Apache Modules
```bash
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite
```

#### 3. Create Virtual Host Configuration

Create `/etc/apache2/sites-available/news.mystimatrix.com.conf`:

```apache
<VirtualHost *:80>
    ServerName news.mystimatrix.com
    
    # Redirect HTTP to HTTPS
    Redirect permanent / https://news.mystimatrix.com/
    
    ErrorLog ${APACHE_LOG_DIR}/news.mystimatrix.com_error.log
    CustomLog ${APACHE_LOG_DIR}/news.mystimatrix.com_access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName news.mystimatrix.com
    
    # SSL Configuration (managed by Certbot)
    SSLEngine on
    
    # Proxy to NewsFlow on port 5000
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyTimeout 30
    
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    
    # HTTPS Headers
    Header always set X-Forwarded-Proto https
    Header always set X-Forwarded-Port 443
    Header always set X-Forwarded-Ssl on
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    
    ErrorLog ${APACHE_LOG_DIR}/news.mystimatrix.com_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/news.mystimatrix.com_ssl_access.log combined
</VirtualHost>
```

#### 4. Enable the Site
```bash
sudo a2dissite 000-default
sudo a2ensite news.mystimatrix.com.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

#### 5. Get SSL Certificate
```bash
sudo certbot --apache -d news.mystimatrix.com
```

#### 6. Configure Firewall
```bash
sudo ufw allow 80
sudo ufw allow 443
```

### Start NewsFlow Application

#### Environment Configuration
Create `.env` file:
```env
MYSQL_HOST=103.47.29.22
MYSQL_USER=newsmystimatrix_rep
MYSQL_PASSWORD=your_actual_password
MYSQL_DATABASE=newsmystimatrix_rep
PORT=5000
NODE_ENV=production
```

#### Start Methods

**Option 1: Direct Start**
```bash
node newsflow-minimal.js
```

**Option 2: PM2 (Recommended)**
```bash
sudo npm install -g pm2
pm2 start newsflow-minimal.js --name newsflow
pm2 save
pm2 startup
```

**Option 3: Systemd Service**
Create `/etc/systemd/system/newsflow.service`:
```ini
[Unit]
Description=NewsFlow Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/newsflow-minimal
Environment=NODE_ENV=production
Environment=PORT=5000
Environment=MYSQL_HOST=103.47.29.22
Environment=MYSQL_USER=newsmystimatrix_rep
Environment=MYSQL_PASSWORD=your_password
Environment=MYSQL_DATABASE=newsmystimatrix_rep
ExecStart=/usr/bin/node newsflow-minimal.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable newsflow
sudo systemctl start newsflow
```

### Testing the Setup

1. **Check Apache status:**
```bash
sudo systemctl status apache2
```

2. **Test SSL certificate:**
```bash
curl -I https://news.mystimatrix.com/
```

3. **Check application logs:**
```bash
# For PM2
pm2 logs newsflow

# For systemd
sudo journalctl -u newsflow -f

# Apache logs
sudo tail -f /var/log/apache2/news.mystimatrix.com_ssl_error.log
```

### Troubleshooting

#### Apache Issues
```bash
# Check configuration
sudo apache2ctl configtest

# Check enabled modules
apache2ctl -M | grep proxy

# Restart Apache
sudo systemctl restart apache2
```

#### SSL Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run
```

#### Proxy Issues
```bash
# Test direct connection to app
curl http://localhost:5000/

# Check if port 5000 is in use
netstat -tulpn | grep 5000
```

### Monitoring and Maintenance

#### SSL Auto-Renewal
Certbot automatically sets up renewal. Verify:
```bash
sudo systemctl status certbot.timer
```

#### Application Monitoring
```bash
# Check application status
pm2 status

# Monitor logs
pm2 monit

# Restart if needed
pm2 restart newsflow
```

#### Performance Optimization
Add to your virtual host for better performance:
```apache
# Enable compression
LoadModule deflate_module modules/mod_deflate.so
<Location />
    SetOutputFilter DEFLATE
</Location>

# Cache static content
<LocationMatch "\.(css|js|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 month"
</LocationMatch>
```

Your NewsFlow application will be accessible at `https://news.mystimatrix.com/` with Apache handling SSL termination and proxying requests to your Node.js application on port 5000.