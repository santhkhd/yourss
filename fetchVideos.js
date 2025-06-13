
const fs = require('fs');
const Parser = require('rss-parser');
const parser = new Parser();
const channels = require('./channels.json');
const videoStore = 'videos.json';

(async () => {
  let stored = fs.existsSync(videoStore) ? JSON.parse(fs.readFileSync(videoStore)) : {};
  for (let channel of channels) {
    let feed = await parser.parseURL(channel.rss);
    stored[channel.name] = stored[channel.name] || [];
    feed.items.forEach(item => {
      if (!stored[channel.name].some(v => v.link === item.link)) {
        stored[channel.name].push({
          title: item.title,
          link: item.link,
          description: item.contentSnippet || ''
        });
      }
    });
  }
  fs.writeFileSync(videoStore, JSON.stringify(stored, null, 2));
})();
