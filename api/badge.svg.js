// api/badge.svg.js
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'image/svg+xml');
  const { username, show_username = 'false', theme = 'dark', border } = req.query;

  // Базовый URL (без /public!)
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

  // Все темы в одном месте
  const themes = {
    // Градиенты (как было)
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

    // Фото-темы (с правильными путями)
    coal: {
      type: 'image',
      image: `${baseUrl}/images/coal.jpg`,  // <-- без public!
      text: '#ffffff',
      muted: '#cccccc',
      divider: 'rgba(255,255,255,0.3)',
      footer: 'rgba(255,255,255,0.7)',
      borderColor: '#ffffff'
    },
    land: {
      type: 'image',
      image: `${baseUrl}/images/land.jpg`,
      text: '#ffffff',
      muted: '#cccccc',
      divider: 'rgba(255,255,255,0.3)',
      footer: 'rgba(255,255,255,0.7)',
      borderColor: '#ffffff'
    },
    matrix: {
      type: 'image',
      image: `${baseUrl}/images/matrix.jpg`,
      text: '#00ff00',
      muted: '#00aa00',
      divider: 'rgba(0,255,0,0.3)',
      footer: '#00ff00',
      borderColor: '#00ff00'
    },
    ocean: {
      type: 'image',
      image: `${baseUrl}/images/ocean.jpg`,
      text: '#ffffff',
      muted: '#cccccc',
      divider: 'rgba(255,255,255,0.3)',
      footer: 'rgba(255,255,255,0.7)',
      borderColor: '#ffffff'
    },
    purple: {
      type: 'image',
      image: `${baseUrl}/images/purple.jpg`,
      text: '#ffffff',
      muted: '#e0b0ff',
      divider: 'rgba(255,255,255,0.3)',
      footer: '#c08aff',
      borderColor: '#ffffff'
    },
    space: {
      type: 'image',
      image: `${baseUrl}/images/space_m.jpg`,
      text: '#ffffff',
      muted: '#aaaaff',
      divider: 'rgba(255,255,255,0.3)',
      footer: '#8888dd',
      borderColor: '#aaaaff'
    },
    storm: {
      type: 'image',
      image: `${baseUrl}/images/storm.jpg`,
      text: '#ffffff',
      muted: '#bbccdd',
      divider: 'rgba(255,255,255,0.3)',
      footer: '#99aabb',
      borderColor: '#ffffff'
    },
    sunset_r: {
      type: 'image',
      image: `${baseUrl}/images/sunset_r.jpg`,
      text: '#ffffff',
      muted: '#ffbbbb',
      divider: 'rgba(255,255,255,0.3)',
      footer: '#ff9999',
      borderColor: '#ffffff'
    },
    sunset_y: {
      type: 'image',
      image: `${baseUrl}/images/sunset_y.jpg`,
      text: '#000000',
      muted: '#664d26',
      divider: 'rgba(0,0,0,0.2)',
      footer: '#8c6b36',
      borderColor: '#000000'
    },
    trees: {
      type: 'image',
      image: `${baseUrl}/images/trees.jpg`,
      text: '#ffffff',
      muted: '#cccccc',
      divider: 'rgba(255,255,255,0.3)',
      footer: 'rgba(255,255,255,0.7)',
      borderColor: '#ffffff'
    }
  };

  // Выбираем тему
  const currentTheme = themes[theme] || themes.dark;
  
  // Обработка border (как в твоём коде)
  let borderColor = currentTheme.borderColor;
  let borderWidth = 0;
  if (border !== undefined) {
    borderWidth = 2;
    if (border && border !== 'true' && border !== 'false') {
      borderColor = border.startsWith('#') ? border : `#${border}`;
    }
  }

  if (!username) {
    return res.send(`<svg>...</svg>`); // твой код для ошибки
  }

  try {
    // GitHub API запросы (как в твоём коде)
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) throw new Error(`User "${username}" not found`);
    const user = await userRes.json();
    
    const reposRes = await fetch(user.repos_url);
    const reposData = await reposRes.json();
    const totalStars = reposData.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    
    // Форматирование чисел
    const formatNumber = (num) => {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
    };

    const repos = formatNumber(user.public_repos);
    const stars = formatNumber(totalStars);
    const followers = formatNumber(user.followers);
    
    const dateStr = new Date().toISOString().split('T')[0];
    const showUsername = show_username.toLowerCase() === 'true';
    const usernameYOffset = showUsername ? 25 : 0;
    const totalHeight = showUsername ? 155 : 145;
    
    // Генерация фона
    let background = '';
    if (currentTheme.type === 'gradient') {
      background = `
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${currentTheme.gradient[0]}"/>
            <stop offset="50%" stop-color="${currentTheme.gradient[1]}"/>
            <stop offset="100%" stop-color="${currentTheme.gradient[2]}"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="446" height="${totalHeight-4}" fill="url(#bg)" rx="20" 
              stroke="${borderColor}" stroke-width="${borderWidth*2}"/>
      `;
    } else {
      background = `
        <defs>
          <pattern id="bg" patternUnits="userSpaceOnUse" width="450" height="${totalHeight}">
            <image href="${currentTheme.image}" x="0" y="0" width="450" height="${totalHeight}" preserveAspectRatio="xMidYMid slice"/>
          </pattern>
        </defs>
        <rect x="2" y="2" width="446" height="${totalHeight-4}" fill="url(#bg)" rx="20" 
              stroke="${borderColor}" stroke-width="${borderWidth*2}"/>
        <rect x="2" y="2" width="446" height="${totalHeight-4}" fill="rgba(0,0,0,0.4)" rx="20" stroke="none"/>
      `;
    }

    // Собираем SVG
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="450" height="${totalHeight}" viewBox="0 0 450 ${totalHeight}">
        ${background}
        
        ${showUsername ? `
          <text x="225" y="30" font-family="Arial, sans-serif" font-size="16" 
                fill="${currentTheme.text}" text-anchor="middle" font-weight="600">
            ${user.name || username}
          </text>
        ` : ''}
        
        <!-- Repos -->
        <g transform="translate(75, ${60 + usernameYOffset})">
          <text x="0" y="-25" fill="${currentTheme.muted}" text-anchor="middle" font-size="14" font-weight="500">📦 Repos</text>
          <text x="0" y="25" fill="${currentTheme.text}" text-anchor="middle" font-size="42" font-weight="bold">${repos}</text>
        </g>
        
        <line x1="150" y1="${40 + usernameYOffset}" x2="150" y2="${105 + usernameYOffset}" 
              stroke="${currentTheme.divider}" stroke-width="2"/>
        
        <!-- Stars -->
        <g transform="translate(225, ${60 + usernameYOffset})">
          <text x="0" y="-25" fill="${currentTheme.muted}" text-anchor="middle" font-size="14" font-weight="500">⭐ Stars</text>
          <text x="0" y="25" fill="${currentTheme.text}" text-anchor="middle" font-size="42" font-weight="bold">${stars}</text>
        </g>
        
        <line x1="300" y1="${40 + usernameYOffset}" x2="300" y2="${105 + usernameYOffset}" 
              stroke="${currentTheme.divider}" stroke-width="2"/>
        
        <!-- Followers -->
        <g transform="translate(375, ${60 + usernameYOffset})">
          <text x="0" y="-25" fill="${currentTheme.muted}" text-anchor="middle" font-size="14" font-weight="500">👥 Followers</text>
          <text x="0" y="25" fill="${currentTheme.text}" text-anchor="middle" font-size="42" font-weight="bold">${followers}</text>
        </g>
        
        <!-- Footer -->
        <text x="20" y="${120 + usernameYOffset}" fill="${currentTheme.footer}" font-size="10" font-weight="400">Powered by Xlebovoz</text>
        <text x="430" y="${120 + usernameYOffset}" fill="${currentTheme.footer}" font-size="10" text-anchor="end" font-weight="400">${dateStr}</text>
      </svg>
    `;

    res.setHeader('Cache-Control', 'public, max-age=21600');
    res.send(svg);

  } catch (error) {
    // Твой код для ошибки
    res.send(`<svg>...</svg>`);
  }
}