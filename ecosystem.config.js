module.exports = {
  apps: [
    {
      name: "Tsbot", // 中间转发服务
      script: "./index.js",
      env: {
        WechatBotName: "田园十三号机",
        WechatMessageServerPort: 3030,
        adminInfo_QQID: 1293915326,
        adminInfo_WechatName: "田园",
        QQServerUrl: "ws://192.168.31.9:3011",
      },
      env_development: {
        NODE_ENV: "development",
        // QQServerUrl: "ws://127.0.0.1:3011",
        QQGroupID: 678215674, // 群名：test(7)
        WechatRoomName: "BTEST",
        WechatServerUrl:
          "http://127.0.0.1:3001/webhook/msg/v2?token=AOZslFNHytxj",
        loggerLevel: "debug",
      },
      env_local_production: {
        NODE_ENV: "local_production",
        // QQServerUrl: "ws://127.0.0.1:3011",
        QQGroupID: 390356480,
        WechatRoomName: "捏捏的开发喵喵屋",
        WechatServerUrl:
          "http://127.0.0.1:3001/webhook/msg/v2?token=AOZslFNHytxj",
        loggerLevel: "info",
      },
      env_production: {
        NODE_ENV: "production",

        QQGroupID: 390356480,
        WechatRoomName: "捏捏的开发喵喵屋",
        WechatServerUrl:
          "http://192.168.31.9:3001/webhook/msg/v2?token=suy8jDHDrJjf",
        loggerLevel: "info",
      },
    },
    {
      name: "WechatWebhook", // 微信连接服务器
      script: "npx",
      args: "--no-install wechatbot-webhook",
      env: {
        NODE_TLS_REJECT_UNAUTHORIZED: "0",
        RECVD_MSG_API: "http://127.0.0.1:3030/",
      },
      env_development: {
        NODE_ENV: "development",
      },
      env_local_production: {
        NODE_ENV: "local_production",
        // RECVD_MSG_API: "http://192.168.31.9:3030/",
      },
      env_production: {
        NODE_ENV: "production",
        // RECVD_MSG_API: "http://192.168.31.9:3030/",
      },
      // 每天4点重启
      autorestart: true,
      cron_restart: "0 4 * * *",
    },
    // {
    //   name: "QQNapcatServer",
    //   script: "./QQNapcat.sh",
    //   args: "",
    // },
  ],
};
