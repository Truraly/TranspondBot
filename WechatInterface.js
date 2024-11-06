// 通过wechatwebhook 接口地址和自定义消息接受地址来创建类
// 有发送消息的函数和接受消息的函数
// 有微信bot健康状态的信息

const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const upload = multer();

const axios = require("axios");
const { Log4js } = require("./log4");
const Logger = Log4js.getLogger("WechatInterface");

class WechatInterface {
  webhookUrl; // 接口地址
  webhookToken; // 接口token
  messagePort; // 消息接受地址
  status; // 健康状态 0:健康 1:不健康
  serverstatus; // 服务状态 0:关闭 1:开启
  Server = null; // 服务实例
  MessageCallback = null; // 消息回调函数
  constructor(webhookUrl, messagePort = 3030) {
    this.webhookUrl = webhookUrl.replace(/\/webhook\/msg\/v2.+$/, "");
    this.webhookToken = webhookUrl.replace(/^.+?token=/, "");
    this.messagePort = messagePort;
    setInterval(() => {
      this.checkHealth();
    }, 1000 * 60 * 5);
  }

  /**
   * @param {any} status_ 0:健康 1:不健康
   */
  set status(status_) {
    // 状态改变时发送消息
    // if (status_ != this.status) {
    //   this.MessageCallback({
    //     tags: "status_update",
    //     data: status_,
    //   });
    // }

    this.status = status_;
  }

  // 更新健康状态
  async checkHealth() {
    // webhookUrl/healthz
    return new Promise(async (resolve, reject) => {
      try {
        let { data } = await axios.get(
          this.webhookUrl + "/healthz?token=" + this.webhookToken
        );
        Logger.debug(
          "url",
          this.webhookUrl + "/healthz?token=" + this.webhookToken
        );
        Logger.debug("data", data);
        if (data === "healthy") {
          this.status = 0;
          Logger.info("微信 Bot 健康");
        } else if (data === "unhealthy") {
          this.status = 1;
          Logger.error("微信 Bot 不健康");
        } else {
          throw new Error("返回值不合法: " + data);
        }
        resolve();
      } catch (e) {
        Logger.error(`获取健康状态失败: ${e}`);
        resolve();
      }
    });
  }

  // 发送私聊消息
  async sendPrivateMsg(user_id, message) {
    return new Promise(async (resolve, reject) => {
      let data = {
        // to: user_id,
        to: { alias: user_id },
        isRoom: false,
        data: {
          content: message,
        },
      };
      Logger.info(`发送私聊消息: ${JSON.stringify(data)}`);

      axios
        .post(
          this.webhookUrl + "/webhook/msg/v2?token=" + this.webhookToken,
          data
        )
        .then((response) => {
          resolve();
        })
        .catch((error) => {
          Logger.error(`发送消息失败: ${error}`);
          resolve();
        });
    });
  }
  // 发送群聊消息
  async sendGroupMsg(room_id, message) {
    return new Promise((resolve, reject) => {
      let data = {
        to: room_id,
        isRoom: true,
        data: {
          content: message,
        },
      };
      Logger.info(`发送群聊消息: ${JSON.stringify(data)}`);
      axios
        .post(
          this.webhookUrl + "/webhook/msg/v2?token=" + this.webhookToken,
          data
        )
        .then((response) => {
          resolve();
        })
        .catch((error) => {
          Logger.error(`发送消息失败: ${error}`);
          resolve();
        });
    });
  }

  // 启动消息接受服务,将收到的消息转发到callback
  startMessageServer(callback) {
    this.MessageCallback = callback;
    const app = express();

    // 解析 JSON 请求体
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    // 处理接收到的消息
    app.post("*", upload.any(), (req, res) => {
      const payload = {};

      req.files.forEach((file) => {
        payload[file.fieldname] = file.buffer.toString("utf-8"); // 将文件内容转为字符串
      });

      // 解析其他表单数据
      Object.keys(req.body).forEach((key) => {
        payload[key] = req.body[key];
      });

      payload.source = JSON.parse(payload.source);
      Logger.debug("收到WeChat消息:", payload);

      let callbackRes = this.MessageCallback({
        tags: ["msg", "wechat"],
        data: payload,
      });
      // 返回响应
      res.json(callbackRes | "{}");
    });

    app.listen(this.messagePort, () => {
      Logger.info(
        `微信消息接受服务已启动: http://localhost:${this.messagePort}`
      );
    });
    this.Server = app;

    // 检查健康状态
    this.checkHealth();
  }
}

module.exports = {
  WechatInterface,
};
