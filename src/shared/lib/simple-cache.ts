
import fs from 'fs';
import path from 'path';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_DIR = path.resolve(process.cwd(), '.cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export class SimpleFileCache {
  private static getFilePath(key: string): string {
    // Sanitize key for filename
    const safeKey = key.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    return path.join(CACHE_DIR, `${safeKey}.json`);
  }

  static get<T>(key: string, ttlSeconds: number = 86400): T | null {
    try {
      const filePath = this.getFilePath(key);
      if (!fs.existsSync(filePath)) return null;

      const content = fs.readFileSync(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      // Check TTL
      if (Date.now() - entry.timestamp > ttlSeconds * 1000) {
        fs.unlinkSync(filePath); // Expired
        return null;
      }

      return entry.data;
    } catch (e) {
      return null;
    }
  }

  static set<T>(key: string, data: T): void {
    try {
      const filePath = this.getFilePath(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      fs.writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
    } catch (e) {
      // Ignore write errors
    }
  }
}
