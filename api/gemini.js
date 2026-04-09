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
                    parts: [{ text: `You are a dental charting expert. Extract tooth conditions and surfaces (FDI 11-48).
                    CONDITIONS: "missing", "implant", "composite", "gi", "zirconia_crown", "cmc_crown", "bridge", "caries", "abrasion".
                    SURFACES: B (Buccal), L (Lingual), M (Mesial), D (Distal), O (Occlusal), I (Incisal).
                    RULES:
                    1. Map "MO" to ["M", "O"], "BOD" to ["B", "O", "D"], etc.
                    2. "14 implant" or "14 zirconia crown" applies to the WHOLE tooth (status).
                    3. "14 BO composite" applies "composite" ONLY to B and O surfaces.
                    4. Return JSON mapping tooth number to an object with 'status' (string) and 'surfaces' (object mapping surface code to condition).
                    EXAMPLE OUTPUT: {"14": {"surfaces": {"B": "composite", "O": "composite"}}, "15": {"status": "zirconia_crown"}}` }]
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
