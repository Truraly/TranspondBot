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
const { singleQuery } = require("./aliy");
const { QQInterface } = require("./QQInterface");
const QQBot = new QQInterface(QQServerUrl);

const { WechatInterface } = require("./WechatInterface");
const WechatBot = new WechatInterface(WechatServerUrl, WechatMessageServerPort);

QQBot.connect((message) => {
  Logger.debug(`收到QQ消息: ${JSON.stringify(message)}`);
  callFuncs(message.tags, message.data);
}).then(() => {
  QQBot.sendPrivateMsg(adminInfo.QQID, "QQ机器人(napcat)已上线");
});
WechatBot.startMessageServer((message) => {
  Logger.debug(`收到微信消息:${JSON.stringify(message)}`);
  callFuncs(message.tags, message.data);
});
setTimeout(() => {
  WechatBot.sendPrivateMsg(adminInfo.WechatName, "微信机器人(Tsbot)已上线");
}, 5000);

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
    // 如果目标对象
    if (event.tags.every((tag) => taglist.includes(tag))) {
      event.funs.every((func) => {
        return (
          func(message, {
            QQBot,
            WechatBot,
          }) !== false
        );
      });
    }
  });
}

// 消息队列，包含事件类型和回调函数列表
let EventList = [
  // [["tag1","tag2"],[callback1,callback2]],

  {
    // 来自napcat实现的消息
    tags: ["qq", "msg"],
    funs: [
      (message, bots) => {
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
          default:
            Logger.info("QQ未知的消息类型", message);
        }
      },
    ],
  },
  {
    /// 来自QQ的群聊消息
    tags: ["qq", "message", "group"],
    funs: [
      // 机器人回复
      (message, bots) => {
        // 如果是@机器人的消息，调用api
        let reg_at = new RegExp(`^\\[CQ:at,qq=${message.self_id}\\] ?`);
        if (reg_at.exec(message.raw_message)) {
          Logger.info("收到@消息", message.raw_message);
          singleQuery(
            message.raw_message.replace(reg_at, "").replace(/\s+/g, "")
          ).then((res) => {
            bots.QQBot.sendGroupMsg(
              message.group_id,
              "[CQ:at,qq=" + message.user_id + "] " + res
            );
          });
          return false;
        }
      },
      // 转发消息
      (message, bots) => {
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
  },
  {
    // 来自WechatWebHook的消息
    tags: ["wechat", "msg"],
    funs: [
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
  },
  {
    // 来自微信的私聊消息
    tags: ["wechat", "message", "private"],
    funs: [
      (payload) => {
        Logger.info("收到微信私聊消息:", payload);
      },
    ],
  },
  {
    // 来自微信的群聊消息
    tags: ["wechat", "message", "group"],
    funs: [
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

        // 如果是@机器人的消息，调用api
        const Reg = new RegExp(`^ ?@${WechatBotName} ?`);
        if (Reg.test(content)) {
          Logger.info("收到@消息", content);
          singleQuery(content.replace(Reg, "")).then((res) => {
            WechatBot.sendGroupMsg(room_topic, res);
          });
          return;
        }
        // 转发消息
        if (room_topic === WechatRoomName && sender_name != WechatBotName) {
          QQBot.sendGroupMsg(QQGroupID, "💬 " + sender_name + "\n" + content);
        }
      },
    ],
  },
  {
    // 来自微信的其他消息
    tags: ["wechat", "other"],
    funs: [
      (payload) => {
        Logger.info("收到 WeChat 其他消息:", payload);
      },
    ],
  },
  {
    // 来自微信的登录消息
    tags: ["wechat", "meta", "login"],
    funs: [
      (payload) => {
        Logger.info("微信机器人已上线");
        WechatBot.sendPrivateMsg(
          adminInfo.WechatName,
          "微信机器人(WechatWebhook)已上线"
        );
      },
    ],
  },
];

// 全局错误处理
process.on("uncaughtException", (err) => {
  Logger.error("uncaughtException", err);
  try {
    QQBot.sendPrivateMsg(adminInfo.QQID, "uncaughtException: " + err);
  } catch (e) {
    Logger.error("发送消息失败", e);
  }
});
