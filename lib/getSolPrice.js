// lib/getSolPrice.js
let cachedPrice = null;
let lastFetchTime = 0;
const CACHE_DURATION = 15 * 1000; // 15 seconds

export const fetchSolPrice = async () => {
  const now = Date.now();
  console.log(`fetchSolPrice: Checking cache at ${new Date(now).toISOString()}`);
  if (cachedPrice && now - lastFetchTime < CACHE_DURATION) {
    console.log(`fetchSolPrice: Using cached price ${cachedPrice}`);
    return cachedPrice;
  }

  try {
    console.log('fetchSolPrice: Fetching new price from CoinGecko');
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd', {
      headers: { 'accept': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    cachedPrice = data.solana.usd;
    lastFetchTime = now;
    console.log(`fetchSolPrice: Fetched price ${cachedPrice}`);
    return cachedPrice;
  } catch (error) {
    console.error('fetchSolPrice: Error fetching SOL price:', error);
    return cachedPrice || 200; // Fallback
  }
};