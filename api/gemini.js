export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `Extract dental findings from: "${text}". 
                Output a JSON array of objects. 
                Each object MUST have:
                - "id": string (FDI 11-48)
                - "status": optional string ("missing", "implant", "zirconia_crown", "cmc_crown")
                - "surfaces": optional object (keys: B, L, M, D, O; value: "composite", "gi", "caries", "abrasion")
                Example: [{"id": "14", "surfaces": {"O": "composite"}}, {"id": "18", "status": "missing"}]` }] }],
                generationConfig: { 
                    responseMimeType: "application/json",
                    temperature: 0.1 
                }
            })
        });

        const data = await response.json();
        // 直接輸出內容，因為已經強制 JSON 格式
        const jsonResponse = JSON.parse(data.candidates[0].content.parts[0].text);
        res.status(200).json(jsonResponse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
