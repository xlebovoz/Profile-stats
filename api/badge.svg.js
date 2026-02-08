export default async function handler(req, res) {
  res.setHeader('Content-Type', 'image/svg+xml');
  const { username, show_username = 'false' } = req.query;
  
  if (!username) {
    return res.send(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="80">
      <style>
        .container { font-family: 'Segoe UI', Arial, sans-serif; }
        .title { font-size: 18px; font-weight: 600; fill: #24292f; }
        .desc { font-size: 14px; fill: #57606a; }
      </style>
      <rect width="300" height="80" fill="#f6f8fa" rx="12"/>
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
    const totalHeight = showUsername ? 155 : 145; // Чуть увеличил: 155/145 вместо 150/140
    
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="450" height="${totalHeight}" viewBox="0 0 450 ${totalHeight}">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0d1117"/>
          <stop offset="50%" stop-color="#161b22"/>
          <stop offset="100%" stop-color="#0d1117"/>
        </linearGradient>
      </defs>
      
      <!-- Основной фон -->
      <rect width="450" height="${totalHeight}" fill="url(#gradient)" rx="20"/>
      
      ${showUsername ? `
      <!-- Имя пользователя сверху -->
      <text x="225" y="30" font-family="Arial, sans-serif" font-size="16" 
            fill="#f0f6fc" text-anchor="middle" font-weight="600">
        ${user.name || username}
      </text>
      ` : ''}
      
      <!-- Левая часть: Репозитории -->
      <g transform="translate(75, ${65 + usernameYOffset})">
        <text x="0" y="-25" font-family="Arial, sans-serif" font-size="14" 
              fill="#8b949e" text-anchor="middle" font-weight="500">📦 Repos</text>
        <text x="0" y="25" font-family="Arial, sans-serif" font-size="42" 
              fill="white" text-anchor="middle" font-weight="bold">${repos}</text>
      </g>
      
      <!-- Разделитель 1 -->
      <line x1="150" y1="${45 + usernameYOffset}" x2="150" y2="${105 + usernameYOffset}" stroke="#30363d" stroke-width="2"/>
      
      <!-- Центральная часть: Звёзды -->
      <g transform="translate(225, ${65 + usernameYOffset})">
        <text x="0" y="-25" font-family="Arial, sans-serif" font-size="14" 
              fill="#8b949e" text-anchor="middle" font-weight="500">⭐ Stars</text>
        <text x="0" y="25" font-family="Arial, sans-serif" font-size="42" 
              fill="white" text-anchor="middle" font-weight="bold">${stars}</text>
      </g>
      
      <!-- Разделитель 2 -->
      <line x1="300" y1="${45 + usernameYOffset}" x2="300" y2="${105 + usernameYOffset}" stroke="#30363d" stroke-width="2"/>
      
      <!-- Правая часть: Подписчики -->
      <g transform="translate(375, ${65 + usernameYOffset})">
        <text x="0" y="-25" font-family="Arial, sans-serif" font-size="14" 
              fill="#8b949e" text-anchor="middle" font-weight="500">👥 Followers</text>
        <text x="0" y="25" font-family="Arial, sans-serif" font-size="42" 
              fill="white" text-anchor="middle" font-weight="bold">${followers}</text>
      </g>
      
      <text x="20" y="${115 + usernameYOffset}" font-family="Arial, sans-serif" font-size="10" 
            fill="#6e7681" text-anchor="start" font-weight="400">
        Powered by Xlebovoz
      </text>

      <text x="430" y="${115 + usernameYOffset}" font-family="Arial, sans-serif" font-size="10" 
            fill="#6e7681" text-anchor="end" font-weight="400">
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
      
      <rect width="450" height="145" fill="url(#error-gradient)" rx="20"/>
      
      <text x="225" y="70" font-family="Arial, sans-serif" font-size="16" 
            fill="white" text-anchor="middle" font-weight="bold">
        ❌ ${error.message}
      </text>
      
      <text x="20" y="130" font-family="Arial, sans-serif" font-size="10" 
            fill="rgba(255,255,255,0.7)" text-anchor="start" font-weight="400">
        сделано хлебовозом
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