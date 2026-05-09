import { themes } from './themes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'image/svg+xml');
  const { username, show_username = 'false', theme = 'dark', border, text } = req.query;
  
  

  // Получаем тему
  let currentTheme = themes[theme] || themes.dark;
  let textColor = currentTheme.text;
  let mutedColor = currentTheme.muted;
  let customText = req.query.text;
  
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

  // text color
  if (customText) {
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
    
    const customColor = colorMap[customText.toLowerCase()];
    if (customColor) {
      textColor = customColor;
      mutedColor = customColor + '80';
    } else {
      // Поддержка HEX без #
      const hexPattern = /^[0-9A-F]{6}$|^[0-9A-F]{3}$/i;
      let hex = customText.startsWith('#') ? customText.slice(1) : customText;
      if (hexPattern.test(hex)) {
        textColor = `#${hex}`;
        mutedColor = `#${hex}`;
      }
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
    const usernameYOffset = showUsername ? 25 : 10;
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
            fill="${textColor}" text-anchor="middle" font-weight="600">
        ${user.name || username}
      </text>
      ` : ''}
      
      <!-- Левая часть: Репозитории -->
      <g transform="translate(75, ${60 + usernameYOffset})">
        <text x="0" y="-25" font-family="Arial, sans-serif" font-size="14" 
              fill="${mutedColor}" text-anchor="middle" font-weight="500">📦 Repos</text>
        <text x="0" y="25" font-family="Arial, sans-serif" font-size="42" 
              fill="${textColor}" text-anchor="middle" font-weight="bold">${repos}</text>
      </g>
      
      <!-- Разделитель 1 -->
      <line x1="150" y1="${40 + usernameYOffset}" x2="150" y2="${105 + usernameYOffset}" 
            stroke="${currentTheme.divider}" stroke-width="2"/>
      
      <!-- Центральная часть: Звёзды -->
      <g transform="translate(225, ${60 + usernameYOffset})">
        <text x="0" y="-25" font-family="Arial, sans-serif" font-size="14" 
              fill="${mutedColor}" text-anchor="middle" font-weight="500">⭐ Stars</text>
        <text x="0" y="25" font-family="Arial, sans-serif" font-size="42" 
              fill="${textColor}" text-anchor="middle" font-weight="bold">${stars}</text>
      </g>
      
      <!-- Разделитель 2 -->
      <line x1="300" y1="${40 + usernameYOffset}" x2="300" y2="${105 + usernameYOffset}" 
            stroke="${currentTheme.divider}" stroke-width="2"/>
      
      <!-- Правая часть: Подписчики -->
      <g transform="translate(375, ${60 + usernameYOffset})">
        <text x="0" y="-25" font-family="Arial, sans-serif" font-size="14" 
              fill="${mutedColor}" text-anchor="middle" font-weight="500">👥 Followers</text>
        <text x="0" y="25" font-family="Arial, sans-serif" font-size="42" 
              fill="${textColor}" text-anchor="middle" font-weight="bold">${followers}</text>
      </g>
      
      <!-- Сделано хлебовозом слева снизу -->
      <text x="20" y="${120 + (showUsername ? 25 : 15)}" font-family="Arial, sans-serif" font-size="10" 
            fill="${currentTheme.footer}" text-anchor="start" font-weight="400">
        Powered by Xlebovoz
      </text>
      
      <!-- Дата справа снизу -->
      <text x="430" y="${120 + (showUsername ? 25 : 15)}" font-family="Arial, sans-serif" font-size="10" 
            fill="${currentTheme.footer}" text-anchor="end" font-weight="400">
        ${dateStr}
      </text>
    </svg>
    `;
    
    // кэширование на 1 часов
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
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