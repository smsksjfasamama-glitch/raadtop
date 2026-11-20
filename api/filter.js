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

  const systemPrompt = `أنت فلتر محتوى صارم جداً.
أي كلمة أو جملة فيها سب أو إهانة أو كلام جنسي أو بذيء، استبدلها بعلامة # بنفس عدد الحروف.
لو الكلمة ملتصقة أو فيها حروف زيادة، برضو فلترها.
لو النص نضيف، رجعه زي ما هو.
رجّع النص النهائي فقط بدون أي كلام إضافي.`;

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
