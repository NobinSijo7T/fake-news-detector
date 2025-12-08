import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './header';
import { Check2, X, PlayCircle, ArrowLeft, ArrowRight, ChevronDown, ChevronUp } from 'react-bootstrap-icons';
import Axios from 'axios';

function Home() {
  document.title = 'News Guardian';
  let stage = 1;

  const [liveNewsData, setLiveNewsData] = useState([]);
  const [mustSeeNews, setMustSeeNews] = useState([]);
  const [allNews, setAllNews] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [darkMode, setDarkMode] = useState(false);
  const [trendyNewsExpanded, setTrendyNewsExpanded] = useState(false);
  const [mustSeeExpanded, setMustSeeExpanded] = useState(false);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [trendyStartIndex, setTrendyStartIndex] = useState(1);

  // Navigation handlers
  const handleFeaturedPrev = () => {
    setFeaturedIndex((prev) => (prev > 0 ? prev - 1 : liveNewsData.length - 1));
  };

  const handleFeaturedNext = () => {
    setFeaturedIndex((prev) => (prev < liveNewsData.length - 1 ? prev + 1 : 0));
  };

  const handleTrendyPrev = () => {
    setTrendyStartIndex((prev) => (prev > 1 ? prev - 3 : 1));
  };

  const handleTrendyNext = () => {
    const maxIndex = trendyNewsExpanded ? liveNewsData.length : Math.min(liveNewsData.length, 7);
    setTrendyStartIndex((prev) => (prev + 3 < maxIndex ? prev + 3 : 1));
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const categories = ['Sport', 'Lifestyle', 'Arts', 'News'];

  // Function to fetch live news data
  const fetchLiveNewsData = () => {
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
  };

  // Fetch initial live news data on component mount
  useEffect(() => {
    // Fetch immediately on mount
    fetchLiveNewsData();

    // Set up interval for auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchLiveNewsData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

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
            
            {liveNewsData.length > 0 && (
              <div className="hero-card">
                {liveNewsData[featuredIndex].img_url !== 'None' && (
                  <img 
                    src={liveNewsData[featuredIndex].img_url} 
                    alt={liveNewsData[featuredIndex].title}
                    className="hero-image"
                  />
                )}
                <div className="hero-overlay">
                  <span className="hero-category">
                    {liveNewsData[featuredIndex].section_name || 'News'}
                  </span>
                  <h1 className="hero-title">{liveNewsData[featuredIndex].title}</h1>
                  <div className="hero-meta">
                    <span>{new Date(liveNewsData[featuredIndex].publication_date).toLocaleDateString()}</span>
                    {liveNewsData[featuredIndex].prediction ? (
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
            )}
          </section>

          {/* Category Tabs */}
          <div className="category-tabs">
            <button 
              className={`category-tab ${activeCategory === 'All' ? 'active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              All
            </button>
            <button 
              className={`category-tab ${activeCategory === 'Football' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Football')}
            >
              Football
            </button>
            <button 
              className={`category-tab ${activeCategory === 'Cricket' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Cricket')}
            >
              Cricket
            </button>
            <button 
              className={`category-tab ${activeCategory === 'Rugby' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Rugby')}
            >
              Rugby
            </button>
            <button 
              className={`category-tab ${activeCategory === 'Tennis' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Tennis')}
            >
              Tennis
            </button>
            <button 
              className={`category-tab ${activeCategory === 'Golf' ? 'active' : ''}`}
              onClick={() => setActiveCategory('Golf')}
            >
              Golf
            </button>
          </div>

          {/* Trendy News Section */}
          <section className="trendy-section">
            <div className="section-header">
              <h2 className="section-title">Trendy News</h2>
              <div className="section-nav">
                <button className="nav-arrow" onClick={handleTrendyPrev}><ArrowLeft size={16} /></button>
                <button className="nav-arrow" onClick={handleTrendyNext}><ArrowRight size={16} /></button>
              </div>
            </div>
            
            <div className="news-grid">
              {liveNewsData.slice(trendyStartIndex, trendyNewsExpanded ? liveNewsData.length : trendyStartIndex + 6).map((news, index) => (
                <div key={index} className="news-card">
                  {news.img_url !== 'None' && (
                    <img 
                      src={news.img_url} 
                      alt={news.title}
                      className="news-card-image"
                    />
                  )}
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
            
            {liveNewsData.length > 7 && (
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
                      <span>Show More News ({liveNewsData.length - 7} more)</span>
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
                    {news.img_url !== 'None' && (
                      <img 
                        src={news.img_url} 
                        alt={news.title}
                        className="news-card-image"
                      />
                    )}
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
                {news.img_url !== 'None' && (
                  <img 
                    src={news.img_url} 
                    alt={news.title}
                    className="story-image"
                  />
                )}
                <div className="story-content">
                  <div className="story-category">
                    {news.section_name || 'News'} • {new Date(news.publication_date).toLocaleDateString()}
                  </div>
                  <h4 className="story-title">{news.title.substring(0, 80)}...</h4>
                  <div className="story-time">
                    {news.prediction ? (
                      <span style={{color: '#2E7D32', fontSize: '11px'}}>✓ Verified</span>
                    ) : (
                      <span style={{color: '#C62828', fontSize: '11px'}}>✗ Flagged</span>
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
