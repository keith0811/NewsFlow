#!/bin/bash

# Quick HTTPS Setup for news.mystimatrix.com
echo "Setting up HTTPS for NewsFlow on news.mystimatrix.com..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (use sudo)"
    exit 1
fi

# Install required packages
echo "Installing required packages..."
apt update
apt install -y nginx certbot python3-certbot-nginx

# Create Nginx configuration
echo "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/news.mystimatrix.com << 'EOF'
server {
    listen 80;
    server_name news.mystimatrix.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name news.mystimatrix.com;

    # SSL will be configured by Certbot
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header X-Forwarded-Port 443;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        proxy_set_header X-Forwarded-Ssl on;
        proxy_redirect http:// https://;
    }

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/news.mystimatrix.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid"
    systemctl reload nginx
else
    echo "Nginx configuration error. Please check the config."
    exit 1
fi

# Get SSL certificate
echo "Getting SSL certificate from Let's Encrypt..."
certbot --nginx -d news.mystimatrix.com --non-interactive --agree-tos --email admin@mystimatrix.com

# Configure firewall
echo "Configuring firewall..."
ufw allow 80
ufw allow 443

echo "HTTPS setup complete!"
echo ""
echo "Next steps:"
echo "1. Start your NewsFlow application on port 5000"
echo "2. Visit https://news.mystimatrix.com/"
echo ""
echo "To start NewsFlow:"
echo "cd /path/to/newsflow-minimal"
echo "NODE_ENV=production MYSQL_PASSWORD=your_password node newsflow-minimal.js"