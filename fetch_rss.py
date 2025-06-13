import feedparser
import json
import requests
from datetime import datetime

# Replace with your YouTube channel ID or load from channels.json
def get_channel_id():
    try:
        with open('channels.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Assume first channel or adjust as needed
            return data[0]['id']
    except Exception:
        return None

def fetch_youtube_rss(channel_id):
    url = f'https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}'
    return feedparser.parse(url)

def load_existing_videos():
    try:
        with open('videos.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def main():
    channel_id = get_channel_id()
    if not channel_id:
        print('No channel ID found in channels.json')
        return
    feed = fetch_youtube_rss(channel_id)
    existing = load_existing_videos()
    existing_ids = {v.get('videoId') for v in existing}
    new_videos = []
    channel_name = feed.feed.get('title', '')
    for entry in feed.entries:
        vid = {
            'title': entry.title,
            'videoId': entry.yt_videoid,
            'published': entry.published,
            'thumbnail': entry.media_thumbnail[0]['url'] if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail else '',
            'channelId': channel_id,
            'channelName': channel_name
        }
        if vid['videoId'] not in existing_ids:
            new_videos.append(vid)
    # Combine and remove duplicates by videoId
    all_videos = new_videos + existing
    seen = set()
    unique_videos = []
    for v in all_videos:
        if v['videoId'] not in seen:
            unique_videos.append(v)
            seen.add(v['videoId'])
    unique_videos.sort(key=lambda v: v['published'], reverse=True)
    with open('videos.json', 'w', encoding='utf-8') as f:
        json.dump(all_videos, f, indent=2, ensure_ascii=False)
    print(f'Added {len(new_videos)} new videos.')

if __name__ == '__main__':
    main()
