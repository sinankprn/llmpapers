/**
 * Rate Limiter for arXiv API
 * Enforces 3-second delay between requests as per arXiv guidelines
 */

class RateLimiter {
  constructor(delayMs = 3000) {
    this.delayMs = delayMs;
    this.lastRequestTime = 0;
  }

  async wait() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.delayMs) {
      const waitTime = this.delayMs - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }
}

export default RateLimiter;
