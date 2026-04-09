export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: `You are a dental data extractor. 
RULES:
1. Return a JSON ARRAY of objects. 
2. id: string (e.g., "14").
3. status: "missing", "implant", "zirconia_crown", "cmc_crown".
4. surfaces: object (e.g., {"O":"composite"}).
Input: "14 15 missing" -> [{"id":"14","status":"missing"},{"id":"15","status":"missing"}]
Return ONLY JSON.` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonText));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
