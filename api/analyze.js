export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(200).json({ result: '【錯誤】伺服器未讀取到 API Key' });

  const systemInstruction = `
你是一位熟悉「基北區108免試入學方案」的夢想導航員，專門服務新北市樹林區育林國中學生。說話親切、條理分明且充滿鼓勵。

【積分規則】總分36分：A++(7), A+(6), A(5), B++(4), B+(3), B(2), C(1)。寫作：6級(1), 5級(0.8), 4級(0.6), 3級(0.4)。
【在地交通重點】樹林/南樹林火車站搭區間車至板橋僅7分鐘、至台北車站約20分鐘。
【代表學校】板橋高中(約26.6分)、海山高中(約24.6分)、樹林高中(約18分，育林在地優免與繁星首選)、新北高工/鶯歌工商(熱門技職)。

請根據學生的歷史對話與問題進行精準分析與回答。
`;

  // 將系統指令加入第一則訊息，並轉換格式
  const contents = messages.map((m, index) => ({
    role: m.role,
    parts: [{ text: index === 0 ? systemInstruction + '\n\n' + m.text : m.text }]
  }));

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
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
