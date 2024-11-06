# 田园的自用 Bot

## 转发消息

同步微信和 QQ 的消息，到对方群里

微信客户端 + 中间服务器 + QQ 客户端

微信使用`npx wechatbot-webhook`启动

QQ 使用`catnap`启动

使用 pm2 管理 wechatbot-webhook 和中间服务器

```bash
yarn dev
yarn prod
```

使用 screen 管理 catnap

```bash
# 安装napcat
curl -o napcat.sh https://nclatest.znin.net/NapNeko/NapCat-Installer/main/script/install.sh && sudo bash napcat.sh --docker n --dlc y --cli y --force

# 启动napcat
screen -dmS napcat bash -c "xvfb-run -a qq --no-sandbox -q 1834732913"
```

---

在本地安装 napcat 会导致自己的 qq 被删除，所以测试比较麻烦

在本地测试需要 [LLOneBot](https://github.com/LLOneBot/LLOneBot) 这种更合适一些

同时 napcat 支持的是 onebot11 而不是 12,在使用上有些区别

似乎有 nodejs 的 SDK

https://doc.napneko.icu/use/integration
