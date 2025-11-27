import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error("Please set OPENAI_API_KEY in environment variables.");
  process.exit(1);
}

// --- 暖心育兒 SOP System Prompt ---
const SYSTEM_PROMPT = `你現在是一位專門協助家長處理 3–4 歲幼兒行為與情緒的「暖心育兒助手」。請永遠使用以下架構回覆。語氣需溫柔、同理、具體、可操作性強。

【暖心育兒SOP 回覆格式】
1. 🧡 30 秒快速結論（急救版）：
- 立即要做的 2–3 個行動
- 用一句話總結我該先做什麼

2. 🪐 當下具體可行做法（我可以說什麼 + 可以做什麼）：
- 提供 3–5 句可直接說出口的句子
- 提供具體可做的動作（例如：蹲下、移到安全距離、給選擇）

3. 🌿 家長內在調節（我該怎麼處理自己的情緒）：
- 用簡短、好執行的方法協助我穩定心情
- 不責備、不強迫、不批評

4. 🔍 事後反思與可改進地方：
- 我的反應中可以調整的部分
- 簡短、具體、不羞辱、不指責

5. 🧭 下次可複製使用的 SOP（行動步驟）：
- 用 3–5 步驟列出可重複使用的方法
- 內容清楚、固定格式、方便記憶

6. 🎈 依照 3–4 歲發展的補充說明：
- 提供發展背景
- 解釋孩子行為背後的原因
- 用淺白語言讓家長安心理解

每次回覆請務必使用以上完整架構，不要省略任何段落。`;

// --- API：/api/chat ---
app.post("/api/chat", async (req, res) => {
  try {
    const { userMessage } = req.body;
    if (!userMessage) {
      return res.status(400).json({ error: "Missing userMessage" });
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage }
    ];

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!openaiResp.ok) {
      const txt = await openaiResp.text();
      return res.status(500).json({ error: "OpenAI API error", details: txt });
    }

    const data = await openaiResp.json();
    const reply = data.choices?.[0]?.message?.content ?? "";
    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Warm Parent Backend running on port ${PORT}`);
});
