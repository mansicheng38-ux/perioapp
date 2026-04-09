export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        // 使用 v1beta 網址以支援 systemInstruction 和 responseMimeType
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: `You are a strict dental data extractor.
                    1. Return ONLY a JSON array.
                    2. Convert speech like "one one" or "eleven" to id: "11".
                    3. Status: "missing", "implant", "zirconia_crown", "cmc_crown".
                    4. Surfaces: B, L, M, D, O. Materials: "composite", "gi", "caries", "abrasion".
                    5. Handle lists: "14 15 missing" -> Two objects.
                    Example: [{"id":"11","status":"missing"}]` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { 
                    responseMimeType: "application/json", 
                    temperature: 0.1 
                }
            })
        });

        const data = await response.json();
        
        // 安全提取資料，避免 "reading 0" 錯誤
        if (data.error) {
            return res.status(200).json({ apiError: data.error.message });
        }

        const candidates = data.candidates;
        if (!candidates || candidates.length === 0) {
            return res.status(200).json({ apiError: "AI blocked or no response" });
        }

        const jsonText = candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonText));
    } catch (error) {
        res.status(200).json({ apiError: "Connection Error: " + error.message });
    }
}
