export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Extract dental data from: "${text}". 
                Required JSON format: [{"id": "14", "status": "missing", "surfaces": {"O": "composite"}}]
                Rules: 
                - Return ONLY a JSON array.
                - id must be string (11-48).
                - Valid status: missing, implant, zirconia_crown, cmc_crown.
                - Valid surfaces: B, L, M, D, O.` }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        // 抓取最外層的 [ ] 確保解析成功
        const raw = data.candidates[0].content.parts[0].text;
        const match = raw.match(/\[[\s\S]*\]/);
        res.status(200).json(JSON.parse(match ? match[0] : raw));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
