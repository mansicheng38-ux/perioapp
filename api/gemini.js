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
                    parts: [{ text: `Extract dental data. Rules:
                    1. Return ONLY a JSON array of objects.
                    2. id: 2-digit string (e.g., "11", "44"). "one one" or "1 1" is "11".
                    3. status: "missing", "implant", "zirconia_crown", "cmc_crown".
                    4. surfaces: object (e.g., {"M": "composite", "O": "composite"}).
                    5. If a list is given (18 17 16 missing), create objects for EACH id.
                    Example: [{"id": "11", "status": "missing"}]` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        
        // SAFE ACCESS: This prevents the 'reading 0' error
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!content) {
            return res.status(200).json({ error: "AI blocked or empty response", raw: data });
        }

        res.status(200).json(JSON.parse(content));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
