"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
exports.Logger = winston_1.createLogger({
    transports: [
        new winston_1.transports.Console({
            level: "info",
            format: winston_1.format.combine(winston_1.format.timestamp({
                format: "hh:mm:ss A"
            }), winston_1.format.colorize(), winston_1.format.printf(info => {
                if (info.stack) {
                    return `[${info.timestamp}] ${info.level}: ${info.stack}`;
                }
                else {
                    return `[${info.timestamp}] ${info.level}: ${info.message}`;
                }
            }))
        }),
        new winston_1.transports.File({
            filename: "output.log",
            level: "silly",
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.json())
        })
    ]
});
