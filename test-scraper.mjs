// Test script for Zillow scraping approaches
const zpid = '463056516';

async function test() {
  console.log('=== Testing different Zillow scraping approaches ===\n');

  // Approach 1: Mobile UA
  try {
    const r1 = await fetch(`https://www.zillow.com/homedetails/${zpid}_zpid/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
      },
      signal: AbortSignal.timeout(10000)
    });
    const html1 = await r1.text();
    console.log('[Mobile UA] Status:', r1.status, '| Photos:', (html1.match(/photos\.zillowstatic\.com/g)||[]).length, '| NextData:', html1.includes('__NEXT_DATA__'));
  } catch(e) { console.log('[Mobile UA] Error:', e.message); }

  // Approach 2: Zillow GraphQL API (undocumented)
  try {
    const r2 = await fetch('https://www.zillow.com/graphql/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Referer': `https://www.zillow.com/homedetails/${zpid}_zpid/`,
        'Origin': 'https://www.zillow.com',
      },
      body: JSON.stringify({
        operationName: 'getPhotos',
        variables: { zpid: parseInt(zpid) },
        query: 'query getPhotos($zpid: ID!) { property(zpid: $zpid) { photos { mixedSources { jpeg { url width height } } } } }'
      }),
      signal: AbortSignal.timeout(10000)
    });
    const j2 = await r2.text();
    console.log('[GraphQL] Status:', r2.status, '| Response preview:', j2.substring(0, 200));
  } catch(e) { console.log('[GraphQL] Error:', e.message); }

  // Approach 3: Zillow's public listing API
  try {
    const r3 = await fetch(`https://www.zillow.com/homedetails/${zpid}_zpid/`, {
      headers: {
        'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(10000)
    });
    const html3 = await r3.text();
    console.log('[Googlebot UA] Status:', r3.status, '| Photos:', (html3.match(/photos\.zillowstatic\.com/g)||[]).length);
  } catch(e) { console.log('[Googlebot UA] Error:', e.message); }

  // Approach 4: ScraperAPI free tier
  try {
    const r4 = await fetch(`http://api.scraperapi.com?api_key=DEMO&url=${encodeURIComponent('https://www.zillow.com/homedetails/577-Carnaval-Creek-Dr-Blacklick-OH-43004/463056516_zpid/')}`, {
      signal: AbortSignal.timeout(15000)
    });
    const html4 = await r4.text();
    console.log('[ScraperAPI demo] Status:', r4.status, '| Photos:', (html4.match(/photos\.zillowstatic\.com/g)||[]).length);
  } catch(e) { console.log('[ScraperAPI demo] Error:', e.message); }
}

test().catch(console.error);
