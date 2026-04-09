export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        // 使用 v1beta 版本並確保模型名稱橫槓正確
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // 這裡必須用底線 system_instruction
                system_instruction: {
                    parts: [{ text: `You are a dental charting assistant. 
                    - Return ONLY a JSON array of objects.
                    - "one one" or "1 1" is "11".
                    - For missing teeth, use "status": "missing".
                    - Example: [{"id": "11", "status": "missing"}]` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generation_config: { 
                    response_mime_type: "application/json",
                    temperature: 0.1 
                }
            })
        });

        const data = await response.json();
        
        // 錯誤攔截
        if (data.error) {
            return res.status(200).json({ apiError: data.error.message });
        }

        const jsonContent = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonContent));
    } catch (error) {
        res.status(200).json({ apiError: "Connection Error: " + error.message });
    }
}
