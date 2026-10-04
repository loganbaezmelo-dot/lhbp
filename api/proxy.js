import wordsList from 'an-array-of-english-words';

// load the 275k words into a hash set in memory for instant lookups
const dictionary = new Set(wordsList);

// add extra common school/food terms or slang just in case
const extras = ['wednesday', 'thursday', 'cheeseburger', 'uncrustable', 'calzones', 'tacos', 'nachos', 'pbj', 'veggie'];
extras.forEach(w => dictionary.add(w));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { words } = req.body;
    if (!words || !Array.isArray(words)) {
      return res.status(400).json({ error: 'words array is required' });
    }

    // clean the tokens, filter out tiny noise (1-2 chars)
    const uniqueTokens = [...new Set(
      words
        .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
        .filter(w => w.length > 2)
    )];

    const validWords = [];
    const fakeWords = [];

    uniqueTokens.forEach(word => {
      if (dictionary.has(word)) {
        validWords.push(word);
      } else {
        fakeWords.push(word);
      }
    });

    return res.status(200).json({
      totalChecked: uniqueTokens.length,
      realWordCount: validWords.length,
      validWords,
      fakeWords
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
