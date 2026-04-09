export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 暴力拆解字串，確保橫槓絕對是標準短橫槓
    const m = ["gemini", "1.5", "flash"].join("-");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: "Extract dental data to JSON array. FDI system. 11-48. 'one one' is '11'. Status: 'missing'. Return ONLY JSON." }]
                },
                contents: [{ parts: [{ text: text }] }],
                generation_config: { 
                    response_mime_type: "application/json",
                    temperature: 0.1 
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(200).json({ apiError: data.error.message });
        }

        if (!data.candidates || data.candidates.length === 0) {
            return res.status(200).json({ apiError: "AI blocked or empty candidates" });
        }

        const jsonStr = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonStr));
    } catch (error) {
        res.status(200).json({ apiError: "Fetch Error: " + error.message });
    }
}
