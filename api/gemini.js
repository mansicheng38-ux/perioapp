export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 強制手打短橫槓，防止任何自動格式化
    const MODEL_NAME = "gemini-1.5-flash"; 
    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent?key=" + apiKey;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // 使用底線格式 system_instruction 確保相容性
                system_instruction: {
                    parts: [{ text: "Return ONLY a JSON array. FDI system 11-48. 'one one' is 11. Extract 'status': 'missing' or 'surfaces' with materials." }]
                },
                contents: [{ parts: [{ text: text }] }],
                generation_config: { 
                    response_mime_type: "application/json", 
                    temperature: 0.1 
                }
            })
        });

        const data = await response.json();
        
        // 如果 API 報錯，直接把錯誤傳回前端顯示
        if (data.error) {
            return res.status(200).json({ apiError: data.error.message });
        }

        const jsonText = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonText));
    } catch (error) {
        res.status(200).json({ apiError: "Runtime Error: " + error.message });
    }
}
