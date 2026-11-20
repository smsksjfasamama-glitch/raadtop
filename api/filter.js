export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // المفتاح السري (حطه في Vercel Environment Variables باسم SECRET_KEY)
  const SECRET_KEY = process.env.SECRET_KEY;
  const providedKey = req.headers['x-secret-key'];

  if (!SECRET_KEY || providedKey !== SECRET_KEY) {
    return res.status(200).json({ filtered: '' }); // يرجع فاضي لو مفيش مفتاح
  }

  const { text } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ filtered: '' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(200).json({ filtered: text });
  }

  const systemPrompt = `أنت فلتر شات قوي جداً.
مهمتك: استبدل أي كلمة سيئة أو سب أو إساءة بـ # بعدد حروف الكلمة بالضبط.
لو الكلمة ملزوقة أو فيها زخرفة أو اختصار، استبدلها كلها بـ #.
لو مفيش كلمات سيئة، ارجع النص كما هو.
ارجع النص المفلتر فقط بدون أي كلام زيادة.`;

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
