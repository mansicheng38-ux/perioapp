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
                    parts: [{ text: `You are a dental charting expert. 
                    RULES:
                    1. Output ONLY a JSON array of objects.
                    2. id: string (e.g., "11", "44"). "one one" is "11", "one four" is "14".
                    3. status: "missing", "implant", "zirconia_crown", "cmc_crown".
                    4. surfaces: object (e.g., {"O": "composite"}). "BO" means {"B":"material", "O":"material"}.
                    5. Materials: "composite", "gi", "caries", "abrasion".
                    6. Typos: Correct "mising" to "missing".
                    Example: [{"id": "11", "status": "missing"}]` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        // 增加安全檢查，防止 'reading 0' 錯誤
        if (!data.candidates || data.candidates.length === 0) throw new Error("AI empty response");
        
        const jsonText = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonText));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
