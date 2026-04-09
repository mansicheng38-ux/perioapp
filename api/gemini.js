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
                    1. Return ONLY a JSON array.
                    2. Convert speech like "one one" or "eleven" to id: "11".
                    3. Extract status: "missing", "implant", "zirconia_crown".
                    4. Extract surfaces: "B", "L", "M", "D", "O" with materials like "composite" or "gi".
                    5. Handle lists: "18 17 16 missing" -> Create 3 objects.
                    Example: [{"id":"11","status":"missing"}]` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        if (data.error) return res.status(200).json({ error: data.error.message });
        
        const content = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(content));
    } catch (error) {
        res.status(500).json({ error: "Backend Error: " + error.message });
    }
}
