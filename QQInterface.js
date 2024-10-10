// 通过ws创建接口类，目前只支持正向ws连接
// 有ws连接函数，消息发送函数，消息接受函数等等
// 存放ws状态，等信息

const { Log4js } = require("./log4");
const WebSocket = require("ws");
const Logger = Log4js.getLogger("QQInterface");

class QQInterface {
  QQServerUrl = ""; // QQ服务器地址
  connection = null; // WebSocket连接
  MessageCallback = null; // 消息回调函数
  constructor(QQServerUrl) {
    this.QQServerUrl = QQServerUrl;
    this.connection = new WebSocket(QQServerUrl);
  }

  // 连接函数
  async connect(callback) {
    this.MessageCallback = callback;
    return new Promise((resolve, reject) => {
      if (this.connection.readyState === WebSocket.OPEN) {
        Logger.warn("WebSocket 已连接");
        reject();
      }

      this.connection.on("open", () => {
        Logger.info("连接到 OneBot WebSocket 服务器");
        resolve();
      });

      this.connection.on("message", (message) => {
        // 解析buffer
        message = JSON.parse(message);

        this.MessageCallback({
          tags: ["msg", "qq"],
          data: message,
        });
      });

      this.connection.on("error", (error) => {
        Logger.error(`WebSocket error: ${error}`);
        reject();
      });

      this.connection.on("close", () => {
        Logger.info("关闭 WebSocket 连接");
        reject();
      });
    });
  }

  // 发送群聊消息
  async sendGroupMsg(group_id, message) {
    return new Promise((resolve, reject) => {
      if (this.connection.readyState !== WebSocket.OPEN) {
        Logger.error("WebSocket 未连接");
        reject();
      }

      let data = {
        action: "send_group_msg",
        params: {
          group_id: group_id,
          message: message,
        },
      };
      Logger.info(`发送: ${JSON.stringify(data)}`);
      this.connection.send(JSON.stringify(data));
      resolve();
    });
  }

  // 发送私聊消息
  async sendPrivateMsg(user_id, message) {
    return new Promise((resolve, reject) => {
      if (this.connection.readyState !== WebSocket.OPEN) {
        Logger.error("WebSocket 未连接");
        reject();
      }

      let data = {
        action: "send_private_msg",
        params: {
          user_id: user_id,
          message: message,
        },
      };
      Logger.info(`发送: ${JSON.stringify(data)}`);
      this.connection.send(JSON.stringify(data));
      resolve();
    });
  }
}

module.exports = {
  QQInterface,
};
