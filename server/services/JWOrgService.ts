import { SearchResult } from './types.js';

// Curated verified JW.ORG article database for instant grounding and guaranteed real URLs
const VERIFIED_JW_ARTICLES: SearchResult[] = [
  {
    id: 'jw-suffering-1',
    title: 'What Does the Bible Say About Suffering?',
    snippet: 'Why is there so much suffering in the world? Is God responsible for our pain, or does he care about us? Find comforting answers from the Bible.',
    url: 'https://www.jw.org/en/library/series/more-topics/what-does-bible-say-about-suffering/',
    source: 'JW.ORG',
    publication: 'Bible Teachings & Answers',
    bibleVerses: ['Revelation 21:4', 'James 1:13', '1 John 5:19'],
    topicKeywords: ['suffering', 'pain', 'suffer', 'hardship', 'tragedy', 'why god allows', 'grief'],
  },
  {
    id: 'jw-suffering-2',
    title: 'Why Does God Allow Suffering?',
    snippet: 'The Bible reveals that God is not the cause of human suffering. Discover three main reasons why suffering exists today and how God will end it.',
    url: 'https://www.jw.org/en/bible-teachings/questions/why-god-allows-suffering/',
    source: 'JW.ORG',
    publication: 'Bible Questions Answered',
    bibleVerses: ['Ecclesiastes 9:11', '1 John 5:19', '2 Peter 3:9'],
    topicKeywords: ['suffering', 'allows', 'why', 'evil', 'bad things', 'pain'],
  },
  {
    id: 'jw-kingdom-1',
    title: 'What Is God’s Kingdom?',
    snippet: 'God’s Kingdom is a real government established by God in heaven. Jesus Christ is its King, and it will soon rule over all the earth with peace and righteousness.',
    url: 'https://www.jw.org/en/bible-teachings/questions/what-is-gods-kingdom/',
    source: 'JW.ORG',
    publication: 'Bible Questions Answered',
    bibleVerses: ['Daniel 2:44', 'Matthew 6:9, 10', 'Isaiah 9:6, 7'],
    topicKeywords: ['kingdom', 'gods kingdom', 'government', 'paradise', 'rule', 'jesus king'],
  },
  {
    id: 'jw-hope-1',
    title: 'Real Hope for a Better Tomorrow',
    snippet: 'Where can we find reliable hope when facing life’s challenges? The Bible offers a guaranteed promise of a world free from sickness, war, and death.',
    url: 'https://www.jw.org/en/library/magazines/watchtower-no2-2021-may-jun/',
    source: 'JW.ORG',
    publication: 'The Watchtower No. 2 2021',
    bibleVerses: ['Jeremiah 29:11', 'Romans 15:13', 'Psalm 37:11'],
    topicKeywords: ['hope', 'future', 'encouragement', 'better world', 'promises'],
  },
  {
    id: 'jw-resurrection-1',
    title: 'What Is the Resurrection?',
    snippet: 'The Bible teaches that billions who have died will be brought back to life on a paradise earth. Learn who will be resurrected and when.',
    url: 'https://www.jw.org/en/bible-teachings/questions/what-is-the-resurrection/',
    source: 'JW.ORG',
    publication: 'Bible Questions Answered',
    bibleVerses: ['John 5:28, 29', 'Acts 24:15', 'John 11:25'],
    topicKeywords: ['resurrection', 'death', 'dead', 'life after death', 'mourning'],
  },
  {
    id: 'jw-prayer-1',
    title: 'How to Pray and Be Heard by God',
    snippet: 'Does God answer all prayers? How should we pray, and what can we pray for? Practical Bible guidelines on acceptable prayer.',
    url: 'https://www.jw.org/en/bible-teachings/questions/how-to-pray/',
    source: 'JW.ORG',
    publication: 'Bible Questions Answered',
    bibleVerses: ['Psalm 65:2', '1 John 5:14', 'Philippians 4:6, 7'],
    topicKeywords: ['pray', 'prayer', 'prayers', 'god answer', 'how to pray'],
  },
  {
    id: 'jw-bible-1',
    title: 'Can You Trust the Bible?',
    snippet: 'Is the Bible scientifically accurate, historically reliable, and internally harmonious? Discover compelling evidence for trusting God’s Word.',
    url: 'https://www.jw.org/en/bible-teachings/questions/can-you-trust-the-bible/',
    source: 'JW.ORG',
    publication: 'Bible Questions Answered',
    bibleVerses: ['2 Timothy 3:16, 17', '2 Peter 1:21'],
    topicKeywords: ['bible', 'trust', 'gods word', 'truth', 'accuracy'],
  },
  {
    id: 'jw-family-1',
    title: 'Keys to Family Happiness',
    snippet: 'Practical Bible advice for husbands, wives, parents, and children to build strong, loving, and united families.',
    url: 'https://www.jw.org/en/library/books/family-happiness/',
    source: 'JW.ORG',
    publication: 'The Secret of Family Happiness',
    bibleVerses: ['Ephesians 5:28, 33', 'Colossians 3:12-14'],
    topicKeywords: ['family', 'marriage', 'parenting', 'children', 'husband', 'wife'],
  },
  {
    id: 'jw-anxiety-1',
    title: 'How Can You Manage Stress and Anxiety?',
    snippet: 'Learn practical steps and soothing Scriptural principles to cope with overwhelming anxiety, worry, and emotional stress.',
    url: 'https://www.jw.org/en/library/magazines/awake-no1-2020-mar-apr/',
    source: 'JW.ORG',
    publication: 'Awake! No. 1 2020',
    bibleVerses: ['1 Peter 5:7', 'Psalm 55:22', 'Philippians 4:6, 7'],
    topicKeywords: ['stress', 'anxiety', 'worry', 'mental health', 'peace of mind'],
  },
  {
    id: 'jw-creation-1',
    title: 'Was Life Created?',
    snippet: 'Examine scientific facts and biblical reasoning regarding the origin of life and the evidence for intelligent design.',
    url: 'https://www.jw.org/en/library/books/was-life-created/',
    source: 'JW.ORG',
    publication: 'Was Life Created?',
    bibleVerses: ['Genesis 1:1', 'Psalm 104:24', 'Hebrews 3:4'],
    topicKeywords: ['creation', 'created', 'god created', 'creator', 'evolution', 'design'],
  },
];

