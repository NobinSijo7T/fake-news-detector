import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from './header';
import { Container, Form, Button } from 'react-bootstrap';
import Axios from 'axios';
import { Check2, X } from 'react-bootstrap-icons';


function CheckByTitle() {
  document.title = 'News Guardian | Check news by title';
  let stage = 2;
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
        <Container className='detailed-analysis-container' style={{ marginTop: '2rem' }}>
          <div className="analysis-card">
            <h4>Detailed Analysis</h4>
            <div className="analysis-content">
              <div className="verdict-section">
                <strong>Verdict:</strong> <span className={`verdict-${detailedAnalysis.verdict.toLowerCase()}`}>{detailedAnalysis.verdict}</span>
              </div>
              <div className="confidence-section">
                <strong>Confidence:</strong> {detailedAnalysis.confidence}%
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${detailedAnalysis.confidence}%` }}
                  ></div>
                </div>
              </div>
              <div className="analysis-text">
                <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {detailedAnalysis.analysis}
                </pre>
              </div>
              {detailedAnalysis.searchResults && detailedAnalysis.searchResults.length > 0 && (
                <div className="search-results-section">
                  <h5>Related News Sources:</h5>
                  <ul className="search-results-list">
                    {detailedAnalysis.searchResults.map((result, idx) => (
                      <li key={idx}>
                        <strong>{result.title}</strong>
                        <br />
                        <small>Source: {result.source}</small>
                        <br />
                        <small>{result.snippet}</small>
                        <br />
                        <a href={result.link} target="_blank" rel="noopener noreferrer">Read more</a>
                      </li>
                    ))}
                  </ul>
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
