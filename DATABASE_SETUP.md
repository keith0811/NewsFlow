# MySQL Database Setup for NewsFlow

## Quick Setup Options

### Option 1: Railway (Recommended - Free)
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Provision MySQL"
4. Go to your MySQL service → "Variables" tab
5. Copy these values:
   - MYSQL_HOST (usually something like `containers-us-west-xxx.railway.app`)
   - MYSQL_USER (usually `root`)
   - MYSQL_PASSWORD (generated password)
   - MYSQL_DATABASE (usually `railway`)

### Option 2: PlanetScale (Free tier)
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up and create a new database
3. Create a branch and get connection details
4. Use the MySQL connection string format

### Option 3: Aiven (Free tier)
1. Go to [aiven.io](https://aiven.io)
2. Sign up and create a MySQL service
3. Get connection details from the service overview

## After Getting Credentials
1. Add these secrets in Replit:
   - MYSQL_HOST
   - MYSQL_USER  
   - MYSQL_PASSWORD
   - MYSQL_DATABASE

2. The app will automatically connect and create tables

## Temporary Local Setup
If you want to test locally first, you can use:
- MYSQL_HOST: localhost
- MYSQL_USER: root
- MYSQL_PASSWORD: (leave empty)
- MYSQL_DATABASE: newsflow

But you'll need MySQL installed locally.