const COMMON_MISSPELLINGS = {
  recieve: 'receive',
  occured: 'occurred',
  seperate: 'separate',
  definately: 'definitely',
  enviroment: 'environment',
  goverment: 'government',
  occured: 'occurred',
  untill: 'until',
  wich: 'which',
  becuase: 'because',
  freind: 'friend',
  thier: 'their',
  alot: 'a lot',
  begining: 'beginning',
  writting: 'writing',
};

const WEAK_PHRASES = [
  { pattern: /\bvery good\b/gi, suggestion: 'excellent or outstanding' },
  { pattern: /\bvery bad\b/gi, suggestion: 'terrible or awful' },
  { pattern: /\ba lot of\b/gi, suggestion: 'many or numerous' },
  { pattern: /\bkind of\b/gi, suggestion: 'somewhat or rather' },
  { pattern: /\bsort of\b/gi, suggestion: 'somewhat' },
  { pattern: /\bI think that\b/gi, suggestion: 'I believe' },
  { pattern: /\bin my opinion\b/gi, suggestion: 'consider' },
  { pattern: /\bthings\b/gi, suggestion: 'specific nouns (items, events, aspects)' },
];

const stripHtml = (html) =>
  (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getSentences = (text) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

const getWords = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

const levelFromScore = (score) => {
  if (score >= 85) return 'Advanced';
  if (score >= 72) return 'Upper Intermediate';
  if (score >= 58) return 'Intermediate';
  if (score >= 42) return 'Elementary';
  return 'Beginner';
};

const analyzeGrammar = (text, words) => {
  const mistakes = [];
  let score = 100;

  words.forEach((word, i) => {
    const clean = word.replace(/[^a-z]/g, '');
    if (COMMON_MISSPELLINGS[clean]) {
      mistakes.push({
        type: 'spelling',
        text: word,
        suggestion: COMMON_MISSPELLINGS[clean],
        position: i,
      });
      score -= 8;
    }
  });

  const sentences = getSentences(text);
  sentences.forEach((sentence) => {
    if (sentence.length > 5 && /^[a-z]/.test(sentence)) {
      mistakes.push({
        type: 'grammar',
        text: sentence.slice(0, 40) + (sentence.length > 40 ? '...' : ''),
        suggestion: 'Start sentence with a capital letter',
      });
      score -= 5;
    }
    if (!/[.!?]$/.test(sentence) && sentence.split(/\s+/).length > 8) {
      mistakes.push({
        type: 'grammar',
        text: sentence.slice(0, 40) + '...',
        suggestion: 'End the sentence with proper punctuation',
      });
      score -= 4;
    }
  });

  if (/\s{2,}/.test(text)) {
    mistakes.push({ type: 'grammar', text: 'Double spaces', suggestion: 'Use single spaces between words' });
    score -= 3;
  }

  return { score: Math.max(0, Math.min(100, score)), mistakes: mistakes.slice(0, 12) };
};

const analyzeVocabulary = (words) => {
  if (words.length === 0) return { score: 0, suggestions: [] };

  const unique = new Set(words);
  const diversity = unique.size / words.length;
  const avgLength = words.reduce((s, w) => s + w.length, 0) / words.length;
  const longWords = words.filter((w) => w.length >= 7).length;
  const longRatio = longWords / words.length;

  let score = 40 + diversity * 35 + Math.min(avgLength * 4, 20) + longRatio * 15;
  score = Math.round(Math.max(0, Math.min(100, score)));

  const freq = {};
  words.forEach((w) => {
    freq[w] = (freq[w] || 0) + 1;
  });
  const repetitive = Object.entries(freq)
    .filter(([w, c]) => c >= 4 && w.length > 3)
    .map(([w]) => w);

  const suggestions = [];
  if (diversity < 0.45) suggestions.push('Try using more varied vocabulary instead of repeating the same words.');
  if (avgLength < 4) suggestions.push('Use more descriptive words to express your ideas clearly.');
  if (repetitive.length) suggestions.push(`Consider synonyms for: ${repetitive.slice(0, 5).join(', ')}`);

  return { score, suggestions, uniqueWords: unique.size, repetitive };
};

const analyzeSentences = (text) => {
  const sentences = getSentences(text);
  if (sentences.length === 0) return { score: 0, weakSentences: [] };

  const lengths = sentences.map((s) => s.split(/\s+/).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const weakSentences = [];
  let score = 75;

  sentences.forEach((sentence) => {
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount > 35) {
      weakSentences.push({
        original: sentence.slice(0, 120) + (sentence.length > 120 ? '...' : ''),
        improved: 'Break this into two or three shorter sentences for clarity.',
      });
      score -= 8;
    } else if (wordCount < 4 && wordCount > 0) {
      weakSentences.push({
        original: sentence,
        improved: 'Expand this idea with more detail or combine it with a related sentence.',
      });
      score -= 4;
    }
  });

  if (avgLen >= 12 && avgLen <= 22) score += 10;
  if (sentences.length >= 3) score += 5;

  WEAK_PHRASES.forEach(({ pattern, suggestion }) => {
    if (pattern.test(text)) {
      weakSentences.push({ original: text.match(pattern)?.[0] || '', improved: `Try: ${suggestion}` });
      score -= 3;
    }
  });

  return { score: Math.max(0, Math.min(100, score)), weakSentences: weakSentences.slice(0, 8), avgLen };
};

const analyzeReadability = (text, words, sentences) => {
  if (words.length === 0 || sentences.length === 0) return { score: 0 };

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllables = words.reduce((s, w) => s + Math.max(1, Math.ceil(w.length / 3)), 0) / words.length;
  const flesch = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * (avgSyllables / 3);
  const score = Math.round(Math.max(0, Math.min(100, (flesch + 30) / 1.3)));

  return { score, avgWordsPerSentence };
};

const analyzeFluency = (text, grammarScore, vocabScore) => {
  const transitionWords = ['however', 'therefore', 'moreover', 'although', 'because', 'finally', 'additionally', 'meanwhile', 'instead', 'although'];
  const lower = text.toLowerCase();
  const transitions = transitionWords.filter((t) => lower.includes(t)).length;
  let score = Math.round((grammarScore * 0.4 + vocabScore * 0.35 + Math.min(transitions * 8, 25)));
  score = Math.max(0, Math.min(100, score + 10));
  return { score, transitions };
};

const buildImprovedVersion = (text, mistakes, weakSentences) => {
  let improved = text;
  mistakes
    .filter((m) => m.type === 'spelling')
    .forEach((m) => {
      const regex = new RegExp(`\\b${m.text}\\b`, 'gi');
      improved = improved.replace(regex, m.suggestion);
    });
  if (improved.length > 0 && /^[a-z]/.test(improved)) {
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  }
  if (weakSentences.length > 0 && !/[.!?]$/.test(improved.trim())) {
    improved = improved.trim() + '.';
  }
  return improved;
};

const generateCoachFeedback = (analysis) => {
  const tips = [];
  const goals = [];
  const wordsToLearn = ['articulate', 'coherent', 'concise', 'elaborate', 'perspective'].slice(0, 5);

  if (analysis.scores.grammar < 70) {
    tips.push('Review punctuation and sentence capitalization.');
    goals.push('Write three sentences without grammar mistakes tomorrow.');
  }
  if (analysis.scores.vocabulary < 65) {
    tips.push('Use synonyms to avoid repeating the same words.');
    goals.push('Learn and use 3 new words in your next entry.');
  }
  if (analysis.scores.sentenceStructure < 65) {
    tips.push('Focus on sentence variety — mix short and medium-length sentences.');
    goals.push('Include at least one compound sentence in your next journal.');
  }
  if (analysis.scores.readability < 60) {
    tips.push('Break long sentences into shorter, clearer ones.');
  }
  if (analysis.scores.communication < 65) {
    tips.push('State your main idea early, then support it with details.');
  }

  if (tips.length === 0) {
    tips.push('Great work! Keep writing regularly to maintain your level.');
    goals.push('Challenge yourself with a longer entry this week.');
  }

  const feedback = `Your English level is ${analysis.level}. ${
    analysis.scores.overall >= 70
      ? 'Your writing shows good clarity and structure.'
      : 'Keep practicing — consistent writing will improve your fluency quickly.'
  }`;

  return { feedback, tips, goals, wordsToLearn };
};

const analyzeEnglish = (rawContent) => {
  const text = stripHtml(rawContent);
  const words = getWords(text);
  const sentences = getSentences(text);
  const wordCount = words.length;

  if (wordCount < 5) {
    return {
      level: 'Beginner',
      wordCount,
      scores: {
        overall: 30,
        grammar: 30,
        vocabulary: 30,
        writing: 30,
        communication: 30,
        readability: 30,
        fluency: 30,
        sentenceStructure: 30,
      },
      mistakes: [],
      weakSentences: [],
      vocabularySuggestions: ['Write at least a few sentences to get a meaningful analysis.'],
      improvedVersion: text,
      correctedVersion: text,
      coach: {
        feedback: 'Your entry is too short for a full analysis. Try writing at least 50 words.',
        tips: ['Expand on your thoughts with specific details.'],
        goals: ['Write a journal entry of at least 100 words.'],
        wordsToLearn: ['describe', 'explain', 'reflect', 'express', 'develop'],
      },
    };
  }

  const grammar = analyzeGrammar(text, words);
  const vocabulary = analyzeVocabulary(words);
  const sentencesAnalysis = analyzeSentences(text);
  const readability = analyzeReadability(text, words, sentences);
  const fluency = analyzeFluency(text, grammar.score, vocabulary.score);

  const communication = Math.round(
    grammar.score * 0.25 + vocabulary.score * 0.25 + sentencesAnalysis.score * 0.25 + readability.score * 0.25
  );

  const writing = Math.round((grammar.score + sentencesAnalysis.score + readability.score) / 3);

  const overall = Math.round(
    grammar.score * 0.2 +
      vocabulary.score * 0.15 +
      fluency.score * 0.15 +
      sentencesAnalysis.score * 0.15 +
      readability.score * 0.15 +
      communication * 0.2
  );

  const level = levelFromScore(overall);
  const improvedVersion = buildImprovedVersion(text, grammar.mistakes, sentencesAnalysis.weakSentences);
  const correctedVersion = improvedVersion;

  const analysis = {
    level,
    wordCount,
    scores: {
      overall,
      grammar: grammar.score,
      vocabulary: vocabulary.score,
      writing,
      communication,
      readability: readability.score,
      fluency: fluency.score,
      sentenceStructure: sentencesAnalysis.score,
    },
    mistakes: grammar.mistakes,
    weakSentences: sentencesAnalysis.weakSentences,
    vocabularySuggestions: vocabulary.suggestions,
    improvedVersion,
    correctedVersion,
  };

  analysis.coach = generateCoachFeedback(analysis);

  return analysis;
};

module.exports = { analyzeEnglish, stripHtml };
