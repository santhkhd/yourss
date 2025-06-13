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

  if (!channelId) {
    videosList.innerHTML = '<p>No channel selected.</p>';
    return;
  }

  // Get channel info
  let channels = [];
  try {
    const res = await fetch('channels.json');
    channels = await res.json();
  } catch {}
  const channel = channels.find(c => c.id === channelId);
  if (channel) titleEl.textContent = channel.name + ' Videos';

  // Fetch videos from RSS2JSON
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

  let videos = [];
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

  function renderVideos() {
    videosList.innerHTML = '';
    videosList.classList.toggle('grid-view', gridMode);
    videosList.classList.toggle('list-view', !gridMode);
    videos.forEach(video => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.onclick = () => {
        sessionStorage.setItem('selectedVideo', JSON.stringify({ ...video, channelName: channel ? channel.name : '', channelImage: channel ? channel.image : '' }));
        window.location.href = 'details.html';
      };
      card.innerHTML = `
        <img src="${video.thumbnail}" class="video-thumb" alt="${video.title}">
        <div class="video-info">
          <div class="video-title">${video.title}</div>
          <div class="video-meta">${new Date(video.pubDate).toLocaleDateString()}</div>
        </div>
      `;
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