export class JWOrgService {
  /**
   * Search JW.ORG for real articles matching the user's query topic
   */
  static async searchJWOrg(query: string, language: string = 'en'): Promise<SearchResult[]> {
    const cleanQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // 1. Try Live JW.ORG JSON Search API endpoint first
    try {
      const searchUrl = `https://www.jw.org/en/search/results/json?q=${encodeURIComponent(query)}&wtlocale=E`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) MinistryTrackerApp/1.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.results)) {
          for (let i = 0; i < Math.min(4, data.results.length); i++) {
            const item = data.results[i];
            if (item.title && item.url) {
              const fullUrl = item.url.startsWith('http')
                ? item.url
                : `https://www.jw.org${item.url}`;
              results.push({
                id: `jw-live-${i}-${Date.now()}`,
                title: item.title.replace(/<[^>]+>/g, ''),
                snippet: (item.snippet || item.caption || 'Official JW.ORG article').replace(/<[^>]+>/g, ''),
                url: fullUrl,
                source: 'JW.ORG',
                publication: item.pubName || 'JW.ORG Publication',
              });
            }
          }
        }
      }
    } catch {
      // Live search timeout or blocked; fallback to verified curated collection
    }

    // 2. Local curated search matching keywords
    const queryWords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
    const matchedCurated = VERIFIED_JW_ARTICLES.filter(article => {
      const titleMatch = article.title.toLowerCase().includes(cleanQuery);
      const keywordMatch = article.topicKeywords?.some(k => cleanQuery.includes(k) || k.includes(cleanQuery));
      const wordMatch = queryWords.some(word =>
        article.title.toLowerCase().includes(word) ||
        article.snippet.toLowerCase().includes(word) ||
        article.topicKeywords?.some(k => k.includes(word))
      );
      return titleMatch || keywordMatch || wordMatch;
    });

    // Merge and deduplicate by URL
    const existingUrls = new Set(results.map(r => r.url));
    for (const curated of matchedCurated) {
      if (!existingUrls.has(curated.url)) {
        results.push(curated);
        existingUrls.add(curated.url);
      }
    }

    return results.slice(0, 5);
  }
}
