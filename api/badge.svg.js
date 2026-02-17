// api/badge.svg.js
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'image/svg+xml');
  const { username, show_username = 'false', theme = 'dark', border } = req.query;
  
  // Просто темы с путями к фото (которые лежат в public)
  const themes = {
    // Градиентные темы
    dark: {
      type: 'gradient',
      gradient: ['#0d1117', '#161b22', '#0d1117'],
      text: '#f0f6fc',
      muted: '#8b949e',
      divider: '#30363d',
      footer: '#6e7681',
      borderColor: '#58a6ff'
    },
    light: {
      type: 'gradient',
      gradient: ['#f6f8fa', '#ffffff', '#f6f8fa'],
      text: '#24292f',
      muted: '#57606a',
      divider: '#d0d7de',
      footer: '#8b949e',
      borderColor: '#0969da'
    },
    github: {
      type: 'gradient',
      gradient: ['#24292e', '#2f363d', '#24292e'],
      text: '#ffffff',
      muted: '#959da5',
      divider: '#444d56',
      footer: '#8b949e',
      borderColor: '#2fbb4f'
    },
    
    // Фото темы (просто путь до хуйни)
    coal: { type: 'image', path: '/coal.jpg' },
    land: { type: 'image', path: '/land.jpg' },
    matrix: { type: 'image', path: '/matrix.jpg' },
    ocean: { type: 'image', path: '/ocean.jpg' },
    purple: { type: 'image', path: '/purple.jpg' },
    space: { type: 'image', path: '/space_m.jpg' },
    storm: { type: 'image', path: '/storm.jpg' },
    sunset_r: { type: 'image', path: '/sunset_r.jpg' },
    sunset_y: { type: 'image', path: '/sunset_y.jpg' },
    trees: { type: 'image', path: '/trees.jpg' }
  };

  // Берем тему или dark по умолчанию
  const currentTheme = themes[theme] || themes.dark;
  
  // Обводка
  let borderColor = '#58a6ff';
  let borderWidth = 0;
  if (border) {
    borderWidth = 2;
    borderColor = border.startsWith('#') ? border : `#${border}`;
  }
  
  if (!username) {
    return res.send(`<svg width="300" height="80"><rect width="300" height="80" fill="#f6f8fa" rx="12"/><text x="150" y="35" text-anchor="middle">хуй</text></svg>`);
  }
  
  try {
    // Дергаем гитхаб
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) throw new Error('нет такого');
    const user = await userRes.json();
    
    // Звезды
    const reposRes = await fetch(user.repos_url);
    const repos = await reposRes.json();
    const stars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    
    // Формат чисел
    const format = (num) => num > 999 ? (num/1000).toFixed(1) + 'k' : num;
    
    const showName = show_username === 'true';
    const height = showName ? 155 : 145;
    
    // Базовый URL (где лежат фото)
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    // Творим SVG
    const svg = `
    <svg width="450" height="${height}" viewBox="0 0 450 ${height}" xmlns="http://www.w3.org/2000/svg">
      ${currentTheme.type === 'gradient' ? `
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${currentTheme.gradient[0]}"/>
            <stop offset="50%" stop-color="${currentTheme.gradient[1]}"/>
            <stop offset="100%" stop-color="${currentTheme.gradient[2]}"/>
          </linearGradient>
        </defs>
        <rect width="450" height="${height}" fill="url(#bg)" rx="20"/>
      ` : `
        <rect width="450" height="${height}" fill="url(#bg-img)" rx="20"/>
        <defs>
          <pattern id="bg-img" patternUnits="userSpaceOnUse" width="450" height="${height}">
            <image href="${baseUrl}${currentTheme.path}" width="450" height="${height}" preserveAspectRatio="xMidYMid cover"/>
          </pattern>
        </defs>
        <rect width="450" height="${height}" fill="rgba(0,0,0,0.4)" rx="20"/>
      `}
      
      ${showName ? `<text x="225" y="30" fill="white" text-anchor="middle" font-size="16" font-weight="bold">${user.name || username}</text>` : ''}
      
      <!-- Repos -->
      <text x="75" y="${70 + (showName ? 25 : 0)}" fill="white" text-anchor="middle" font-size="14" opacity="0.8">📦 Repos</text>
      <text x="75" y="${105 + (showName ? 25 : 0)}" fill="white" text-anchor="middle" font-size="42" font-weight="bold">${format(user.public_repos)}</text>
      
      <!-- Stars -->
      <text x="225" y="${70 + (showName ? 25 : 0)}" fill="white" text-anchor="middle" font-size="14" opacity="0.8">⭐ Stars</text>
      <text x="225" y="${105 + (showName ? 25 : 0)}" fill="white" text-anchor="middle" font-size="42" font-weight="bold">${format(stars)}</text>
      
      <!-- Followers -->
      <text x="375" y="${70 + (showName ? 25 : 0)}" fill="white" text-anchor="middle" font-size="14" opacity="0.8">👥 Followers</text>
      <text x="375" y="${105 + (showName ? 25 : 0)}" fill="white" text-anchor="middle" font-size="42" font-weight="bold">${format(user.followers)}</text>
      
      <!-- Подвал -->
      <text x="20" y="${height - 15}" fill="rgba(255,255,255,0.5)" font-size="10">Powered by Xlebovoz</text>
      <text x="430" y="${height - 15}" fill="rgba(255,255,255,0.5)" font-size="10" text-anchor="end">${new Date().toISOString().split('T')[0]}</text>
      
      ${borderWidth ? `<rect width="450" height="${height}" fill="none" stroke="${borderColor}" stroke-width="${borderWidth}" rx="20"/>` : ''}
    </svg>
    `;
    
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
    
  } catch (e) {
    res.send(`<svg width="450" height="100"><rect width="450" height="100" fill="#f85149" rx="20"/><text x="225" y="55" fill="white" text-anchor="middle">❌ нихуя не работает</text></svg>`);
  }
}