// api/badge.svg.js
const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'image/svg+xml');
  const { username, show_username = 'false', theme = 'dark', border } = req.query;
  
  const themes = {
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
    
    // Картинки (название = путь к файлу)
    space: {
      type: 'image',
      image: '/images/space.jpg',
      text: '#ffffff',
      muted: '#cccccc',
      divider: 'rgba(255,255,255,0.3)',
      footer: 'rgba(255,255,255,0.7)',
      borderColor: '#ffffff'
    },
    matrix: {
      type: 'image',
      image: '/images/matrix.jpg',
      text: '#00ff41',
      muted: '#00cc33',
      divider: '#009926',
      footer: '#006619',
      borderColor: '#00ff41'
    },
    sunset: {
      type: 'image',
      image: '/images/sunset.jpg',
      text: '#ffffff',
      muted: '#ffe6cc',
      divider: 'rgba(255,255,255,0.3)',
      footer: 'rgba(255,255,255,0.7)',
      borderColor: '#ff7b72'
    },
    ocean: {
      type: 'image',
      image: '/images/ocean.jpg',
      text: '#ffffff',
      muted: '#b3e0ff',
      divider: 'rgba(255,255,255,0.3)',
      footer: 'rgba(255,255,255,0.7)',
      borderColor: '#00a8ff'
    },
    forest: {
      type: 'image',
      image: '/images/forest.jpg',
      text: '#ffffff',
      muted: '#c1e1c1',
      divider: 'rgba(255,255,255,0.3)',
      footer: 'rgba(255,255,255,0.7)',
      borderColor: '#2ecc71'
    },
    neon: {
      type: 'image',
      image: '/images/neon.jpg',
      text: '#ffffff',
      muted: '#f0f0f0',
      divider: 'rgba(255,255,255,0.3)',
      footer: 'rgba(255,255,255,0.7)',
      borderColor: '#ff00ff'
    },
    cyber: {
      type: 'image',
      image: '/images/cyber.jpg',
      text: '#00ffff',
      muted: '#00cccc',
      divider: '#009999',
      footer: '#006666',
      borderColor: '#00ffff'
    }
  };

  // Получаем тему
  let currentTheme = themes[theme] || themes.dark;
  
  // Если тема с картинкой, загружаем и конвертируем в base64
  if (currentTheme.type === 'image') {
    try {
      const filePath = path.join(process.cwd(), 'public', currentTheme.image);
      if (fs.existsSync(filePath)) {
        const originalImage = fs.readFileSync(filePath);
        const ext = path.extname(filePath).slice(1);
        const base64Image = `data:image/${ext};base64,${originalImage.toString('base64')}`;
        currentTheme.image = base64Image;
      } else {
        // Если файл не найден, используем dark тему
        console.error(`Image not found: ${filePath}`);
        currentTheme = themes.dark;
      }
    } catch (error) {
      console.error('Error loading image:', error);
      currentTheme = themes.dark;
    }
  }
  
  // Определяем цвет обводки
  let borderColor = currentTheme.borderColor || currentTheme.text;
  let borderWidth = 0;

  // Проверяем параметр border
  if (border !== undefined) {
    borderWidth = 2;
    
    const colorMap = {
      'red': '#f85149',
      'blue': '#58a6ff',
      'green': '#2fbb4f',
      'yellow': '#f1e05a',
      'purple': '#a371f7',
      'pink': '#f778ba',
      'orange': '#ff7b72',
      'white': '#ffffff',
      'black': '#000000'
    };
    
    if (border !== '' && border !== 'true' && border !== 'false') {
      const borderLower = border.toLowerCase();
      
      if (colorMap[borderLower]) {
        borderColor = colorMap[borderLower];
      } else {
        let hex = border.startsWith('#') ? border.slice(1) : border;
        const hexPattern = /^[0-9A-F]{6}$|^[0-9A-F]{3}$/i;
        
        if (hexPattern.test(hex)) {
          borderColor = `#${hex}`;
        } else {
          borderColor = currentTheme.borderColor || currentTheme.text;
        }
      }
    }
  }
  
  if (!username) {
    return res.send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="80">
      <style>
        .container { font-family: 'Segoe UI', Arial, sans-serif; }
        .title { font-size: 18px; font-weight: 600; fill: #24292f; }
        .desc { font-size: 14px; fill: #57606a; }
      </style>
      <rect x="2" y="2" width="296" height="76" fill="#f6f8fa" rx="12" 
            stroke="${borderColor}" stroke-width="${borderWidth * 2}" stroke-linejoin="round"/>
      <text x="150" y="35" class="container title" text-anchor="middle">GitHub Badge API</text>
      <text x="150" y="55" class="container desc" text-anchor="middle">Add ?username=yourname to URL</text>
    </svg>
    `);
  }
  
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    
    if (!response.ok) {
      throw new Error(`User "${username}" not found`);
    }
    
    const user = await response.json();
    
    // all stars
    const reposResponse = await fetch(user.repos_url);
    const reposData = await reposResponse.json();
    const totalStars = reposData.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    
    // formating nums (1000 -> 1k, 1000000 -> 1M)
    function formatNumber(num) {
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'k';
      }
      return num.toString();
    }
    
    const repos = formatNumber(user.public_repos);
    const stars = formatNumber(totalStars);
    const followers = formatNumber(user.followers);
    
    // current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    // Проверяем параметр show_username
    const showUsername = show_username.toLowerCase() === 'true';
    const usernameYOffset = showUsername ? 25 : 0;
    const totalHeight = showUsername ? 155 : 145;
    
    // Генерируем фон в зависимости от типа темы
    let background = '';
    if (currentTheme.type === 'gradient') {
      background = `
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${currentTheme.gradient[0]}"/>
          <stop offset="50%" stop-color="${currentTheme.gradient[1]}"/>
          <stop offset="100%" stop-color="${currentTheme.gradient[2]}"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="446" height="${totalHeight - 4}" fill="url(#gradient)" rx="20" 
            stroke="${borderColor}" stroke-width="${borderWidth * 2}" stroke-linejoin="round"/>`;
    } else if (currentTheme.type === 'image') {
      background = `
      <defs>
        <pattern id="bg-image" patternUnits="userSpaceOnUse" width="450" height="${totalHeight}">
          <image href="${currentTheme.image.replace(/&/g, '&amp;')}" x="0" y="0" width="450" height="${totalHeight}" preserveAspectRatio="xMidYMid slice"/>
        </pattern>
      </defs>
      <rect x="2" y="2" width="446" height="${totalHeight - 4}" fill="url(#bg-image)" rx="20" 
            stroke="${borderColor}" stroke-width="${borderWidth * 2}" stroke-linejoin="round"/>
      <rect x="2" y="2" width="446" height="${totalHeight - 4}" fill="rgba(0,0,0,0.4)" rx="20" stroke="none"/>`;
    }
    
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="450" height="${totalHeight}" viewBox="0 0 450 ${totalHeight}">
      ${background}
      
      ${showUsername ? `
      <!-- Имя пользователя сверху -->
      <text x="225" y="30" font-family="Arial, sans-serif" font-size="16" 
            fill="${currentTheme.text}" text-anchor="middle" font-weight="600">
        ${user.name || username}
      </text>
      ` : ''}
      
      <!-- Левая часть: Репозитории -->
      <g transform="translate(75, ${60 + usernameYOffset})">
        <text x="0" y="-25" font-family="Arial, sans-serif" font-size="14" 
              fill="${currentTheme.muted}" text-anchor="middle" font-weight="500">📦 Repos</text>
        <text x="0" y="25" font-family="Arial, sans-serif" font-size="42" 
              fill="${currentTheme.text}" text-anchor="middle" font-weight="bold">${repos}</text>
      </g>
      
      <!-- Разделитель 1 -->
      <line x1="150" y1="${40 + usernameYOffset}" x2="150" y2="${105 + usernameYOffset}" 
            stroke="${currentTheme.divider}" stroke-width="2"/>
      
      <!-- Центральная часть: Звёзды -->
      <g transform="translate(225, ${60 + usernameYOffset})">
        <text x="0" y="-25" font-family="Arial, sans-serif" font-size="14" 
              fill="${currentTheme.muted}" text-anchor="middle" font-weight="500">⭐ Stars</text>
        <text x="0" y="25" font-family="Arial, sans-serif" font-size="42" 
              fill="${currentTheme.text}" text-anchor="middle" font-weight="bold">${stars}</text>
      </g>
      
      <!-- Разделитель 2 -->
      <line x1="300" y1="${40 + usernameYOffset}" x2="300" y2="${105 + usernameYOffset}" 
            stroke="${currentTheme.divider}" stroke-width="2"/>
      
      <!-- Правая часть: Подписчики -->
      <g transform="translate(375, ${60 + usernameYOffset})">
        <text x="0" y="-25" font-family="Arial, sans-serif" font-size="14" 
              fill="${currentTheme.muted}" text-anchor="middle" font-weight="500">👥 Followers</text>
        <text x="0" y="25" font-family="Arial, sans-serif" font-size="42" 
              fill="${currentTheme.text}" text-anchor="middle" font-weight="bold">${followers}</text>
      </g>
      
      <!-- Сделано хлебовозом слева снизу -->
      <text x="20" y="${120 + usernameYOffset}" font-family="Arial, sans-serif" font-size="10" 
            fill="${currentTheme.footer}" text-anchor="start" font-weight="400">
        Powered by Xlebovoz
      </text>
      
      <!-- Дата справа снизу -->
      <text x="430" y="${120 + usernameYOffset}" font-family="Arial, sans-serif" font-size="10" 
            fill="${currentTheme.footer}" text-anchor="end" font-weight="400">
        ${dateStr}
      </text>
    </svg>
    `;
    
    // кэширование на 6 часов
    res.setHeader('Cache-Control', 'public, max-age=21600, s-maxage=21600');
    res.send(svg);
    
  } catch (error) {
    const errorSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="450" height="145" viewBox="0 0 450 145">
      <defs>
        <linearGradient id="error-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f85149"/>
          <stop offset="100%" stop-color="#da3633"/>
        </linearGradient>
      </defs>
      
      <rect x="2" y="2" width="446" height="141" fill="url(#error-gradient)" rx="20" 
            stroke="${borderColor}" stroke-width="${borderWidth * 2}" stroke-linejoin="round"/>
      
      <text x="225" y="70" font-family="Arial, sans-serif" font-size="16" 
            fill="white" text-anchor="middle" font-weight="bold">
        ❌ ${error.message}
      </text>
      
      <text x="20" y="130" font-family="Arial, sans-serif" font-size="10" 
            fill="rgba(255,255,255,0.7)" text-anchor="start" font-weight="400">
        Powered by Xlebovoz
      </text>
      
      <text x="430" y="130" font-family="Arial, sans-serif" font-size="10" 
            fill="rgba(255,255,255,0.7)" text-anchor="end" font-weight="400">
        ${new Date().toISOString().split('T')[0]}
      </text>
    </svg>
    `;
    res.send(errorSvg);
  }
}