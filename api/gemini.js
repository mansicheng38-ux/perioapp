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
                    parts: [{ text: `You are a dental charting expert. Extract findings into a JSON array.
                    RULES:
                    1. Teeth are FDI (11-48). "one one" = 11, "four eight" = 48.
                    2. Expand lists: "18 17 16 missing" -> 3 objects.
                    3. Map materials: "white filling/resin/composite" -> "composite", "GI/glass ionomer/gee eye" -> "gi".
                    4. Map surfaces: "BO" -> {"B":"material", "O":"material"}.
                    5. Status: "missing", "implant", "zirconia_crown", "cmc_crown".
                    Return ONLY a JSON array. Example: [{"id":"14","surfaces":{"O":"composite"}}]` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        if (data.error) {
            return res.status(data.error.code || 500).json({ error: data.error.message });
        }
        const jsonText = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonText));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
