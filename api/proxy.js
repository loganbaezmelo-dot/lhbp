// api/proxy.js - Vercel Serverless Function
export default async function handler(req, res) {
  // enable CORS so your front-end can talk to it cleanly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { words } = req.body;
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: 'words array is required' });
    }

    // take unique lowercase words, ignore 1-letter noise/numbers
    const uniqueWords = [...new Set(words)]
      .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
      .filter(w => w.length > 2)
      .slice(0, 40); // cap to top 40 unique words so we don't get rate limited

    const results = await Promise.allSettled(
      uniqueWords.map(async (word) => {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        return {
          word,
          isReal: response.ok
        };
      })
    );

    const validWords = [];
    const fakeWords = [];

    results.forEach((res) => {
      if (res.status === 'fulfilled') {
        if (res.value.isReal) {
          validWords.push(res.value.word);
        } else {
          fakeWords.push(res.value.word);
        }
      }
    });

    return res.status(200).json({
      totalChecked: uniqueWords.length,
      realWordCount: validWords.length,
      validWords,
      fakeWords
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
