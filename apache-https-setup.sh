#!/bin/bash

# Apache HTTPS Setup for news.mystimatrix.com
echo "Setting up HTTPS with Apache for NewsFlow on news.mystimatrix.com..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install required packages
echo "Installing Apache and Certbot..."
apt update
apt install -y apache2 certbot python3-certbot-apache

# Enable required Apache modules
echo "Enabling Apache modules..."
a2enmod ssl
a2enmod proxy
a2enmod proxy_http
a2enmod proxy_balancer
a2enmod lbmethod_byrequests
a2enmod headers
a2enmod rewrite

# Create Apache virtual host configuration
echo "Creating Apache virtual host..."
cat > /etc/apache2/sites-available/news.mystimatrix.com.conf << 'EOF'
<VirtualHost *:80>
    ServerName news.mystimatrix.com
    ServerAlias www.news.mystimatrix.com
    
    # Redirect HTTP to HTTPS
    Redirect permanent / https://news.mystimatrix.com/
    
    ErrorLog ${APACHE_LOG_DIR}/news.mystimatrix.com_error.log
    CustomLog ${APACHE_LOG_DIR}/news.mystimatrix.com_access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName news.mystimatrix.com
    ServerAlias www.news.mystimatrix.com
    
    # SSL Configuration (will be managed by Certbot)
    SSLEngine on
    
    # Proxy configuration for NewsFlow on port 5000
    ProxyPreserveHost On
    ProxyRequests Off
    ProxyTimeout 30
    
    # Main proxy pass
    ProxyPass / http://localhost:5000/
    ProxyPassReverse / http://localhost:5000/
    
    # Headers for HTTPS
    ProxyPassReverse / http://localhost:5000/
    Header always set X-Forwarded-Proto https
    Header always set X-Forwarded-Port 443
    Header always set X-Forwarded-Ssl on
    
    # Security Headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/news.mystimatrix.com_ssl_error.log
    CustomLog ${APACHE_LOG_DIR}/news.mystimatrix.com_ssl_access.log combined
</VirtualHost>
EOF

# Disable default site
a2dissite 000-default

# Enable the new site
a2ensite news.mystimatrix.com.conf

# Test Apache configuration
apache2ctl configtest

if [ $? -eq 0 ]; then
    echo "Apache configuration is valid"
    systemctl reload apache2
else
    echo "Apache configuration error. Please check the config."
    exit 1
fi

# Get SSL certificate
echo "Getting SSL certificate from Let's Encrypt..."
certbot --apache -d news.mystimatrix.com --non-interactive --agree-tos --email admin@mystimatrix.com

# Configure firewall
echo "Configuring firewall..."
ufw allow 80
ufw allow 443

# Start and enable Apache
systemctl enable apache2
systemctl start apache2

echo "Apache HTTPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Start your NewsFlow application on port 5000"
echo "2. Visit https://news.mystimatrix.com/"
echo ""
echo "To start NewsFlow:"
echo "cd /path/to/newsflow-minimal"
echo "NODE_ENV=production MYSQL_PASSWORD=your_password node newsflow-minimal.js"
echo ""
echo "To check Apache status:"
echo "sudo systemctl status apache2"
echo "sudo tail -f /var/log/apache2/news.mystimatrix.com_ssl_error.log"