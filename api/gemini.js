export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Using the most basic v1beta endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Task: Extract dental findings into a JSON array. 
                        Rules:
                        - FDI notation (11-48). "one one" is "11".
                        - Output ONLY valid JSON.
                        - Format: [{"id": "11", "status": "missing"}]
                        - User input: "${text}"`
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            })
        });

        const data = await response.json();

        if (data.error) {
            return res.status(200).json({ fatalError: data.error.message });
        }

        if (!data.candidates || !data.candidates[0].content) {
            return res.status(200).json({ fatalError: "AI returned no content. Check API Key permissions." });
        }

        const aiResult = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(aiResult));
    } catch (error) {
        res.status(200).json({ fatalError: "System Error: " + error.message });
    }
}
