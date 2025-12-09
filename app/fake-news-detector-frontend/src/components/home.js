import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './header';
import { Check2, X, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, ArrowClockwise } from 'react-bootstrap-icons';
import Axios from 'axios';

function Home() {
  document.title = 'News Guardian';
  let stage = 1;

  const [liveNewsData, setLiveNewsData] = useState([]);
  const [mustSeeNews, setMustSeeNews] = useState([]);
  const [allNews, setAllNews] = useState([]);
  const [activeRegion, setActiveRegion] = useState('All');
  const [activeTopic, setActiveTopic] = useState('All');
  const [activeVerification, setActiveVerification] = useState('All');
  const [darkMode, setDarkMode] = useState(false);
  const [trendyNewsExpanded, setTrendyNewsExpanded] = useState(false);
  const [mustSeeExpanded, setMustSeeExpanded] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [trendyStartIndex, setTrendyStartIndex] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef(null);
  const [filteredNews, setFilteredNews] = useState([]);

  // Placeholder image as data URL  
  const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%231a1a1a"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="%23FFE500"%3ENews Guardian%3C/text%3E%3C/svg%3E';

  // Handle image error
  const handleImageError = (e) => {
    console.log('Image load error:', e.target.src);
    e.target.src = PLACEHOLDER_IMAGE;
  };

  // Get image URL with fallback
  const getImageUrl = (imgUrl) => {
    if (!imgUrl || imgUrl === 'None' || imgUrl === '' || imgUrl === null) {
      return PLACEHOLDER_IMAGE;
    }
    // Add crossorigin for external images
    return imgUrl;
  };

  // Navigation handlers with auto-refresh
  const handleFeaturedPrev = () => {
    setFeaturedIndex((prev) => (prev > 0 ? prev - 1 : filteredNews.length - 1));
    resetAutoRefreshTimer();
  };

  const handleFeaturedNext = () => {
    setFeaturedIndex((prev) => (prev < filteredNews.length - 1 ? prev + 1 : 0));
    resetAutoRefreshTimer();
  };

  const handleTrendyPrev = () => {
    setTrendyStartIndex((prev) => (prev > 1 ? prev - 3 : 1));
    resetAutoRefreshTimer();
  };

  const handleTrendyNext = () => {
    const maxIndex = trendyNewsExpanded ? filteredNews.length : Math.min(filteredNews.length, 7);
    setTrendyStartIndex((prev) => (prev + 3 < maxIndex ? prev + 3 : 1));
    resetAutoRefreshTimer();
  };

  // Manual refresh handler - triggers API to fetch new news
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Triggering news refresh from sources...');
      
      // Call the dedicated refresh endpoint
      const response = await Axios.get('http://127.0.0.1:8000/api/refresh/');
      
      if (response.data && response.data.success) {
        setLiveNewsData(response.data.data);
        console.log('✓ News refreshed successfully!');
        console.log(`📰 Total articles: ${response.data.count}`);
        console.log(`🆕 New articles added: ${response.data.new_articles}`);
        console.log(`💬 ${response.data.message}`);
        
        // Reset navigation indices to show new content
        setFeaturedIndex(0);
        setTrendyStartIndex(1);
      }
      
      // Also refresh category news
      Axios.get('http://127.0.0.1:8000/api/category/News/')
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setMustSeeNews(res.data);
            console.log('✓ Category news also refreshed');
          }
        })
        .catch((err) => console.error('Error refreshing category news:', err));
      
    } catch (error) {
      console.error('❌ Error refreshing news:', error);
      console.log('Falling back to regular fetch...');
      // Fallback to regular fetch if refresh fails
      fetchLiveNewsData();
    } finally {
      setTimeout(() => setIsRefreshing(false), 1500);
      resetAutoRefreshTimer();
    }
  };

  // Reset auto-refresh timer
  const resetAutoRefreshTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      fetchLiveNewsData();
    }, 30000);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const categories = ['Sport', 'Lifestyle', 'Arts', 'News'];

  // Filter news based on active filters
  const applyFilters = useCallback((newsData) => {
    let filtered = [...newsData];

    // Filter by region
    if (activeRegion !== 'All') {
      const regionKeywords = {
        'US': ['us', 'usa', 'united states', 'america', 'washington', 'trump', 'biden'],
        'UK': ['uk', 'britain', 'british', 'england', 'london', 'scotland', 'wales'],
        'Australia': ['australia', 'australian', 'sydney', 'melbourne', 'canberra'],
        'India': ['india', 'indian', 'delhi', 'mumbai', 'modi', 'bangalore']
      };

      const keywords = regionKeywords[activeRegion] || [];
      filtered = filtered.filter(news => 
        keywords.some(keyword => 
          news.title.toLowerCase().includes(keyword) || 
          news.section_name.toLowerCase().includes(keyword)
        )
      );
    }

    // Filter by topic
    if (activeTopic !== 'All') {
      const topicMapping = {
        'Politics': ['politics', 'election', 'government', 'parliament', 'congress'],
        'Business': ['business', 'economy', 'finance', 'market', 'trade', 'company'],
        'Technology': ['technology', 'tech', 'ai', 'digital', 'cyber', 'software'],
        'Health': ['health', 'medical', 'hospital', 'doctor', 'disease', 'covid'],
        'Environment': ['environment', 'climate', 'weather', 'pollution', 'green'],
        'Entertainment': ['entertainment', 'film', 'movie', 'music', 'celebrity', 'show']
      };

      const keywords = topicMapping[activeTopic] || [];
      filtered = filtered.filter(news => 
        keywords.some(keyword => 
          news.title.toLowerCase().includes(keyword) || 
          news.section_name.toLowerCase().includes(keyword) ||
          news.news_category.toLowerCase().includes(keyword)
        )
      );
    }

    // Filter by verification status
    if (activeVerification === 'Verified') {
      filtered = filtered.filter(news => news.prediction === true);
    } else if (activeVerification === 'Fake') {
      filtered = filtered.filter(news => news.prediction === false);
    }

    return filtered;
  }, [activeRegion, activeTopic, activeVerification]);

  // Update filtered news whenever filters or data changes
  useEffect(() => {
    const filtered = applyFilters(liveNewsData);
    setFilteredNews(filtered);
    setFeaturedIndex(0);
    setTrendyStartIndex(1);
  }, [liveNewsData, activeRegion, activeTopic, activeVerification, applyFilters]);

  // Fetch India-specific news when India region is selected
  useEffect(() => {
    if (activeRegion === 'India') {
      fetchIndiaNews();
    }
  }, [activeRegion]);

  // Function to fetch India-specific news
  const fetchIndiaNews = async () => {
    try {
      console.log('🇮🇳 Fetching India news from Google News & Onmanorama...');
      const response = await Axios.get('http://127.0.0.1:8000/api/india-news/');
      
      if (response.data && response.data.success && response.data.data) {
        setLiveNewsData(response.data.data);
        console.log('✓ India news fetched successfully!');
        console.log(`📰 Total articles: ${response.data.count}`);
        console.log(`🆕 New articles added: ${response.data.new_articles}`);
      }
    } catch (error) {
      console.error('❌ Error fetching India news:', error);
    }
  };

  // Function to fetch live news data
  const fetchLiveNewsData = useCallback(() => {
    Axios.get('http://127.0.0.1:8000/api/live/')
      .then((response) => {
        if (response.data && response.data.length > 0) {
          setLiveNewsData(response.data);
          console.log('Live news fetched:', response.data.length, 'articles');
        }
      })
      .catch((error) => {
        console.error('Error fetching live news:', error);
      });
    
    Axios.get('http://127.0.0.1:8000/api/category/News/')
    .then((response) => {
      if (response.data && response.data.length > 0) {
        setMustSeeNews(response.data);
        console.log('Must see news fetched:', response.data.length, 'articles');
      }
    })
    .catch((error) => {
      console.error('Error fetching must see news:', error);
    });

    const fetchPromises = categories.map((category) => {
      return Axios.get(`http://127.0.0.1:8000/api/category/${category}/`)
        .then((response) => {
          if (response.data.length > 0) {
            return response.data[0];
          }
        })
        .catch((error) => {
          console.error('Error fetching category', category, error);
        });
    });
    
    Promise.all(fetchPromises)
      .then((newsData) => {
        const filteredNewsData = newsData.filter((data) => data !== undefined);
        setAllNews(filteredNewsData);
        console.log('All news fetched and added.');
      })
      .catch((error) => {
        console.error('Error', error);
      });    
  }, []);

  // Fetch initial live news data on component mount
  useEffect(() => {
    // Fetch immediately on mount
    fetchLiveNewsData();

    // Set up interval for auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchLiveNewsData();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchLiveNewsData]);

  return (
    <>
      <Header activeContainer={stage} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <div className="main-layout">
        <main className="main-content">
          {/* Featured News Section */}
          <section className="featured-section">
            <div className="section-header">
              <h2 className="section-title">Featured News</h2>
              <div className="section-nav">
                <button className="nav-arrow" onClick={handleFeaturedPrev}><ArrowLeft size={16} /></button>
                <button className="nav-arrow" onClick={handleFeaturedNext}><ArrowRight size={16} /></button>
              </div>
            </div>
            
            {filteredNews.length > 0 ? (
              <div className="hero-card">
                <img 
                  src={getImageUrl(filteredNews[featuredIndex].img_url)} 
                  alt={filteredNews[featuredIndex].title}
                  className="hero-image"
                  onError={handleImageError}
                />
                <div className="hero-overlay">
                  <span className="hero-category">
                    {filteredNews[featuredIndex].section_name || 'News'}
                  </span>
                  <h1 className="hero-title">{filteredNews[featuredIndex].title}</h1>
                  <div className="hero-meta">
                    <span>{new Date(filteredNews[featuredIndex].publication_date).toLocaleDateString()}</span>
                    {filteredNews[featuredIndex].prediction ? (
                      <span className="prediction-badge real">
                        <Check2 size={14} /> Verified Real
                      </span>
                    ) : (
                      <span className="prediction-badge fake">
                        <X size={14} /> Flagged Fake
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-news-message">
                <p>No news found matching your filters. Try adjusting your selection.</p>
              </div>
            )}
          </section>

          {/* Filter Categories */}
          <div className="filter-section">
            {/* Region Filter */}
            <div className="filter-group">
              <h3 className="filter-title">By Region</h3>
              <div className="category-tabs">
                {['All', 'US', 'UK', 'Australia', 'India'].map((region) => (
                  <button 
                    key={region}
                    className={`category-tab ${activeRegion === region ? 'active' : ''}`}
                    onClick={() => setActiveRegion(region)}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Filter */}
            <div className="filter-group">
              <h3 className="filter-title">By Topic</h3>
              <div className="category-tabs">
                {['All', 'Politics', 'Business', 'Technology', 'Health', 'Environment', 'Entertainment'].map((topic) => (
                  <button 
                    key={topic}
                    className={`category-tab ${activeTopic === topic ? 'active' : ''}`}
                    onClick={() => setActiveTopic(topic)}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification Filter */}
            <div className="filter-group">
              <h3 className="filter-title">By Verification</h3>
              <div className="category-tabs">
                {['All', 'Verified', 'Fake'].map((status) => (
                  <button 
                    key={status}
                    className={`category-tab ${activeVerification === status ? 'active' : ''}`}
                    onClick={() => setActiveVerification(status)}
                  >
                    {status === 'Verified' && '✓ '}
                    {status === 'Fake' && '✗ '}
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trendy News Section */}
          <section className="trendy-section">
            <div className="section-header">
              <h2 className="section-title">Trendy News</h2>
              <div className="section-nav">
                <button 
                  className={`refresh-button ${isRefreshing ? 'spinning' : ''}`}
                  onClick={handleManualRefresh}
                  title="Refresh news"
                >
                  <ArrowClockwise size={18} />
                </button>
                <button className="nav-arrow" onClick={handleTrendyPrev}><ArrowLeft size={16} /></button>
                <button className="nav-arrow" onClick={handleTrendyNext}><ArrowRight size={16} /></button>
              </div>
            </div>
            
            <div className="news-grid">
              {filteredNews.slice(trendyStartIndex, trendyNewsExpanded ? filteredNews.length : trendyStartIndex + 6).map((news, index) => (
                <div key={index} className="news-card">
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
                    {news.prediction ? (
                      <span className="prediction-badge real">
                        <Check2 size={12} /> Real
                      </span>
                    ) : (
                      <span className="prediction-badge fake">
                        <X size={12} /> Fake
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {filteredNews.length > 7 && (
              <div className="accordion-toggle-container">
                <button 
                  className="accordion-toggle-btn"
                  onClick={() => setTrendyNewsExpanded(!trendyNewsExpanded)}
                >
                  {trendyNewsExpanded ? (
                    <>
                      <span>Show Less</span>
                      <ChevronUp size={20} />
                    </>
                  ) : (
                    <>
                      <span>Show More News ({filteredNews.length - 7} more)</span>
                      <ChevronDown size={20} />
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* Featured News Grid */}
          {mustSeeNews.length >= 3 && (
            <section className="featured-section">
              <div className="section-header">
                <h2 className="section-title">Must See</h2>
              </div>
              
              <div className="news-grid">
                {mustSeeNews.slice(0, mustSeeExpanded ? mustSeeNews.length : 3).map((news, index) => (
                  <div key={index} className="news-card">
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
                      {news.prediction ? (
                        <span className="prediction-badge real">
                          <Check2 size={12} /> Real
                        </span>
                      ) : (
                        <span className="prediction-badge fake">
                          <X size={12} /> Fake
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {mustSeeNews.length > 3 && (
                <div className="accordion-toggle-container">
                  <button 
                    className="accordion-toggle-btn"
                    onClick={() => setMustSeeExpanded(!mustSeeExpanded)}
                  >
                    {mustSeeExpanded ? (
                      <>
                        <span>Show Less</span>
                        <ChevronUp size={20} />
                      </>
                    ) : (
                      <>
                        <span>Show More News ({mustSeeNews.length - 3} more)</span>
                        <ChevronDown size={20} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="sidebar-content">
          {/* Top Story Section */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Top Story</h3>
            
            {liveNewsData.slice(0, 5).map((news, index) => (
              <div key={index} className="story-item">
                <img 
                  src={getImageUrl(news.img_url)} 
                  alt={news.title}
                  className="story-image"
                  onError={handleImageError}
                />
                <div className="story-content">
                  <div>
                    <div className="story-category">
                      {news.section_name || 'News'} • {new Date(news.publication_date).toLocaleDateString()}
                    </div>
                    <h4 className="story-title">{news.title.substring(0, 80)}...</h4>
                  </div>
                  <div className="story-verification">
                    {news.prediction ? (
                      <span className="verification-badge verified">✓ Verified</span>
                    ) : (
                      <span className="verification-badge flagged">✗ Flagged</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Today's Spotlight */}
          {allNews.length > 0 && (
            <div className="spotlight-card">
              <div className="spotlight-label">Today's Spotlight</div>
              <h3 className="spotlight-title">
                {allNews[0]?.title || 'Latest News Updates'}
              </h3>
              <div className="spotlight-meta">
                {allNews[0]?.section_name || 'News'} • Article
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

export default Home;
