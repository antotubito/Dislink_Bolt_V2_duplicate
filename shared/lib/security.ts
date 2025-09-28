// Security utilities for Dislink
export class SecurityUtils {
  // Rate limiting for registration attempts
  private static registrationAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  // Input sanitization
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .substring(0, 1000); // Limit length
  }

  // Email validation
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Password strength validation
  static isStrongPassword(password: string): boolean {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
  }

  // Rate limiting for registration
  static canRegister(email: string): boolean {
    const now = Date.now();
    const attempts = this.registrationAttempts.get(email);

    if (!attempts) {
      this.registrationAttempts.set(email, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now - attempts.lastAttempt > this.WINDOW_MS) {
      this.registrationAttempts.set(email, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if under limit
    if (attempts.count < this.MAX_ATTEMPTS) {
      attempts.count++;
      attempts.lastAttempt = now;
      return true;
    }

    return false;
  }

  // Get remaining attempts
  static getRemainingAttempts(email: string): number {
    const attempts = this.registrationAttempts.get(email);
    if (!attempts) return this.MAX_ATTEMPTS;
    
    const now = Date.now();
    if (now - attempts.lastAttempt > this.WINDOW_MS) {
      return this.MAX_ATTEMPTS;
    }
    
    return Math.max(0, this.MAX_ATTEMPTS - attempts.count);
  }

  // Clean up old attempts
  static cleanupOldAttempts(): void {
    const now = Date.now();
    for (const [email, attempts] of this.registrationAttempts.entries()) {
      if (now - attempts.lastAttempt > this.WINDOW_MS) {
        this.registrationAttempts.delete(email);
      }
    }
  }

  // XSS protection
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // CSRF token generation
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Cleanup old attempts every 5 minutes
setInterval(() => {
  SecurityUtils.cleanupOldAttempts();
}, 5 * 60 * 1000);
