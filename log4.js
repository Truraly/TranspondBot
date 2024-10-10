const Log4js = require("log4js");
require("dotenv").config();
Log4js.configure({
  appenders: {
    // 控制台输出
    console: { type: "console" },
    // 文件输出
    file: {
      // 输出类型: fileSync | file
      type: "fileSync",
      // 最大文件大小
      maxLogSize: 10485760,
      // 最大文件数量
      backups: 5,
      // 压缩
      compress: true,
      // 文件名
      filename: "logs/app.log",
    },
  },
  categories: {
    default: {
      appenders: ["console", "file"],
      // 日志级别: trace | debug | info | warn | error | fatal
      level: process.env.loggerLevel,
      //   level: "debug",
      //   level: "info"
    },
  },
});

module.exports = {
  Log4js,
};
