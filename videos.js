// videos.js: Fetches videos for selected channel, grid/list toggle, navigation

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const channelId = urlParams.get('channel');
  const videosList = document.getElementById('videos-list');
  const titleEl = document.getElementById('videos-title');
  const toggleBtn = document.getElementById('toggle-view-btn');
  const toggleIcon = document.getElementById('toggle-view-icon');
  const categoryBtn = document.getElementById('category-btn');

  let gridMode = true;
  let videos = [];
  let channels = [];
  let favoriteVideos = JSON.parse(localStorage.getItem('favoriteVideos') || '[]');

  // Helper to render favorite button
  function getFavBtnHtml(isFav) {
    return `<button class="favorite-btn${isFav ? ' favorited' : ''}" title="Toggle Favorite" tabindex="0">
      <svg viewBox="0 0 24 24"><path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/></svg>
    </button>`;
  }

  // Load channels
  try {
    const res = await fetch('channels.json');
    channels = await res.json();
  } catch {}

  // Load videos
  if (!channelId) {
    // Favorite page: show only favorite videos from videos.json
    titleEl.textContent = 'Favorite Videos';
    try {
      const res = await fetch('videos.json');
      const allVideos = await res.json();
      videos = allVideos.filter(v => favoriteVideos.includes(v.id));
    } catch (e) {
      videosList.innerHTML = `<p>Failed to load videos: ${e.message}</p>`;
      return;
    }
  } else {
    // Channel page: show all videos for that channel
    const channel = channels.find(c => c.id === channelId);
    if (channel) titleEl.textContent = channel.name + ' Videos';
    // Fetch videos from RSS2JSON
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    try {
      const res = await fetch(apiUrl);
      const data = await res.json();
      if (data.status === 'ok') {
        videos = data.items;
      } else {
        throw new Error(data.message || 'Failed to fetch feed');
      }
    } catch (e) {
      videosList.innerHTML = `<p>Failed to load videos: ${e.message}</p>`;
      return;
    }
  }

  function renderVideos() {
    videosList.innerHTML = '';
    videosList.classList.toggle('grid-view', gridMode);
    videosList.classList.toggle('list-view', !gridMode);
    if (!videos.length) {
      videosList.innerHTML = '<p>No videos found.</p>';
      return;
    }
    videos.forEach(video => {
      const isFav = favoriteVideos.includes(video.id);
      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <img src="${video.thumbnail || video.mediaThumbnail || ''}" class="video-thumb" alt="${video.title}">
        <div class="video-info">
          <div class="video-title">${video.title}</div>
          <div class="video-meta">${video.published ? new Date(video.published).toLocaleDateString() : (video.pubDate ? new Date(video.pubDate).toLocaleDateString() : '')}</div>
        </div>
        ${getFavBtnHtml(isFav)}
      `;
      card.onclick = (e) => {
        // Prevent navigation if favorite button clicked
        if (e.target.closest('.favorite-btn')) return;
        sessionStorage.setItem('selectedVideo', JSON.stringify({ ...video, channelName: video.channelTitle || '', channelImage: '' }));
        window.location.href = 'details.html';
      };
      // Favorite button logic
      const favBtn = card.querySelector('.favorite-btn');
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = favoriteVideos.indexOf(video.id);
        if (idx === -1) {
          favoriteVideos.push(video.id);
        } else {
          favoriteVideos.splice(idx, 1);
        }
        localStorage.setItem('favoriteVideos', JSON.stringify(favoriteVideos));
        renderVideos();
      });
      videosList.appendChild(card);
    });
  }

  // Single grid/list toggle button logic
  toggleBtn.addEventListener('click', () => {
    gridMode = !gridMode;
    renderVideos();
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

  renderVideos();
});
