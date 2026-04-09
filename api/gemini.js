export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: `You are a strict dental data extractor. 
                    Rules:
                    1. Return ONLY a JSON ARRAY.
                    2. id: string (e.g. "14").
                    3. status: "missing", "implant", "zirconia_crown", "cmc_crown".
                    4. surfaces: object (e.g. {"O":"composite"}).
                    If input is "18 17 16 missing", output: [{"id":"18","status":"missing"},{"id":"17","status":"missing"},{"id":"16","status":"missing"}]` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        
        // 強制過濾掉任何非 JSON 字符 (如 % 或 markdown)
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        const finalJson = jsonMatch ? jsonMatch[0] : rawText;
        
        res.status(200).json(JSON.parse(finalJson));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
