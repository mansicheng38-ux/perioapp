export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { text } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // 用字元編碼產生短橫槓，徹底防止被電腦自動改成長橫槓
    const h = String.fromCharCode(45); // 這就是 "-"
    const model = "gemini" + h + "1.5" + h + "flash";
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Task: Extract dental findings into JSON. FDI notation (11-48). 'one one' = 11. Correction: if you hear 'won't fall' or 'nissan', it means 'missing'. Input: " + text
                    }]
                }],
                generationConfig: {
                    responseMimeType: "application/json",
                    temperature: 0.1
                }
            })
        });

        const data = await response.json();

        // 如果報錯，把「完整的網址」跟「報錯訊息」都傳回前端，我們要看到底網址長怎樣
        if (data.error) {
            return res.status(200).json({ fatalError: data.error.message, debugUrl: url });
        }

        const aiResult = data.candidates[0].content.parts[0].text;
        res.status(200).json(JSON.parse(aiResult));
    } catch (error) {
        res.status(200).json({ fatalError: error.message });
    }
}
