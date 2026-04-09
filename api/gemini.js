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
                    parts: [{ text: `You are a strict data extractor for dental charting.
RULES:
1. "one eight", "18", "eighteen" all mean tooth "18".
2. RANGES/LISTS: "18 17 16 missing" -> apply "missing" to 18, 17, and 16. "41 to 43" -> 41, 42, 43.
3. STATUS: "missing", "implant", "zirconia_crown", "cmc_crown". (Applies to whole tooth).
4. CONDITIONS: "composite", "gi", "caries", "abrasion".
5. SURFACES: "B", "L", "M", "D", "O". ("BO" = B and O).
6. FORMAT: You MUST return a JSON ARRAY of objects. Each object must have an "id" (the tooth number).
EXAMPLE 1: "18 17 16 missing"
[
  {"id": "18", "status": "missing"},
  {"id": "17", "status": "missing"},
  {"id": "16", "status": "missing"}
]
EXAMPLE 2: "14 BO composite"
[
  {"id": "14", "surfaces": {"B": "composite", "O": "composite"}}
]
Return ONLY the JSON array.` }]
                },
                contents: [{ parts: [{ text: text }] }],
                // This native setting forces Gemini to return valid JSON, preventing formatting crashes.
                generationConfig: { responseMimeType: "application/json", temperature: 0.0 }
            })
        });

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(rawText));

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message });
    }
}
