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
2. LISTS (IMPORTANT): If given a list like "18 17 16 missing", you MUST apply "missing" to 18, 17, AND 16.
3. RANGES: "41 to 46" means [41,42,43,44,45,46]. "two" or "too" between numbers means "to".
4. PHONETICS: "gee eye" = "gi", "composit" = "composite".
5. SURFACES: "14 MO composite" maps to {"M":"composite", "O":"composite"}.
6. STATUS: "missing", "implant", "crown" apply to the whole tooth 'status'.
7. OUTPUT: Return JSON mapping tooth to { status?: string, surfaces?: { [surface]: string } }.
EXAMPLE 1: "18 17 16 missing" -> {"18":{"status":"missing"}, "17":{"status":"missing"}, "16":{"status":"missing"}}
EXAMPLE 2: "14 BO composite" -> {"14":{"surfaces":{"B":"composite", "O":"composite"}}}
Return ONLY valid JSON. Do NOT use markdown code blocks.` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        let jsonString = data.candidates[0].content.parts[0].text;
        
        // 【防呆機制】：強制把 Gemini 亂加的 ```json 符號拔掉
        jsonString = jsonString.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        res.status(200).json(JSON.parse(json
