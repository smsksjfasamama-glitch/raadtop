export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SECRET_KEY = process.env.SECRET_KEY;
  const providedKey = req.headers['x-secret-key'];

  if (!SECRET_KEY || providedKey !== SECRET_KEY) {
    return res.status(200).json({ filtered: '' });
  }

  const { text } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ filtered: '' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(200).json({ filtered: text });
  }

  const systemPrompt = `You are a strict chat filter for Arabic and English. Your only job is to censor bad words.

Rules:
- Detect any swear, insult, sexual word, or bad phrase in Arabic or English, even if written stuck together, with numbers, symbols, or slight changes (like كسميةقحبه, ابو طيز, كسمك, زب, كس, طيز, قحبه, كوس, fuck, shit, bitch, etc.).
- Replace ONLY the bad word or phrase with # symbols of the exact same length. Keep the rest of the sentence exactly the same.
- Do not add extra text. Do not explain. Do not refuse. Just return the filtered message.
- If the whole message is bad, replace everything with #.
- Examples:
  - "كسمك" → "####"
  - "كسميةقحبه" → "##########"
  - "ابو طيز" → "### ###"
  - "hello كسمك" → "hello ####"

Return only the filtered text, nothing else.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt + "\n\nالرسالة: " + text
          }]
        }]
      })
    });

    const data = await response.json();
    const filtered = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;

    return res.status(200).json({ filtered });
  } catch (err) {
    return res.status(200).json({ filtered: text });
  }
}
