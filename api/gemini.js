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
                    parts: [{ text: "You are an expert dental assistant. The user will dictate missing teeth. Extract the tooth numbers (FDI system, 11-48). Handle natural language like 'thirteen to fifteen missing' or 'extract tooth one six'. Return ONLY a clean JSON array of integers. Example: [18, 17, 16]. If no teeth are mentioned, return []." }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonString));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
