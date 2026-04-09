export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        // 修正點：改用 v1 穩定版網址，模型名稱加上最新標記
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: `You are a dental charting assistant. 
                    - Output ONLY a JSON array. 
                    - Map speech like "one one" to id: "11".
                    - Status: "missing", "implant", "zirconia_crown".
                    - Surfaces: B, L, M, D, O with material (composite, gi).
                    Example: [{"id": "11", "status": "missing"}]` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        
        // 捕捉 API 錯誤並傳給前端
        if (data.error) {
            return res.status(200).json({ apiError: data.error.message });
        }

        const jsonContent = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonContent));
    } catch (error) {
        res.status(200).json({ apiError: "Connection Error: " + error.message });
    }
}
