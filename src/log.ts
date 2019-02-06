class Logger {
    constructor(public defaultLevel: LOG.LEVEL = LOG.LEVEL.INFO) {
    }
    log(level: LOG.LEVEL, message: string, ...opts) {
        if (level < this.defaultLevel) return;
        if (level < LOG.LEVEL.ERROR) {
            console.log(`${LOG.LEVEL[level]}: ${message}`, ...opts);
            return;
        }
        console.error(`${LOG.LEVEL[level]}: ${message}`, ...opts);
    }
}
export namespace LOG {
    export enum LEVEL {
        VERBOSE = 0,
        INFO,
        WARNING,
        ERROR,
        FATAL,
    }
    const logger = new Logger()
    export function Verbose(message, ...opts) {
        logger.log(LEVEL.VERBOSE, message, ...opts);
    }
    export function Info(message, ...opts) {
        logger.log(LEVEL.INFO, message, ...opts);
    }
    export function Warn(message, ...opts) {
        logger.log(LEVEL.WARNING, message, ...opts);
    }
    export function Error(message, ...opts) {
        logger.log(LEVEL.ERROR, message, ...opts);
    }
    export function Fatal(message, ...opts) {
        logger.log(LEVEL.FATAL, message, ...opts);
        process.exit(1);
    }
    export function SetLevel(level: LEVEL): void {
        logger.defaultLevel = level;
    }
}

