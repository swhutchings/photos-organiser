import { createLogger, transports, format } from "winston";

export const Logger = createLogger({
  transports: [
    new transports.Console({
      level: "info",
      format: format.combine(
        format.timestamp({
          format: "hh:mm:ss A"
        }),
        format.colorize(),
        format.printf(info => {
          if (info.stack) {
            return `[${info.timestamp}] ${info.level}: ${info.stack}`;
          } else {
            return `[${info.timestamp}] ${info.level}: ${info.message}`;
          }
        })
      )
    }),
    new transports.File({
      filename: "output.log",
      level: "silly",
      format: format.combine(format.timestamp(), format.json())
    })
  ]
});
