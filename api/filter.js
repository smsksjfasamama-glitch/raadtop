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

  const systemPrompt = `You are an AI chat moderator. Analyze the message and detect any offensive, sexual, vulgar, insulting, or inappropriate content in any language (Arabic, English, mixed, coded, decorated, or stuck-together words).

If you detect any bad content, replace only the offensive parts with # symbols matching their exact length. Keep the rest of the message unchanged.

If the message is completely clean, return it exactly as is.

Return ONLY the final filtered text. No explanations.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0,
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
