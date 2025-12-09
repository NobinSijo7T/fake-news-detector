import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './header';
import { Container, Form, Button } from 'react-bootstrap';
import Axios from 'axios';
import { Check2, X, ArrowLeft } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom';


function CheckByTitle() {
  document.title = 'News Guardian | Check news by title';
  let stage = 2;
  const navigate = useNavigate();
  const [inputNewsTitle, setNewsTitle] = useState('');
  const [predictedValue, setPredictedValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [useMetaModel, setUseMetaModel] = useState(false);
  const [detailedAnalysis, setDetailedAnalysis] = useState(null);

  useEffect(() => {
    // Check for dark mode preference
    const isDark = document.body.classList.contains('dark-mode');
    setDarkMode(isDark);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setDetailedAnalysis(null);

    const dataToSend = {
      user_news: inputNewsTitle,
      use_meta_model: useMetaModel,
    };

    console.log('Sending data:', dataToSend);
    console.log('Use Meta Model:', useMetaModel);

    Axios.post('http://127.0.0.1:8000/api/usercheck/title/', dataToSend)
      .then((response) => {
        console.log('Response received:', response.data);
        
        if (useMetaModel) {
          // Handle Meta model response
          const { prediction, verdict, confidence, detailed_analysis, search_results } = response.data;
          
          console.log('Meta model response:', { prediction, verdict, confidence });
          
          setDetailedAnalysis({
            verdict,
            confidence,
            analysis: detailed_analysis,
            searchResults: search_results
          });
          
          if (prediction) {
            setPredictedValue('True');
            toast.success(`Real news! (Confidence: ${confidence}%)`);
          } else {
            setPredictedValue('False');
            toast.error(`Fake news! (Confidence: ${confidence}%)`, {icon: <X style={{color: 'white', backgroundColor: 'red'}}/>});
          }
        } else {
          // Handle traditional model response
          console.log('Traditional model response:', response.data);
          
          if (response.data.prediction === true) {
            setPredictedValue('True');
            toast.success("Real news!");
          } else {
            setPredictedValue('False');
            toast.error("Fake news!", {icon: <X style={{color: 'white', backgroundColor: 'red'}}/>});
          }
        }
      })
      .catch((error) => {
        console.error('Error submitting data: ', error);
        console.error('Error details:', error.response?.data);
        handleErrors();
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const length_error = () => toast.error('Enter some text!');

  const handleErrors = () => {
    if (inputNewsTitle.length < 1) {
      console.log(inputNewsTitle.length);
      length_error(); // Call length_error to display the length error toast
    }
  };

  return (
    <>
      <Header activeContainer={stage} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      
      <Container fluid="lg" className="check-by-title-container">
        <div className="back-button-container">
          <Button 
            variant="outline-primary" 
            className="back-to-home-btn"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} /> Back to Home
          </Button>
        </div>
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className='frm-opalq'>News Title</Form.Label>
            <Form.Control
              className='frm-moqpa'
              type="text"
              placeholder="Enter news title..."
              as="textarea"
              rows={5}
              onChange={(e) => setNewsTitle(e.target.value)}
            />
          </Form.Group>
          
          <Form.Group className="mb-3 model-toggle-switch">
            <div className="toggle-container">
              <Form.Check 
                type="switch"
                id="model-toggle"
                label={useMetaModel ? "Meta 4 Scout + SerpAPI (AI-Powered with Search)" : "Traditional ML Model (Fast)"}
                checked={useMetaModel}
                onChange={(e) => setUseMetaModel(e.target.checked)}
              />
            </div>
            <Form.Text className="text-muted toggle-description">
              {useMetaModel 
                ? "Uses advanced AI to search and verify news with real-time sources" 
                : "Uses traditional machine learning for quick predictions"}
            </Form.Text>
          </Form.Group>
          
          <Button variant="primary" type="submit" className='button-17'>
            {isLoading ? 'Checking...' : 'Check'}
          </Button>
        </Form>
      </Container>

      <Container className='prediction-result-container'>

        {predictedValue === 'True' ? (
            <div className='true'><div ><Check2 className='true-news-icon' /></div>Predicted as real news!</div>
        ) : predictedValue === 'False' ? (
            <div className='false'><div ><X className='fake-news-icon' /></div>Predicted as fake news!</div>
        ) : null}

      </Container>
      
      {detailedAnalysis && useMetaModel && detailedAnalysis.verdict && (
        <Container className='detailed-analysis-container' style={{ marginTop: '2rem', marginBottom: '3rem' }}>
          <div className="analysis-card">
            <div className="analysis-header">
              <h3>🔍 AI-Powered Analysis</h3>
              <p className="analysis-subtitle">Verified with real-time news sources</p>
            </div>
            
            <div className="analysis-content">
              <div className="verdict-badge-section">
                <div className={`verdict-badge verdict-${detailedAnalysis.verdict.toLowerCase()}`}>
                  <span className="verdict-icon">
                    {detailedAnalysis.verdict === 'TRUE' ? '✓' : detailedAnalysis.verdict === 'FALSE' ? '✗' : '?'}
                  </span>
                  <div className="verdict-text">
                    <div className="verdict-label">Verdict</div>
                    <div className="verdict-value">{detailedAnalysis.verdict}</div>
                  </div>
                </div>
                
                <div className="confidence-badge">
                  <div className="confidence-circle">
                    <svg className="confidence-svg" viewBox="0 0 36 36">
                      <path className="confidence-bg"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path className="confidence-progress"
                        strokeDasharray={`${detailedAnalysis.confidence}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <text x="18" y="20.35" className="confidence-percentage">{detailedAnalysis.confidence}%</text>
                    </svg>
                  </div>
                  <div className="confidence-label">Confidence</div>
                </div>
              </div>
              
              <div className="analysis-details">
                <div className="analysis-text">
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    {detailedAnalysis.analysis}
                  </pre>
                </div>
              </div>
              
              {detailedAnalysis.searchResults && detailedAnalysis.searchResults.length > 0 && (
                <div className="search-results-section">
                  <h5 className="sources-title">📰 Related News Sources:</h5>
                  <div className="search-results-grid">
                    {detailedAnalysis.searchResults.map((result, idx) => (
                      <div key={idx} className="source-card">
                        <div className="source-number">{idx + 1}</div>
                        <div className="source-content">
                          <h6 className="source-title">{result.title}</h6>
                          <div className="source-meta">
                            <span className="source-badge">{result.source}</span>
                          </div>
                          <p className="source-snippet">{result.snippet}</p>
                          <a href={result.link} target="_blank" rel="noopener noreferrer" className="source-link">
                            Read full article →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      )}

      <ToastContainer />
    </>
  );
}

export default CheckByTitle;
