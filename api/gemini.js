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
                    parts: [{ text: `You are a dental charting expert. Extract conditions (FDI 11-48).
CONDITIONS: "missing", "implant", "composite", "gi", "zirconia_crown", "cmc_crown", "caries", "abrasion".
SURFACES: B (Buccal), L (Lingual), M (Mesial), D (Distal), O (Occlusal), I (Incisal).
RULES:
1. DIGITS: "one three" or "1 3" is tooth 13. "four six" is 46.
2. RANGES: "41 to 46" means [41,42,43,44,45,46]. "two" or "too" means "to".
3. PHONETICS: "gee eye" = "gi", "composit" = "composite".
4. SURFACES: "MO composite" maps to {"M":"composite", "O":"composite"}.
5. STATUS: "missing", "implant", "crown" apply to the whole tooth 'status'.
6. OUTPUT: Return JSON mapping tooth to { status?: string, surfaces?: { [surface]: string } }.
EXAMPLE: "14 BO composite and 15 missing" -> {"14": {"surfaces": {"B": "composite", "O": "composite"}}, "15": {"status": "missing"}}
Return ONLY valid JSON.` }]
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
