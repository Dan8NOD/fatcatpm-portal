export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin*', '/portal*', '/statement*'] },
      // ponytail: explicitly allow AI crawlers — AEO is the point
      { userAgent: ['GPTBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended'], allow: '/' },
    ],
    sitemap: 'https://portal-fatcatpm.vercel.app/sitemap.xml',
  };
}
