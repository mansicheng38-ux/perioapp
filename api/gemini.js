export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        // 確保這裡的橫槓是標準短橫槓 - 
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // 使用 system_instruction (底線格式) 確保相容性
                system_instruction: {
                    parts: [{ text: `You are a dental charting expert.
                    Rules:
                    1. Return ONLY a JSON array.
                    2. Tooth IDs: "11", "12", ..., "48". (e.g., "one one" is "11").
                    3. Status: "missing", "implant", "zirconia_crown", "cmc_crown".
                    4. Surfaces: B, L, M, D, O. Materials: "composite", "gi", "caries", "abrasion".
                    5. "18 17 16 missing" -> Three objects. "mising" -> "missing".` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generation_config: { 
                    response_mime_type: "application/json", 
                    temperature: 0.1 
                }
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(200).json({ apiError: data.error.message });
        }

        const jsonText = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonText));
    } catch (error) {
        res.status(200).json({ apiError: "System Error: " + error.message });
    }
}
