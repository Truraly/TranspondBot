// bot类
// 定义了发送消息的方法

class Bot {
  constructor() {}

  // 发送群聊消息
  async sendGroupMsg(group_id, message) {}

  // 发送私聊消息
  async sendPrivateMsg(user_id, message) {}
}

module.exports = Bot;