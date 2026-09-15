export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(200).json({ result: '【錯誤】伺服器未讀取到 API Key' });

  const systemInstructionText = `你是一位熟悉基北區108免試入學方案的升學分析助手，專門服務新北市樹林區育林國中學生。

請依據學生成績，算總積分並推薦學校。語氣親切有禮，避免自稱輔導老師，若要給予志願建議請使用「與學校老師討論」。

請務必使用繁體中文，並依照下列格式回答，直接填入具體分析結果與學校：

📊 **採計總積分**：填入算出的總積分

🎯 **志願落點建議**：
* **夢想學校**：推薦1-2所學校與原因
* **落點學校**：推薦1-2所學校與原因
* **安全學校**：推薦1-2所學校與原因

🚆 **樹林在地通勤建議**：
* 從樹林/南樹林火車站出發的交通建議

💡 **衝刺建議**：
* 給予1科最有效益的衝刺建議

積分規則：總分36分（A++:7, A+:6, A:5, B++:4, B+:3, B:2, C:1；作文6級:1, 5級:0.8, 4級:0.6, 3級:0.4, 不知道:不計分）。
在地學校參考：板橋高中(約26.6分)、海山高中(約24.6分)、樹林高中(約18分，在地優免首選)、新北高工/鶯歌工商。`;

  const contents = messages.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstructionText }]
        },
        contents: contents,
        generationConfig: {
          maxOutputTokens: 1200,
          temperature: 0.4
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ result: `【Google API 錯誤】${data.error.message}` });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '無回覆內容，請再試一次。';
    return res.status(200).json({ result: replyText });
  } catch (error) {
    return res.status(200).json({ result: `【連線異常】${error.message}` });
  }
}
