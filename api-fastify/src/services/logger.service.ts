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
  private logDir = path.join(process.cwd(), 'logs');

  constructor() {
    this.ensureLogDir();
  }

  private ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeLog(entry: LogEntry) {
    const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(entry) + '\n';
    
    fs.appendFileSync(logFile, logLine);
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