import { ProductSignalsResult } from '../types';

/**
 * Check a URL for product signals using HTML heuristics
 * Fast and free - no external API calls
 */
export async function checkHeuristics(url: string): Promise<ProductSignalsResult> {
  let html = '';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PatternRadar/1.0)',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return {
        method: 'heuristics',
        isProduct: false,
        confidence: 'high',
        signals: [],
        redFlags: [`HTTP ${response.status}`],
      };
    }

    html = await response.text();
  } catch (error) {
    return {
      method: 'heuristics',
      isProduct: null,
      confidence: 'low',
      signals: [],
      redFlags: ['fetch failed'],
    };
  }

  const signals: string[] = [];
  const redFlags: string[] = [];

  // Positive signals - indicators of a real product
  if (/\/pricing|\/plans|\/upgrade/i.test(html)) {
    signals.push('has pricing page');
  }
  if (/\/signup|\/register|\/get-started|\/start/i.test(html)) {
    signals.push('has signup flow');
  }
  if (/app\..*\.com|dashboard\.|portal\./i.test(html)) {
    signals.push('has app subdomain');
  }
  if (/apps\.apple\.com|play\.google\.com|chrome\.google\.com/i.test(html)) {
    signals.push('app store links');
  }
  if (/\$\d+.*\/(mo|month|yr|year)|per (month|user|seat)/i.test(html)) {
    signals.push('pricing visible');
  }
  if (/book a demo|schedule demo|request demo/i.test(html)) {
    signals.push('has demo booking');
  }
  if (/customers include|trusted by|used by/i.test(html)) {
    signals.push('shows customer logos');
  }

  // Red flags - indicators of dead/fake project
  if (/coming soon|under construction|launching soon/i.test(html)) {
    redFlags.push('coming soon page');
  }
  if (/parked|domain for sale|buy this domain/i.test(html)) {
    redFlags.push('parked domain');
  }
  if (html.length < 1000) {
    redFlags.push('minimal content');
  }
  if (/404|not found|page doesn.*exist/i.test(html)) {
    redFlags.push('404 content');
  }
  if (/vercel|netlify|heroku.*404|deployment.*failed/i.test(html)) {
    redFlags.push('failed deployment');
  }

  // Determine product status
  let isProduct: boolean | null;
  let confidence: 'high' | 'medium' | 'low';

  if (redFlags.length >= 1 && signals.length === 0) {
    isProduct = false;
    confidence = 'high';
  } else if (signals.length >= 3) {
    isProduct = true;
    confidence = 'high';
  } else if (signals.length >= 2) {
    isProduct = true;
    confidence = 'medium';
  } else if (signals.length >= 1) {
    isProduct = null; // inconclusive
    confidence = 'low';
  } else {
    isProduct = null;
    confidence = 'low';
  }

  return { method: 'heuristics', isProduct, confidence, signals, redFlags };
}
