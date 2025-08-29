# Comprehensive security guide for internal team webapp on Ubuntu VPS

Your internal team webapp running on Ubuntu 24.04 LTS with SQLite and Node.js/Next.js requires a multi-layered security approach. This guide provides **practical, immediately implementable security measures** that don't require complex RBAC systems while ensuring robust protection.

## VPS hardening provides your first defense layer

Modern VPS security on Ubuntu 24.04 LTS begins with proper firewall configuration and SSH hardening. The **UFW firewall** offers a straightforward approach to network security that's particularly effective for internal team applications accessed via IP:port.

Start by configuring UFW with strict default policies that deny all incoming connections except those explicitly allowed. For internal team access, implement IP-based whitelisting combined with rate limiting to prevent brute force attacks. The configuration should include custom SSH ports (avoiding port 22), limited access from specific team IP ranges, and automatic blocking of repeated failed connection attempts. Recent 2024 security benchmarks recommend combining UFW with fail2ban for automated threat response, blocking IPs after 3 failed authentication attempts within 10 minutes.

SSH hardening requires **disabling password authentication entirely** in favor of Ed25519 keys, which provide quantum-resistant security for 2024-2025. Configure `/etc/ssh/sshd_config` with modern cryptographic algorithms, disable root login, and implement connection throttling to prevent DHEat attacks. The MaxStartups parameter `10:30:60` provides effective protection against connection exhaustion while maintaining usability for legitimate users.

System-level security leverages Ubuntu 24.04's kernel hardening capabilities through sysctl parameters. Enable TCP SYN cookies for DDoS protection, disable IP forwarding unless required, and implement strict memory protection with `kernel.kptr_restrict=2` and `kernel.dmesg_restrict=1`. AppArmor profiles should be enforced for all system services, with custom profiles generated for your Node.js application using `aa-genprof`.

Automated security updates through unattended-upgrades ensure critical patches are applied promptly. Configure the system to automatically install security updates daily at 4 AM, with email notifications for any issues. Combine this with AIDE file integrity monitoring to detect unauthorized system modifications, running checks every 6 hours via cron.

## SQLite security through OS permissions eliminates database vulnerabilities

SQLite databases require **strict file permissions of 600** (readable and writable only by owner) to prevent unauthorized access. This seemingly simple configuration is critical - the default 644 permissions expose your database to any system user, creating a significant security risk.

Create a dedicated database user with `useradd -r -s /bin/false dbuser` to handle all database operations. This system user should have no shell access and exist solely for database file ownership. Place database files in a secured directory structure with 750 permissions on the parent directory, owned by the database user and group. **Never use sticky bits** on SQLite directories - this causes "readonly database" errors due to SQLite's file locking mechanism.

For production deployments, enable SQLite's secure_delete pragma to overwrite deleted data with zeros, preventing data recovery from disk. Configure WAL mode for better concurrency, but ensure both the -wal and -shm files maintain the same restrictive permissions as the main database file. These auxiliary files contain unencrypted data and pose equal security risks if left unprotected.

Implement **encrypted backups using GPG with AES256** encryption, storing them in a separate secured directory with 700 permissions. Automate daily backups with a script that creates encrypted copies, maintains 30-day retention, and verifies backup integrity. For highly sensitive data, consider SQLCipher integration, which provides transparent encryption at the database level with a performance overhead of approximately 5-15%.

## Web application security without RBAC focuses on authentication strength

Clerk's authentication system provides **enterprise-grade security without complex role management**. Its hybrid token model uses 60-second session tokens with automatic refresh, minimizing the attack window while maintaining user experience. The dual-token approach separates long-lived client tokens (7 days) from short-lived session tokens, with each stored in appropriately scoped cookies.

Configure Clerk with strict security settings: enable multi-factor authentication, activate compromised password detection through HaveIBeenPwned integration, and implement OWASP-compliant password requirements. The automatic session refresh every 50 seconds ensures continuous authentication without user disruption, while bot protection with CAPTCHA prevents automated attacks.

