require("dotenv").config();
async function singleQuery(query) {
  const OpenAI = require("openai");

  const GPT_bailian = {
    // 若没有配置环境变量，请用百炼API Key将下行替换为：apiKey: "sk-xxx",
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  };
//   const GPT_openai = {
//     apiKey: "sk-XvbyH5YYdUa09LEsB8791d145aC0436aBbDd0231B5D020A5",
//     baseURL: "https://burn.hair",
//   };
  const openai = new OpenAI(GPT_bailian);

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
  console.log(completion);
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

// singleQuery("你好").then((res) => {
//   console.log(res);
// });
