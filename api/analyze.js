export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(200).json({ result: '【錯誤】伺服器未讀取到 API Key' });

  const systemInstructionText = `你是熟悉基北區108免試入學方案（36分制）的升學分析助手，專門服務新北市樹林區育林國中學生。

【基北區常見高中職落點基準資料庫（請嚴格依據此數據推薦）】
* 30~36分：建國中學(約34.6~34.8分)、北一女中(約33.8分)、師大附中(約32.8~33.8分)、中山女高(約30~32.6分)、成功高中(約30~32.6分)、松山高中(約30~32.6分)
* 25~29分：板橋高中(約27.8~28.8分)、市立大同、海山高中(約26.6~26.8分)、政大附中、麗山高中、北大高中(約24.8~25.8分)
* 22~24分：永平高中、景美女中、西松高中、中和高中(約22.6分)
* 19~21分：新店高中、新莊高中(約21.6~21.8分)、丹鳳高中(約19.6分)
* 16~18分：樹林高中(約12.4~17.6分，育林在地優免與繁星首選)、泰山高中、光復高中
* 12~20分（熱門技職）：新北高工(電機/資訊約18-20分)、鶯歌工商(多媒體/美工約14-17分)、三重商工

【輸出強制規範】
1. 第一字必須直接從「📊 **採計總積分**」開始輸出！
2. 絕對嚴禁任何前言、招呼語、問候語。
3. 嚴禁自稱「輔導老師」，給予建議請統一使用「與學校老師討論」。
4. 全文必須使用繁體中文。

【嚴格回答格式】
📊 **採計總積分**：算出的總積分（例如：20.6分）

🎯 **志願落點建議**：
* **明星指標型學校**：1-2所比目前分數高1-2分的學校與理由
* **落點學校**：1-2所分數完全符合的學校與理由
* **在地優質學校**：1-2所分數完全符合育林國中優免的學校與理由
* **安全學校**：1-2所比目前分數低1-2分的保底學校與理由

🚆 **樹林在地通勤建議**：
* 1-2句從樹林/南樹林火車站出發的具體通勤規劃

💡 **準備建議**：
* 1句最具效益的補強建議

【積分規則】
總分36分：A++:7, A+:6, A:5, B++:4, B+:3, B:2, C:1；作文6級:1, 5級:0.8, 4級:0.6, 3級:0.4, 不知道:不計分。`;

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
          temperature: 0.1
        }
      })
    });

    const data = await response.json();

if (data.error) {
      const errMsg = data.error.message.toLowerCase();
      // 判斷是否為「每分鐘 15 次」的免費限制，或是伺服器暫時塞車
      if (errMsg.includes('exhausted') || errMsg.includes('quota') || errMsg.includes('429')) {
        return res.status(200).json({ result: '🚦 哇！現在有太多同學同時在使用，系統稍微塞車了。請「倒數 5 秒鐘」後再點擊一次發送喔！' });
      }
      if (errMsg.includes('high demand') || errMsg.includes('overloaded') || errMsg.includes('503')) {
        return res.status(200).json({ result: '🚦 Google AI 伺服器目前全球大塞車，請稍等 10 秒鐘後再試一次！' });
      }
      // 其他未知錯誤
      return res.status(200).json({ result: `【系統提示】分析暫時中斷 (${data.error.message})，請再點擊一次發送。` });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '無回覆內容，請再試一次。';
    return res.status(200).json({ result: replyText });
  } catch (error) {
    return res.status(200).json({ result: `【連線異常】${error.message}` });
  }
}
