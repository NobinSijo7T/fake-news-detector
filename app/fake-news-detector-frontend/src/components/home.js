import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './header';
import { Check2, X, ArrowLeft, ArrowRight, ChevronDown, ChevronUp, ArrowClockwise } from 'react-bootstrap-icons';
import Axios from 'axios';
import Cookies from 'js-cookie';

function Home() {
  document.title = 'News Guardian';
  let stage = 1;

  const navigate = useNavigate();
  const [liveNewsData, setLiveNewsData] = useState([]);
  const [moreNews, setMoreNews] = useState([]);
  const [allNews, setAllNews] = useState([]);
  const [activeRegion, setActiveRegion] = useState('All');
  const [activeTopic, setActiveTopic] = useState('All');
  const [activeVerification, setActiveVerification] = useState('All');
  const [darkMode, setDarkMode] = useState(false);
  const [trendyNewsExpanded, setTrendyNewsExpanded] = useState(false);
  const [mustSeeExpanded, setMustSeeExpanded] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [trendyStartIndex, setTrendyStartIndex] = useState(1);
  const [moreNewsStartIndex, setMoreNewsStartIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const intervalRef = useRef(null);
  const [filteredNews, setFilteredNews] = useState([]);

  const CACHE_KEY_LIVE = 'news_guardian_live_news';
  const CACHE_KEY_MORE = 'news_guardian_more_news';
  const CACHE_EXPIRY = 10; // 10 minutes

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

  const handleMustSeePrev = () => {
    setMoreNewsStartIndex((prev) => (prev > 0 ? prev - 3 : Math.max(0, moreNews.length - 3)));
    resetAutoRefreshTimer();
  };

  const handleMustSeeNext = () => {
    setMoreNewsStartIndex((prev) => (prev + 3 < moreNews.length ? prev + 3 : 0));
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
            setMoreNews(res.data);
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

  // Function to fetch live news data with cookie caching
  const fetchLiveNewsData = useCallback(() => {
    // Check cache for live news
    const cachedLiveNews = Cookies.get(CACHE_KEY_LIVE);
    if (cachedLiveNews) {
      try {
        const parsedData = JSON.parse(cachedLiveNews);
        setLiveNewsData(parsedData);
        console.log('✓ Loaded from cache:', parsedData.length, 'live news articles');
      } catch (e) {
        console.error('Error parsing cached live news:', e);
      }
    }

    // Fetch fresh data from API
    Axios.get('http://127.0.0.1:8000/api/live/')
      .then((response) => {
        if (response.data && response.data.length > 0) {
          setLiveNewsData(response.data);
          // Save to cookie cache (expires in 10 minutes)
          Cookies.set(CACHE_KEY_LIVE, JSON.stringify(response.data), { expires: CACHE_EXPIRY / 1440 });
          console.log('✓ Live news fetched from API:', response.data.length, 'articles');
        }
      })
      .catch((error) => {
        console.error('❌ Error fetching live news:', error);
        // If API fails and we have cache, fallback to cached data
        if (cachedLiveNews) {
          console.log('⚠️ Using cached live news as fallback');
        }
      });
    
    // Check cache for more news
    const cachedMoreNews = Cookies.get(CACHE_KEY_MORE);
    if (cachedMoreNews) {
      try {
        const parsedData = JSON.parse(cachedMoreNews);
        setMoreNews(parsedData);
        console.log('✓ Loaded from cache:', parsedData.length, 'more news articles');
      } catch (e) {
        console.error('Error parsing cached more news:', e);
      }
    }

    // Fetch fresh category news
    Axios.get('http://127.0.0.1:8000/api/category/News/')
    .then((response) => {
      if (response.data && response.data.length > 0) {
        setMoreNews(response.data);
        // Save to cookie cache
        Cookies.set(CACHE_KEY_MORE, JSON.stringify(response.data), { expires: CACHE_EXPIRY / 1440 });
        console.log('✓ More news fetched from API:', response.data.length, 'articles');
      }
    })
    .catch((error) => {
      console.error('❌ Error fetching more news:', error);
      // If API fails and we have cache, fallback to cached data
      if (cachedMoreNews) {
        console.log('⚠️ Using cached more news as fallback');
      }
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
                    {filteredNews[featuredIndex].is_fact_check_article ? (
                      <span className="prediction-badge fact-check">
                        <Check2 size={14} /> Fact-Check Article
                      </span>
                    ) : filteredNews[featuredIndex].prediction ? (
                      <span className="prediction-badge real">
                        <Check2 size={14} /> Verified Real
                      </span>
                    ) : (
                      <span className="prediction-badge fake">
                        <X size={14} /> Flagged Fake
                      </span>
                    )}
                    {filteredNews[featuredIndex].source_credibility && (
                      <span className={`credibility-badge ${filteredNews[featuredIndex].source_credibility.toLowerCase()}`}>
                        {filteredNews[featuredIndex].source_credibility === 'FACT_CHECKER' ? 'Fact Checker' : filteredNews[featuredIndex].source_credibility}
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
              {filteredNews.slice(trendyStartIndex, trendyNewsExpanded ? trendyStartIndex + 18 : trendyStartIndex + 6).map((news, index) => (
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
                      <span>Show More News ({Math.min(filteredNews.length - 7, 12)} more)</span>
                      <ChevronDown size={20} />
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* More News Grid */}
          {moreNews.length >= 3 && (
            <section className="featured-section">
              <div className="section-header">
                <h2 className="section-title">More News</h2>
                <div className="section-actions">
                  {moreNews.length > 3 && (
                    <div className="section-nav">
                      <button className="nav-arrow" onClick={handleMustSeePrev}><ArrowLeft size={16} /></button>
                      <button className="nav-arrow" onClick={handleMustSeeNext}><ArrowRight size={16} /></button>
                    </div>
                  )}
                  <button className="see-more-btn" onClick={() => navigate('/all-news')}>
                    See More
                  </button>
                </div>
              </div>
              
              <div className="news-grid">
                {moreNews.slice(moreNewsStartIndex, moreNewsStartIndex + 3).map((news, index) => (
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
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                    {news.is_fact_check_article ? (
                      <span className="verification-badge fact-check">✓ Fact-Check</span>
                    ) : news.prediction ? (
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
