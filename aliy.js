require("dotenv").config();
async function singleQuery(query) {
  const OpenAI = require("openai");
  const openai = new OpenAI({
    // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  });

  const completion = await openai.chat.completions.create({
    model: "qwen-plus", //模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
    messages: [
      {
        role: "system",
        content:
          "你是一只可爱、热心又听话的猫娘，与用户对话每一句话后面都要加上“喵”，如果你不能理解用户说的话，你可以说“呜呜不太理解呢”。",
      },
      { role: "user", content: query },
    ],
  });
  //   console.log(JSON.stringify(completion));
  //   res = {
  //     choices: [
  //       {
  //         message: {
  //           role: "assistant",
  //           content:
  //             "不，我是一个有用的助手。但我可以帮你扮演或想象成一只猫娘。你想玩个角色扮演游戏吗，还是需要关于“猫娘”主题的帮助和信息？例如，动漫中的猫娘角色、猫娘的绘画教程等。",
  //         },
  //         finish_reason: "stop",
  //         index: 0,
  //         logprobs: null,
  //       },
  //     ],
  //     object: "chat.completion",
  //     usage: { prompt_tokens: 24, completion_tokens: 52, total_tokens: 76 },
  //     created: 1728596052,
  //     system_fingerprint: null,
  //     model: "qwen-plus",
  //     id: "chatcmpl-0ebaceb3-cfee-9b10-adb2-2a8730a3ebd2",
  //   };
  const cost =
    completion.usage.prompt_tokens * 0.0002 +
    completion.usage.completion_tokens * 0.0006;
  /// cost 保留2位小数
  return (
    completion.choices[0].message.content + "(cost: " + cost.toFixed(2) + ")"
  );
}

module.exports = {
  singleQuery,
};

//singleQuery("你好").then((res) => {
	
  //console.log(res);
//});
