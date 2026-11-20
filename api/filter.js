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
  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  const systemPrompt = `You are a strict content moderator for Arabic and English.
Detect any sexual, vulgar, insulting, or inappropriate words or phrases.
Replace only the bad parts with # symbols of the exact same length.
Keep the rest unchanged.
If clean, return original text.
Output only the filtered text.`;

  async function filterWithGemini(text) {
    if (!GEMINI_API_KEY) return text;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\nMessage: " + text }] }]
        })
      });
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || text;
    } catch {
      return text;
    }
  }

  async function filterWithGroq(text) {
    if (!GROQ_API_KEY) return text;
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0,
          max_tokens: 200
        })
      });
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || text;
    } catch {
      return text;
    }
  }

  const [geminiResult, groqResult] = await Promise.all([
    filterWithGemini(text),
    filterWithGroq(text)
  ]);

  // لو أي واحد فيهم غير النص، نستخدمه
  const filtered = (geminiResult !== text) ? geminiResult : groqResult;

  return res.status(200).json({ filtered });
}
