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

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(200).json({ filtered: text });
  }

  const systemPrompt = `You are a strict Arabic and English chat filter. Censor bad words only.

Rules:
- Find any swear, insult, or sexual word in Arabic or English, even if stuck together, with numbers, symbols, or slightly changed (كسميةقحبه, ابو طيز, كسمك, زب, كس, طيز, قحبه, كوس, fuck, shit, bitch, ass, dick, etc.).
- Replace ONLY the bad word/phrase with # of the exact same length. Keep everything else exactly the same.
- Do not add text. Do not explain. Return only the filtered message.
- If the whole message is bad, replace it all with #.
- Examples:
  "كسمك" → "####"
  "كسميةقحبه" → "##########"
  "ابو طيز" → "### ###"
  "hello كسمك" → "hello ####"
  "زب طيز" → "## ###"

Return only the filtered text.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0.1,
        max_tokens: 200
      })
    });

    const data = await response.json();
    const filtered = data.choices?.[0]?.message?.content?.trim() || text;

    return res.status(200).json({ filtered });
  } catch (err) {
    return res.status(200).json({ filtered: text });
  }
}
