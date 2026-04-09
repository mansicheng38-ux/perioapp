export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        // 強制使用 gemini-1.5-flash，這是目前輸出 JSON 最穩定的模型
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: `You are a dental data extractor. 
RULES:
1. Return a JSON ARRAY of objects. 
2. id: 2-digit string (e.g., "14"). "one four" = "14", "one one" = "11".
3. status: "missing", "implant", "zirconia_crown", "cmc_crown".
4. surfaces: object (e.g., {"M":"composite", "O":"composite"}).
5. If input is "14 15 missing", return [{"id":"14","status":"missing"},{"id":"15","status":"missing"}].
Return ONLY the JSON array.` }]
                },
                contents: [{ parts: [{ text: text }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();

        // 核心修正：檢查回覆是否有效
        if (!data.candidates || data.candidates.length === 0 || !data.candidates[0].content) {
            console.error("Gemini Blocked or Empty:", data);
            return res.status(200).json([]); // 回傳空陣列而非報錯
        }

        const jsonText = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(jsonText));
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: "Backend crash: " + error.message });
    }
}
