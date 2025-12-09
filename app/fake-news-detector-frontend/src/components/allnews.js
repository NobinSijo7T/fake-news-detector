import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from './header';
import { Check2, X, ArrowLeft, BoxArrowUpRight } from 'react-bootstrap-icons';
import Axios from 'axios';
import Cookies from 'js-cookie';

function AllNews() {
  document.title = 'All News - News Guardian';

  const navigate = useNavigate();
  const [allNewsData, setAllNewsData] = useState([]);
  const [displayedNews, setDisplayedNews] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const observerTarget = useRef(null);

  const ITEMS_PER_PAGE = 12;
  const CACHE_KEY = 'news_guardian_all_news';
  const CACHE_EXPIRY = 10; // 10 minutes

  // Placeholder image as data URL
  const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%231a1a1a"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="%23FFE500"%3ENews Guardian%3C/text%3E%3C/svg%3E';

  // Handle image error
  const handleImageError = (e) => {
    e.target.src = PLACEHOLDER_IMAGE;
  };

  // Get image URL with fallback
  const getImageUrl = (imgUrl) => {
    if (!imgUrl || imgUrl === 'None' || imgUrl === '' || imgUrl === null) {
      return PLACEHOLDER_IMAGE;
    }
    return imgUrl;
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  // Handle back to home navigation
  const goBackHome = () => {
    window.location.href = '/';
  };

  // Fetch all news from API
  const fetchAllNews = useCallback(async () => {
    try {
      // Try to get from cache first
      const cachedData = Cookies.get(CACHE_KEY);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          setAllNewsData(parsedData);
          setDisplayedNews(parsedData.slice(0, ITEMS_PER_PAGE));
          setHasMore(parsedData.length > ITEMS_PER_PAGE);
          console.log('Loaded from cache:', parsedData.length, 'articles');
          return;
        } catch (e) {
          console.error('Error parsing cached data:', e);
        }
      }

      // Fetch from API if no cache
      const response = await Axios.get('http://127.0.0.1:8000/api/live/');
      if (response.data && response.data.length > 0) {
        // Save to cookie cache
        Cookies.set(CACHE_KEY, JSON.stringify(response.data), { expires: CACHE_EXPIRY / 1440 }); // Convert minutes to days
        
        setAllNewsData(response.data);
        setDisplayedNews(response.data.slice(0, ITEMS_PER_PAGE));
        setHasMore(response.data.length > ITEMS_PER_PAGE);
        console.log('All news fetched from API:', response.data.length, 'articles');
        console.log('Cached for', CACHE_EXPIRY, 'minutes');
      }
    } catch (error) {
      console.error('Error fetching all news:', error);
      
      // Try cache as fallback
      const cachedData = Cookies.get(CACHE_KEY);
      if (cachedData) {
        try {
          const parsedData = JSON.parse(cachedData);
          setAllNewsData(parsedData);
          setDisplayedNews(parsedData.slice(0, ITEMS_PER_PAGE));
          setHasMore(parsedData.length > ITEMS_PER_PAGE);
          console.log('Loaded from cache as fallback:', parsedData.length, 'articles');
        } catch (e) {
          console.error('Error parsing cached fallback data:', e);
        }
      }
    }
  }, []);

  // Load more news
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);
    
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newItems = allNewsData.slice(startIndex, endIndex);
      
      if (newItems.length > 0) {
        setDisplayedNews(prev => [...prev, ...newItems]);
        setPage(nextPage);
        setHasMore(endIndex < allNewsData.length);
      } else {
        setHasMore(false);
      }
      
      setLoading(false);
    }, 500);
  }, [loading, hasMore, page, allNewsData]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMore]);

  // Fetch news on mount
  useEffect(() => {
    fetchAllNews();
  }, [fetchAllNews]);

  return (
    <>
      <Header activeContainer={1} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="all-news-container">
        <div className="all-news-header">
          <button 
            className="back-button" 
            onClick={goBackHome}
            type="button"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          <div className="all-news-header-content">
            <h1 className="all-news-title">All News</h1>
            <p className="all-news-subtitle">
              Showing {displayedNews.length} of {allNewsData.length} articles
            </p>
          </div>
        </div>

        <div className="all-news-grid">
          {displayedNews.map((news, index) => (
            <div 
              key={`${news.id}-${index}`} 
              className="news-card"
              onClick={() => setSelectedNews(news)}
              style={{ cursor: 'pointer' }}
            >
              <img 
                src={getImageUrl(news.img_url)} 
                alt={news.title}
                className="news-card-image"
                onError={handleImageError}
              />
              <div className="news-card-content">
                <div className="news-card-category">
                  {news.section_name || 'News'} • {new Date(news.publication_date).toLocaleDateString()}
                </div>
                <h3 className="news-card-title">{news.title}</h3>
                <div className="badge-container">
                  {news.is_fact_check_article ? (
                    <span className="prediction-badge fact-check">
                      <Check2 size={12} /> Fact-Check
                    </span>
                  ) : news.prediction ? (
                    <span className="prediction-badge real">
                      <Check2 size={12} /> Verified
                    </span>
                  ) : (
                    <span className="prediction-badge fake">
                      <X size={12} /> Flagged
                    </span>
                  )}
                  {news.source_credibility && news.source_credibility !== 'UNKNOWN' && (
                    <span className={`credibility-badge ${news.source_credibility.toLowerCase().replace('_', '-')}`}>
                      {news.source_credibility === 'FACT_CHECKER' ? 'FC' : news.source_credibility.charAt(0)}
                    </span>
                  )}
                </div>
                <a href={news.web_url} target="_blank" rel="noopener noreferrer" className="read-more-link">
                  Read Full Article →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="load-more-container">
            <button className="load-more-button" onClick={loadMore}>
              Load More Articles
            </button>
            <p className="load-more-info">
              Showing {displayedNews.length} of {allNewsData.length} articles
            </p>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading more news...</p>
          </div>
        )}

        {/* End message */}
        {!hasMore && displayedNews.length > 0 && (
          <div className="end-message">
            <p>You've reached the end. All {allNewsData.length} articles loaded.</p>
          </div>
        )}

        {/* News Detail Modal */}
        {selectedNews && (
          <div className="news-modal-overlay" onClick={() => setSelectedNews(null)}>
            <div className="news-modal" onClick={(e) => e.stopPropagation()}>
              <div className="news-modal-header">
                <button className="news-modal-close" onClick={() => setSelectedNews(null)}>
                  <X size={20} />
                </button>
              </div>
              <img 
                src={getImageUrl(selectedNews.img_url)} 
                alt={selectedNews.title}
                className="news-modal-image"
                onError={handleImageError}
              />
              <div className="news-modal-body">
                <div className="news-modal-category">
                  {selectedNews.section_name || 'News'} • {new Date(selectedNews.publication_date).toLocaleDateString()}
                </div>
                <h2 className="news-modal-title">{selectedNews.title}</h2>
                <div className="news-modal-badges">
                  {selectedNews.is_fact_check_article ? (
                    <span className="prediction-badge fact-check">
                      <Check2 size={12} /> Fact-Check
                    </span>
                  ) : selectedNews.prediction ? (
                    <span className="prediction-badge real">
                      <Check2 size={12} /> Verified
                    </span>
                  ) : (
                    <span className="prediction-badge fake">
                      <X size={12} /> Flagged
                    </span>
                  )}
                  {selectedNews.source_credibility && selectedNews.source_credibility !== 'UNKNOWN' && (
                    <span className={`credibility-badge ${selectedNews.source_credibility.toLowerCase().replace('_', '-')}`}>
                      {selectedNews.source_credibility === 'FACT_CHECKER' ? 'FC' : selectedNews.source_credibility.charAt(0)}
                    </span>
                  )}
                </div>
                <a 
                  href={selectedNews.web_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="news-modal-read-more"
                >
                  Read Full Article <BoxArrowUpRight size={18} />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AllNews;
