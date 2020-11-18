import winston from 'winston';

const alignedWithColorsAndTime = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf((info) => {
        const {
            timestamp, level, ...args
        } = info;

        const ts = timestamp.slice(0, 19).replace('T', ' ');
        return `${ts} [${level}]: ${Object.keys(args).length
            ? JSON.stringify(args) : ''}`;
    }),
);

const alignedAndTime = winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf((info) => {
        const {
            timestamp, level, ...args
        } = info;

        const ts = timestamp.slice(0, 19).replace('T', ' ');
        return `${ts} [${level}]: ${Object.keys(args).length
            ? JSON.stringify(args) : ''}`;
    }),
);

const logger = winston.createLogger({
    transports: [
        new winston.transports.File({
            filename: 'logs/combined.log',
            level: 'info',
            format: alignedAndTime
        }),
        new winston.transports.File({
            filename: 'logs/errors.log',
            level: 'error',
            format: alignedAndTime
        }),
        new winston.transports.Console({
            level: 'debug',
            handleExceptions: true,
            format: alignedWithColorsAndTime
        })
    ]
});

export class Logger {

    private static instance: Logger;
    public logger: winston.Logger;

    private constructor() {
        this.logger = logger;
    }

    /**
     * Get a singleton instance of Logger
     */
    public static getInstance = (): Logger => {

        if (!Logger.instance) {
            Logger.instance = new Logger();
        }

        return Logger.instance;
    }

}
