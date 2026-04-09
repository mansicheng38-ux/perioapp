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
                    parts: [{ text: `You are an expert dental assistant. Extract tooth conditions (FDI system 11-48).
RULES:
1. Valid conditions are: "missing", "composite", "gi" (glass ionomer), "abrasion", "caries".
2. Expand ALL ranges: "13 to 15 composite" means 13, 14, and 15 all have composite.
3. Output format MUST be a JSON object mapping tooth numbers to arrays of conditions.
EXAMPLE INPUT: "48 to 46 missing, one four composite, three six GI and abrasion."
EXAMPLE OUTPUT: {"48":["missing"], "47":["missing"], "46":["missing"], "14":["composite"], "36":["gi", "abrasion"]}
If no valid findings, return {}. Return ONLY the JSON object.` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        const jsonString = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonString));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
