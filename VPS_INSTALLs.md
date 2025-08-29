Here's the updated installation order for Ubuntu 24.04 LTS VPS based on August 2025 requirements:

## Global System Installations (Install First)

### 1. System Updates & Basic Security

```bash
# Update package lists and upgrade system
sudo apt update && sudo apt upgrade -y

# Install essential build tools and security packages
sudo apt install -y curl wget git unzip ufw fail2ban
```

### 2. Node.js 22 LTS (Updated)

```bash
# Install Node.js 22 LTS (current LTS as of August 2025)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. PM2 Process Manager

```bash
# Install PM2 globally for production deployment
sudo npm install -g pm2@latest
```

### 4. Database & Development Tools

```bash
# SQLite and development libraries
sudo apt install -y sqlite3 libsqlite3-dev

# Optional: SQLite browser for GUI access
sudo apt install -y sqlitebrowser
```

### 5. Web Server (Nginx)

```bash
# Install Nginx for reverse proxy
sudo apt install -y nginx

# Install Certbot for SSL certificates (APT method preferred for Ubuntu 24.04)
sudo apt install -y certbot python3-certbot-nginx
```

### 6. Security Hardening Setup

```bash
# Create dedicated database user
sudo useradd -r -s /bin/false -d /var/lib/sqlite dbuser

# Create secured database directory
sudo mkdir -p /var/lib/sqlite/databases
sudo chown dbuser:dbuser /var/lib/sqlite/databases
sudo chmod 750 /var/lib/sqlite/databases

# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 1337/tcp comment "SSH Custom Port"
sudo ufw allow 80/tcp comment "HTTP"
sudo ufw allow 443/tcp comment "HTTPS"
sudo ufw --force enable
```

### 7. Enhanced SSH Hardening (Updated for 2025)

```bash
# Backup original SSH config
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Apply basic SSH security changes
sudo sed -i 's/#Port 22/Port 1337/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/#MaxStartups 10:30:100/MaxStartups 10:30:60/' /etc/ssh/sshd_config
sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Add quantum-resistant and modern cryptographic parameters
echo "KexAlgorithms sntrup761x25519-sha512@openssh.com,curve25519-sha256,curve25519-sha256@libssh.org" | sudo tee -a /etc/ssh/sshd_config
echo "Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr" | sudo tee -a /etc/ssh/sshd_config
echo "MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512" | sudo tee -a /etc/ssh/sshd_config

# Restart SSH service
sudo systemctl restart sshd
```

### 8. Optional Security Enhancements

```bash
# Modern security monitoring tools (optional but recommended)
sudo apt install -y auditd aide-common

# Enable UFW logging
sudo ufw logging on
```

## Project Directory Installations

### 9. Clone and Setup Project

```bash
# Clone your project repository
git clone <your-repo-url>
cd your-project-name

# Install project dependencies
npm install
```

### 10. Project-Specific Dependencies (Updated versions)

```bash
# Install core tech stack with version considerations
npm install @clerk/nextjs@^6.31.6 better-sqlite3 @types/better-sqlite3
npm install @trpc/client @trpc/server @trpc/react-query @trpc/next
npm install @tanstack/react-query@^5.x zustand
npm install @hookform/resolvers zod@^3.23.8 react-hook-form
npm install tailwindcss-animate class-variance-authority clsx tailwind-merge

# Note: Zod v4 has breaking changes - staying on v3 for stability
# Note: @clerk/nextjs 6.31.6+ has breaking changes in auth() helpers
```

### 11. Database Setup

```bash
# Create project database directory
mkdir -p data

# Create initial database file with proper permissions
touch data/app.db
chmod 600 data/app.db

# Run database migrations/schema setup
sqlite3 data/app.db < schema.sql
```

### 12. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.local

# Edit environment variables (use nano or your preferred editor)
nano .env.local
```

### 13. Build and Deploy

```bash
# Build the Next.js application
npm run build

# Start with PM2
pm2 start npm --name "your-app-name" -- start
pm2 startup
pm2 save
```

## Critical Changes Made

- **Node.js 20 → 22 LTS**: Updated to current LTS version
- **Enhanced SSH crypto**: Added quantum-resistant algorithms and removed deprecated ones
- **Package versions**: Pinned versions to avoid breaking changes
- **Security monitoring**: Added optional modern tools

## Critical Notes

**SSH Access**: After step 7, you MUST reconnect using port 1337:

```bash
ssh -p 1337 user@your-vps-ip
```

**Breaking Changes Warning**:

- @clerk/nextjs 6.31.6+ requires code updates for async auth() helpers
- @tanstack/react-query v5 requires React 18+
- Consider migration planning before upgrading

**Database Permissions**: 600 permissions remain critical - never use 644 in production.

**SSL Setup**: Run after Nginx configuration:

```bash
sudo certbot --nginx -d your-domain.com
```