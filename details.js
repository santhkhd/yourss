// details.js: Loads video details, populates page with embedded video, direct open button, and favorite logic

document.addEventListener('DOMContentLoaded', () => {
  const detailsMain = document.getElementById('details-main');
  let video = null;
  try {
    video = JSON.parse(sessionStorage.getItem('selectedVideo'));
  } catch {}
  if (!video) {
    detailsMain.innerHTML = '<p>Video data not found.</p>';
    return;
  }

  // Extract YouTube video ID
  function getYouTubeId(url) {
    const match = url.match(/(?:youtu.be\/|youtube.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/);
    return match ? match[1] : '';
  }
  const videoId = getYouTubeId(video.link);

  // Render details
  detailsMain.innerHTML = `
    <div class="details-thumb-box">
      <iframe src="https://www.youtube.com/embed/${videoId}" allowfullscreen title="${video.title}"></iframe>
    </div>
    <div class="details-meta">${new Date(video.pubDate).toLocaleString()}</div>
    <div class="details-title">${video.title}</div>
    <div class="details-channel">${video.channelName || ''}</div>
    <div class="details-desc">${video.description}</div>
    <div class="details-actions">
      <a class="watch-btn" href="#" id="open-youtube-btn" target="_blank">Open on YouTube</a>
      <button class="details-favorite-btn icon-btn" id="favorite-video-btn" title="Favorite">
        <svg viewBox="0 0 24 24"><path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/></svg>
      </button>
    </div>
    <div class="ad-box">Ad: Your promotion here! (Demo Box)</div>
  `;

  // Favorite logic
  const favBtn = document.getElementById('favorite-video-btn');
  let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  function updateFavoriteBtn() {
    if (favorites.includes(video.guid)) {
      favBtn.classList.add('favorited');
    } else {
      favBtn.classList.remove('favorited');
    }
  }
  updateFavoriteBtn();
  favBtn.onclick = () => {
    const idx = favorites.indexOf(video.guid);
    if (idx > -1) {
      favorites.splice(idx, 1);
    } else {
      favorites.push(video.guid);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updateFavoriteBtn();
  };

  // Open on YouTube logic
  const openBtn = document.getElementById('open-youtube-btn');
  openBtn.onclick = (e) => {
    e.preventDefault();
    window.open(video.link, '_blank');
  };
});
