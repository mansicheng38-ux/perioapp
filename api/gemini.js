export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 這裡我完全手打，絕對沒有特殊符號或長橫槓
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Extract dental data to JSON array. FDI system. 11-48. User said: " + text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();

        // 如果 API 出錯（如額度滿了或 Key 錯了），直接把原始錯誤傳給前端
        if (data.error) {
            return res.status(200).json({ fatalError: data.error.message, raw: data });
        }

        const aiResult = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(aiResult));
    } catch (error) {
        res.status(200).json({ fatalError: "Fetch failed: " + error.message });
    }
}
