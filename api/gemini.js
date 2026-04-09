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
                Rules: 
                - Return a JSON ARRAY of objects. 
                - id: string (e.g. "14"). 
                - status: "missing", "implant", "zirconia_crown", "cmc_crown".
                - surfaces: object (e.g. {"O":"composite"}).
                Return ONLY pure JSON.` }] }],
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
