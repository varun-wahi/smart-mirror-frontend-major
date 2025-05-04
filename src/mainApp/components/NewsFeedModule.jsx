import React, { useState, useEffect } from 'react';

const NewsFeedModule = () => {
  const [activeItem, setActiveItem] = useState(0);
  const [newsItems, setNewsItems] = useState([]);

  useEffect(() => {
    const fetchRSS = async () => {
      try {
        const res = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=https://timesofindia.indiatimes.com/rssfeedstopstories.cms`
        );
        const data = await res.json();
        if (data.status === 'ok') {
          const items = data.items.map(item => ({
            title: item.title,
            description: item.description.replace(/<[^>]+>/g, ''), // Strip HTML
            sourceTitle: "Times of India",
            pubdate: new Date(item.pubDate)
          }));
          setNewsItems(items);
        }
      } catch (err) {
        console.error("Failed to fetch RSS feed", err);
      }
    };

    fetchRSS();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItem((prev) => (newsItems.length ? (prev + 1) % newsItems.length : 0));
    }, 10000);
    return () => clearInterval(interval);
  }, [newsItems]);

  const formatPublishDate = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 24 * 60) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / (60 * 24))} days ago`;
    }
  };

  if (!newsItems.length) return <div className="text-white">Loading news...</div>;

  const currentNews = newsItems[activeItem];

  return (
    <div className="flex flex-col text-white w-full max-w-full overflow-hidden text-center">
      <div className="text-lg font-light tracking-wider mb-2 uppercase">Latest News</div>
      <div className="opacity-80 border-b border-gray-800 pb-2 mb-2">
        <h3 className="font-light text-lg">{currentNews.title}</h3>
        <div className="flex justify-between text-xs text-gray-400 font-extralight mt-1">
          <div className="w-1/2 text-left">{currentNews.sourceTitle}</div>
          <div className="w-1/2 text-right">{formatPublishDate(currentNews.pubdate)}</div>
        </div>
      </div>
      <div className="text-sm font-extralight text-gray-300 line-clamp-3">
        {currentNews.description}
      </div>
      <div className="mt-2 text-xs text-gray-400">
        {`${activeItem + 1} of ${newsItems.length}`}
      </div>
    </div>
  );
};

export default NewsFeedModule;