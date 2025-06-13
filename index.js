// index.js: Loads channels, builds tabs/cards, handles navigation

document.addEventListener('DOMContentLoaded', async () => {
  const channelList = document.getElementById('channel-list');
  const favoritesBtn = document.getElementById('favorites-btn');
  const darkModeBtn = document.getElementById('dark-mode-btn');
  const toggleBtn = document.getElementById('toggle-view-btn');
  const toggleIcon = document.getElementById('toggle-view-icon');
  const categoryBtn = document.getElementById('category-btn');

  let channels = [];
  let showFavorites = false;
  let gridMode = true;

  try {
    const res = await fetch('channels.json');
    channels = await res.json();
  } catch (e) {
    channelList.innerHTML = '<p>Failed to load channels.</p>';
    return;
  }

  // Dummy favorite channels logic (could be expanded)
  let favoriteChannels = JSON.parse(localStorage.getItem('favoriteChannels') || '[]');

  function renderChannelCards() {
    channelList.innerHTML = '';
    let list = showFavorites ? channels.filter(ch => favoriteChannels.includes(ch.id)) : channels;
    if (!list.length) {
      channelList.innerHTML = '<p>No channels found.</p>';
      return;
    }
    if (gridMode) {
      channelList.classList.add('two-col');
    } else {
      channelList.classList.remove('two-col');
    }
    list.forEach(ch => {
      const card = document.createElement('div');
      card.className = 'channel-card';
      card.innerHTML = `
        <img src="${ch.image}" class="channel-image" alt="${ch.name}">
        <div class="channel-name">${ch.name}</div>
      `;
      card.onclick = () => {
        window.location.href = `videos.html?channel=${encodeURIComponent(ch.id)}`;
      };
      channelList.appendChild(card);
    });
  }

  // Favorites icon logic
  favoritesBtn.addEventListener('click', () => {
    showFavorites = !showFavorites;
    favoritesBtn.classList.toggle('active', showFavorites);
    renderChannelCards();
  });

  // Dark mode
  darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
  });
  // On load, set dark mode
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  }

  // Grid/List view toggle
  toggleBtn.addEventListener('click', () => {
    gridMode = !gridMode;
    renderChannelCards();
    if (gridMode) {
      toggleBtn.title = 'Switch to List View';
      toggleBtn.setAttribute('aria-label', 'Switch to List View');
      toggleIcon.innerHTML = '<path d="M3,3V11H11V3M3,13V21H11V13M13,3V11H21V3M13,13V21H21V13" />';
    } else {
      toggleBtn.title = 'Switch to Grid View';
      toggleBtn.setAttribute('aria-label', 'Switch to Grid View');
      toggleIcon.innerHTML = '<path d="M3,4H21V6H3V4M3,11H21V13H3V11M3,18H21V20H3V18Z" />';
    }
  });
  // Set initial icon/title
  toggleBtn.title = 'Switch to List View';
  toggleBtn.setAttribute('aria-label', 'Switch to List View');
  toggleIcon.innerHTML = '<path d="M3,3V11H11V3M3,13V21H11V13M13,3V11H21V3M13,13V21H21V13" />';

  // Category icon click (future use)
  categoryBtn.addEventListener('click', () => {
    alert('Category filter coming soon!');
  });

  renderChannelCards();
});
