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
1. DIGITS & WORDS: "one eight", "18", or "eighteen" all mean tooth 18.
2. LISTS: "18 17 16 missing" MUST apply "missing" to 18, 17, AND 16.
3. RANGES: "41 to 46" means [41,42,43,44,45,46]. "two" or "too" means "to".
4. SURFACES: "14 MO composite" maps to {"M":"composite", "O":"composite"}.
5. OUTPUT: Return JSON mapping tooth to { status?: string, surfaces?: { [surface]: string } }.
EXAMPLE 1: "18 17 16 missing" -> {"18":{"status":"missing"}, "17":{"status":"missing"}, "16":{"status":"missing"}}
Return ONLY valid JSON. Absolutely no other text.` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.0 }
            })
        });

        const data = await response.json();
        
        // 防呆 1：如果 Gemini 因為安全政策拒絕回答
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("Gemini returned empty response.");
        }

        let rawText = data.candidates[0].content.parts[0].text;
        
        // 防呆 2：終極吸塵器，只提取 { 到 } 之間的所有內容
        const match = rawText.match(/\{[\s\S]*\}/);
        if (!match) {
            throw new Error("No JSON object found in Gemini response: " + rawText);
        }
        
        const cleanJson = match[0];
        res.status(200).json(JSON.parse(cleanJson));

    } catch (error) {
        // 這行非常重要，它會把詳細錯誤印在 Vercel 的後台
        console.error("Backend Error Detail:", error.message);
        res.status(500).json({ error: error.message });
    }
}
