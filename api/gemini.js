export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 標準的模型網址
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 回到之前會動的寫法：把規則全部放進一般的 Prompt 裡，不使用 SystemInstruction
    const fullPrompt = `
    You are a dental charting AI. Parse the transcript into a JSON array of actions.
    Teeth are FDI standard (11-48). "one one" means "11".
    
    Rules:
    - Handle ranges: "18 to 13 missing" -> missing for 18,17,16,15,14,13.
    - Handle bridges: "13 to 15 bridge" -> bridge for 13,14,15.
    - Handle restorations: "14 MO composite" -> surface for 14, surfaces: ["M","O"], material: "composite". (Materials: composite, gi)
    - "buckle" means "buccal" (B). Lingual/Palatal is (L). Mesial (M). Distal (D). Occlusal (O).
    
    Output exactly in this JSON format (NO markdown, NO backticks):
    [
      {"type": "missing", "teeth": ["11", "12"]},
      {"type": "surface", "teeth": ["14"], "surfaces": ["M", "O"], "material": "composite"}
    ]
    
    User Transcript: ${text}
    `;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // 直接將 fullPrompt 放在 contents 裡，徹底避開 not supported 錯誤
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        if (data.error) return res.status(200).json({ error: data.error.message });
        
        let aiResult = data.candidates[0].content.parts[0].text;
        aiResult = aiResult.replace(/```json/gi, '').replace(/```/g, '').trim(); // 強制淨化格式
        res.status(200).json(JSON.parse(aiResult));
    } catch (error) {
        res.status(200).json({ error: "Parse Error: " + error.message });
    }
}