API endpoint protection in Next.js leverages middleware for centralized authentication checks. Implement rate limiting using an LRU cache to prevent abuse, allowing 100 requests per minute per user. Each protected API route should verify the session token, validate input using Zod schemas, and apply appropriate rate limits before processing requests.

Input validation with **Zod provides type-safe, comprehensive validation** that prevents injection attacks. Define strict schemas for all user inputs, including regex patterns for names, email validation with RFC 5321 compliance, and numeric ranges for age or quantity fields. For HTML content, use DOMPurify with a restricted tag allowlist, preventing XSS while maintaining necessary formatting.

HTTPS configuration with Let's Encrypt provides automated certificate management for production deployments. Configure Nginx with TLS 1.3, modern cipher suites, and HSTS headers with a one-year max-age. For truly internal applications, self-signed certificates may suffice, but Let's Encrypt's DNS challenge enables certificate generation even for non-public domains.

## Mobile browser security requires special header configurations

Mobile browsers present unique security challenges due to touch interfaces and varying implementation standards. **Content Security Policy (CSP) serves as your primary defense**, but requires careful configuration for mobile compatibility. Implement nonce-based CSP with strict-dynamic for scripts, allowing necessary inline styles while preventing injection attacks.

The frame-ancestors 'none' directive provides critical clickjacking protection, especially important given 2024 research showing 11 major password managers vulnerable to DOM-based clickjacking on mobile browsers. Combined with X-Frame-Options: DENY, this dual-header approach ensures maximum compatibility across mobile platforms.

Configure cookies with the **__Host- prefix and SameSite=Strict** for maximum security on mobile browsers. This combination prevents CSRF attacks while ensuring cookies are only sent over HTTPS to the exact domain that set them. For internal applications accessed via IP addresses, avoid setting the Domain attribute to prevent cookie leakage.

Implement secure headers including X-Content-Type-Options: nosniff to prevent MIME-sniffing attacks that are particularly problematic in mobile WebView contexts. The Clear-Site-Data header enables secure logout by clearing all client-side storage, addressing mobile browsers' aggressive caching behaviors.

For PWA deployments, secure service worker implementation requires HTTPS-only registration with proper scope restrictions. Cache only necessary static assets, implement cache versioning, and avoid storing sensitive data in IndexedDB without encryption. The manifest.json should limit scope to prevent unauthorized access while avoiding exposure of internal information.

## Implementation prioritizes critical security measures

**Foundation Security:** Begin with SSH key-based authentication, UFW firewall configuration, and fail2ban deployment. Set SQLite database permissions to 600, create dedicated database users, and implement encrypted backups. Deploy Clerk authentication with MFA enabled and configure basic session management.

**Application Hardening:** Implement comprehensive CSP headers with nonces, configure secure cookie settings, and deploy input validation using Zod. Set up HTTPS with Let's Encrypt, configure HSTS, and implement rate limiting on all API endpoints. Begin automated security scanning with OWASP ZAP and npm audit.

## Critical configuration commands and code

Your immediate security baseline requires these essential configurations:

```bash
# Secure database setup
sudo useradd -r -s /bin/false -d /var/lib/sqlite dbuser
sudo mkdir -p /var/lib/sqlite/databases
sudo chmod 750 /var/lib/sqlite/databases
sudo chown dbuser:dbuser /var/lib/sqlite/databases
sudo chmod 600 /var/lib/sqlite/databases/app.db

# UFW firewall with rate limiting
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 1337/tcp comment "SSH Custom Port"
sudo ufw allow 443/tcp comment "HTTPS"
sudo ufw enable

# SSH hardening essentials
sudo sed -i 's/#Port 22/Port 1337/' /etc/ssh/sshd_config
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

For your Next.js application, implement this security middleware:

```javascript
// middleware.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const { userId } = await auth()
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', 
    "default-src 'self'; frame-ancestors 'none';")
  
  if (request.nextUrl.pathname.startsWith('/api/protected')) {
    if (!userId) return new Response('Unauthorized', { status: 401 })
  }
  
  return response
}
```

---

