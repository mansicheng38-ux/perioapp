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
                    parts: [{ text: `You are a strict dental charting data extractor. 
RULES:
1. JSON KEYS MUST BE EXACTLY THE 2-DIGIT TOOTH NUMBER (e.g. "18", "46"). Do not add words like "tooth".
2. If multiple teeth have the same condition (e.g. "18 17 16 missing"), create a separate key for EACH tooth.
3. CONDITIONS MUST BE STRICTLY LOWERCASE: "missing", "implant", "composite", "gi", "zirconia_crown", "cmc_crown", "caries", "abrasion".
4. SURFACES MUST BE STRICTLY UPPERCASE: "B", "L", "M", "D", "O", "I".
5. OUTPUT STRUCTURE MUST BE EXACTLY LIKE THIS:
{
  "18": { "status": "missing" },
  "17": { "status": "missing" },
  "14": { "surfaces": { "M": "composite", "O": "composite" } }
}
Return pure JSON only.` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.0 }
            })
        });

        const data = await response.json();
        let rawText = data.candidates[0].content.parts[0].text;
        
        // 抓取純 JSON 區塊
        const match = rawText.match(/\{[\s\S]*\}/);
        res.status(200).json(JSON.parse(match ? match[0] : rawText));

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: error.message });
    }
}
