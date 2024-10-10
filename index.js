require("dotenv").config();

console.log(process.env);
const QQServerUrl = process.env.QQServerUrl;
const WechatBotName = process.env.WechatBotName;
const WechatMessageServerPort = process.env.WechatMessageServerPort;
const adminInfo = {
  WechatName: process.env.adminInfo_WechatName,
  QQID: process.env.adminInfo_QQID,
};

const QQGroupID = process.env.QQGroupID;
const WechatRoomName = process.env.WechatRoomName;
const WechatServerUrl = process.env.WechatServerUrl;
//////////////////////////////// Loggers
const { Log4js } = require("./log4");
const Logger = Log4js.getLogger("default");
////////////////////////////////
const { QQInterface } = require("./QQInterface");
const QQBot = new QQInterface(QQServerUrl);

const { WechatInterface } = require("./WechatInterface");
const WechatBot = new WechatInterface(WechatServerUrl, WechatMessageServerPort);

QQBot.connect((message) => {
  Logger.debug(`收到QQ消息: ${JSON.stringify(message)}`);
  callFuncs(message.tags, message.data);
}).then(() => {
  //   QQBot.sendPrivateMsg(adminInfo.QQID, "QQ机器人已上线");
});
WechatBot.startMessageServer((message) => {
  Logger.debug(`收到微信消息:${JSON.stringify(message)}`);
  callFuncs(message.tags, message.data);
});
// WechatBot.sendPrivateMsg(adminInfo.WechatName, "微信机器人(server)已上线");

//////////////////////////////////////////////////////////////////////////////////////

/**
 * 调用符合条件的函数
 *
 * 只要当前事件的taglist能满足目标事件的taglist，就会调用目标事件的回调函数
 * @param {*} taglist
 * @param {*} message
 */
function callFuncs(taglist, message) {
  EventList.forEach((event) => {
    if (event[0].every((tag) => taglist.includes(tag))) {
      event[1].forEach((func) => func(message));
    }
  });
}

// 消息队列，包含事件类型和回调函数列表
let EventList = [
  // [["tag1","tag2"],[callback1,callback2]],

  [
    // 来自QQbot的消息
    ["qq", "msg"],
    [
      (message) => {
        switch (message.post_type) {
          case "meta_event":
            {
              // meta_event_type
              switch (message.meta_event_type) {
                case "heartbeat":
                  {
                    Logger.info("QQ心跳包");
                  }
                  break;
                case "lifecycle":
                  {
                    Logger.info("QQ连接成功");
                  }
                  break;
              }
            }
            break;
          case "message":
            {
              // 消息事件
              switch (message.message_type) {
                case "group":
                  {
                    callFuncs(["qq", "message", "group"], message);
                  }
                  break;
                case "private": {
                  callFuncs(["qq", "message", "private"], message);
                }
              }
            }
            break;
        }
      },
    ],
  ],

  [
    /// 来自QQbot的群聊消息
    ["qq", "message", "group"],
    [
      (message) => {
        if (
          message.group_id == QQGroupID &&
          message.user_id != message.self_id
        ) {
          message.raw_message = message.raw_message
            .replace(/\[CQ\:image,[^\]]+\]/, "[QQ图片]")
            .replace(/\[CQ\:video,[^\]]+\]/, "[QQ视频]");

          WechatBot.sendGroupMsg(
            WechatRoomName,
            "🐧 " + message.sender.nickname + "\n" + message.raw_message
          );
        }
      },
    ],
  ],
  [
    // 来自微信bot的消息
    ["wechat", "msg"],
    [
      (payload) => {
        // payload.source.room 为 {}  and payload.source.to 不为{} 时为私聊消息 ，payload.source.to 为 {} and payload.source.room 不为{} 时为群聊消息,其他情况为other
        if (
          Object.keys(payload.source.room).length == 0 &&
          Object.keys(payload.source.to).length != 0
        ) {
          callFuncs(["wechat", "message", "private"], payload);
        } else if (
          Object.keys(payload.source.room).length != 0 &&
          Object.keys(payload.source.to).length == 0
        ) {
          callFuncs(["wechat", "message", "group"], payload);
        } else if (payload.type == "system_event_login") {
          callFuncs(["wechat", "meta", "login"], payload);
        } else {
          callFuncs(["wechat", "other"], payload);
        }
      },
    ],
  ],
  [
    // 来自微信bot的私聊消息
    ["wechat", "message", "private"],
    [
      (payload) => {
        Logger.info("收到微信私聊消息:", payload);
      },
    ],
  ],
  [
    // 来自微信bot的群聊消息
    ["wechat", "message", "group"],
    [
      (payload) => {
        const sender_name = payload.source.from.payload.name;
        const room_topic = payload.source.room.payload.topic;
        let content = payload.content;
        const content_type = payload.type;
        Logger.debug("content_type", content_type);
        switch (content_type) {
          case "text":
            break;
          case "file":
            content = "[文件]";
            break;
          case "unknown":
            if (content.includes("收到红包，请在手机上查看")) {
              content = "[微信红包]";
            } else if (content.includes("<msg><emoji")) {
              content = "[微信表情]";
            } else {
              Logger.warn("未知的消息类型", content_type, "消息内容:", content);
              content = "[未知消息]";
            }
            break;
          default: {
            Logger.warn("未知的消息类型", content_type, "消息内容:", content);
            content = "[其他消息]";
          }
        }

        // 转发消息
        if (room_topic === WechatRoomName && sender_name != WechatBotName) {
          QQBot.sendGroupMsg(QQGroupID, "💬 " + sender_name + "\n" + content);
        }
      },
    ],
  ],
  [
    // 来自微信bot的其他消息
    ["wechat", "other"],
    [
      (payload) => {
        Logger.info("收到 WeChat 其他消息:", payload);
      },
    ],
  ],
  [
    // 来自微信bot的登录消息
    ["wechat", "meta", "login"],
    [
      (payload) => {
        Logger.info("微信机器人已上线");
        WechatBot.sendPrivateMsg(
          adminInfo.WechatName,
          "微信机器人(webhook)已上线"
        );
      },
    ],
  ],
];
