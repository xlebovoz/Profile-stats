async function loadUserData() {
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        alert('Enter the GitHub username');
        return;
    }
    
    try {
        document.getElementById('badgeContainer').innerHTML = '<p>Loading...</p>';
        
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        
        if (!userResponse.ok) {
            throw new Error('The user was not found');
        }
        
        const userData = await userResponse.json();
        
        const reposResponse = await fetch(userData.repos_url);
        const reposData = await reposResponse.json();
        const totalStars = reposData.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        
        function formatNumber(num) {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(1) + 'M';
            }
            if (num >= 1000) {
                return (num / 1000).toFixed(1) + 'k';
            }
            return num.toString();
        }
        
        const repos = formatNumber(userData.public_repos);
        const stars = formatNumber(totalStars);
        const followers = formatNumber(userData.followers);
        
        createBadge(repos, stars, followers);
        
        showMarkdownCode(username);
        
    } catch (error) {
        document.getElementById('badgeContainer').innerHTML = `
            <div style="color: #f85149; padding: 15px; background: #ffebeb; border-radius: 6px;">
                Error: ${error.message}
            </div>
        `;
    }
}

function createBadge(repos, stars, followers) {
    const badgeContainer = document.getElementById('badgeContainer');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    
    badgeContainer.innerHTML = `
        <div class="badge">
            <!-- repos -->
            <div class="stat">
                <div class="icon">📦 Repos</div>
                <div class="number">${repos}</div>
            </div>
            
            <div class="divider"></div>
            
            <!-- stars -->
            <div class="stat">
                <div class="icon">⭐ Stars</div>
                <div class="number">${stars}</div>
            </div>
            
            <div class="divider"></div>
            
            <!-- followers -->
            <div class="stat">
                <div class="icon">👥 Followers</div>
                <div class="number">${followers}</div>
            </div>
            
            <div class="footer-left">Powered by Xlebovoz</div>
            <div class="footer-right">${dateStr}</div>
        </div>
    `;
}

function showMarkdownCode(username) {
    const codeContainer = document.getElementById('codeContainer');
    const codeElement = document.getElementById('markdownCode');

    codeElement.textContent = `![GitHub Stats](https://profile-stats-xleb.vercel.app/api/badge.svg?username=${username})`;
    
    codeContainer.style.display = 'block';
}

function copyCode() {
    const code = document.getElementById('markdownCode').textContent;
    navigator.clipboard.writeText(code)
        .then(() => alert('The code is copied'))
        .catch(err => console.error('Error:', err));
}

window.onload = function() {
    loadUserData();
}