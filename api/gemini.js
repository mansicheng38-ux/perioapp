export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `User dictated: "${text}". 
                Task: Extract dental findings.
                Rules:
                - Tooth numbers are FDI (11-48). "one one" or "11" is "11".
                - Detect "missing", "implant", "zirconia_crown", "cmc_crown".
                - Map "MO", "BO" etc to surface objects.
                - Even if there are typos like "mising", correct them to "missing".
                - Return ONLY a JSON array. Example: [{"id": "11", "status": "missing"}]` }] }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.1 
                }
            })
        });

        const data = await response.json();
        // 取得 AI 的原始文字
        const aiText = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(aiText));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
