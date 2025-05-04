require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');

const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/galb-chat', async (req, res) => {
  try {
    const userMessage = req.body.message;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'أنت مساعد ذكي لمنصة قلب للمزادات التفاعلية.' },
        { role: 'user', content: userMessage },
      ],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('خطأ في استدعاء ChatGPT');
  }
});

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
