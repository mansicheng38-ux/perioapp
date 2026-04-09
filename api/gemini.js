export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 用最保險的字元拼接，確保橫槓絕對是短的 -
    const model = ["gemini", "1.5", "flash"].join("-");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Context: Dental charting. 
                        Task: Extract data to JSON array.
                        Correction: If user says "nissan", it means "missing".
                        Rules: FDI IDs (11-48). 
                        Input: "${text}"
                        Format: [{"id": "11", "status": "missing"}]`
                    }]
                }],
                generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
            })
        });

        const data = await response.json();
        if (data.error) return res.status(200).json({ fatalError: data.error.message });
        
        const result = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(result));
    } catch (error) {
        res.status(200).json({ fatalError: error.message });
    }
}
