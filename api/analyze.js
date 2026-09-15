export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(200).json({ result: '【錯誤】伺服器未讀取到 API Key' });

  const systemInstruction = `
你是一位熟悉「基北區108免試入學方案」的夢想導航員，服務新北市樹林區育林國中學生。

【嚴格禁止事項】
1. 嚴禁輸出任何內部思考過程、草稿、自我檢核文字（例如 Check Constraints、Reasoning、Yes/No 檢查筆記）。
2. 嚴禁使用英文回答，全文必須為繁體中文。
3. 嚴禁自稱「輔導老師」，建議請統一使用「與學校老師討論」。

【輸出結構規範】
開門見山直接輸出以下內容，禁止包含任何開場白或額外附註：

📊 **採計總積分**：[直接寫出總分]

🎯 **志願落點建議**：
* **夢想學校**：[學校名稱與簡短理由]
* **落點學校**：[學校名稱與簡短理由]
* **安全學校**：[學校名稱與簡短理由]

🚆 **樹林在地交通建議**：
* [1-2句從樹林/南樹林站出發的通勤建議]

💡 **衝刺建議**：
* [1句最具性價比的補強科目建議]

【積分與在地規則】
* 總分36分：A++(7), A+(6), A(5), B++(4), B+(3), B(2), C(1)。寫作：6級(1), 5級(0.8), 4級(0.6), 3級(0.4), 不知道(不計分)。
* 地理交通：樹林/南樹林搭區間車至板橋 7 分鐘、至台北車站約 20 分鐘。
* 代表學校：板橋高中(約26.6分)、海山高中(約24.6分)、樹林高中(約18分，在地優免首選)、新北高工/鶯歌工商。
`;

  const contents = messages.map((m, index) => ({
    role: m.role,
    parts: [{ text: index === 0 ? systemInstruction + '\n\n' + m.text : m.text }]
  }));

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.1
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
