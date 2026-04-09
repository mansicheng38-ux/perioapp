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
                    parts: [{ text: `You are a dental charting assistant. 
RULES:
1. Always return a JSON ARRAY of objects.
2. The "id" MUST be a 2-digit string (e.g., "44", "18").
3. For status, use: "missing", "implant", "zirconia_crown", "cmc_crown".
4. For surfaces, map codes like "MO" to {"M": "composite", "O": "composite"}.
EXAMPLE: "44 missing" -> [{"id": "44", "status": "missing"}]` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        res.status(200).json(JSON.parse(data.candidates[0].content.parts[0].text));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
