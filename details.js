// details.js: Show selected video details from sessionStorage

document.addEventListener('DOMContentLoaded', () => {
  const detailsBox = document.getElementById('details-main');
  let video = null;
  try {
    video = JSON.parse(sessionStorage.getItem('selectedVideo'));
  } catch {}

  if (!video) {
    detailsBox.innerHTML = '<p>No video selected.</p>';
    return;
  }

  detailsBox.innerHTML = `
    <div class="details-thumb-box">
      <img src="${video.thumbnail || video.mediaThumbnail || ''}" class="details-thumb" alt="${video.title}">
      <div class="play-overlay" onclick="window.open('${video.link || video.url}', '_blank')">
        <svg class="play-icon" viewBox="0 0 64 64"><polygon points="16,8 56,32 16,56"/></svg>
      </div>
    </div>
    <div class="details-title">${video.title}</div>
    <div class="details-meta">${video.published ? new Date(video.published).toLocaleString() : (video.pubDate ? new Date(video.pubDate).toLocaleString() : '')}</div>
    <div class="details-channel">${video.channelName || video.channelTitle || ''}</div>
    <div class="details-desc">${video.description || ''}</div>
  `;
});
