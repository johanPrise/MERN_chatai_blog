import fs from 'fs';
import path from 'path';

interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO';
  message: string;
  stack?: string;
  userId?: string;
  endpoint?: string;
  ip?: string;
}

class Logger {
  private logDir: string;
  private canWriteToFile: boolean = false;

  constructor() {
    // Use /tmp for serverless environments (Vercel, AWS Lambda, etc.)
    // Otherwise use local logs directory
    this.logDir = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
      ? '/tmp/logs'
      : path.join(process.cwd(), 'logs');
    
    this.ensureLogDir();
  }

  private ensureLogDir() {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
      this.canWriteToFile = true;
    } catch (error) {
      // Silently fail and fall back to console logging
      this.canWriteToFile = false;
      console.warn('Unable to create log directory, falling back to console logging');
    }
  }

  private writeLog(entry: LogEntry) {
    // Always log to console in production for cloud platforms
    const consoleMessage = `[${entry.level}] ${entry.timestamp} - ${entry.message}`;
    
    if (entry.level === 'ERROR') {
      console.error(consoleMessage, entry.stack || '');
    } else if (entry.level === 'WARN') {
      console.warn(consoleMessage);
    } else {
      console.log(consoleMessage);
    }

    // Try to write to file if possible
    if (this.canWriteToFile) {
      try {
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        const logLine = JSON.stringify(entry) + '\n';
        fs.appendFileSync(logFile, logLine);
      } catch (error) {
        // Silently fail - console logging is already done
        this.canWriteToFile = false;
      }
    }
  }

  error(message: string, error?: Error, context?: { userId?: string; endpoint?: string; ip?: string }) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      stack: error?.stack,
      ...context
    });
  }

  warn(message: string, context?: { userId?: string; endpoint?: string; ip?: string }) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...context
    });
  }

  info(message: string, context?: { userId?: string; endpoint?: string; ip?: string }) {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...context
    });
  }
}

export const logger = new Logger();