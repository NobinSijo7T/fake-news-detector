"""
Meta 4 Scout + SerpAPI integration for enhanced news verification
"""
from groq import Groq
from serpapi import GoogleSearch
import os
import logging
import sys

# Add parent directory to path to import source_credibility module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from livenews.source_credibility import (
    get_source_credibility,
    check_if_fact_check_article,
    FACT_CHECKING_SOURCES,
    HIGH_CREDIBILITY_SOURCES
)

logger = logging.getLogger(__name__)


class MetaNewsVerifier:
    """Uses Meta 4 Scout and SerpAPI to verify news authenticity"""
    
    def __init__(self):
        self.groq_api_key = os.getenv('GROQ_API_KEY', 'your-groq-api-key-here')
        self.serpapi_key = os.getenv('SERPAPI_KEY', 'your-serpapi-key-here')
        self.groq_client = Groq(api_key=self.groq_api_key)
        
        logger.info(f"MetaNewsVerifier initialized. GROQ key present: {bool(self.groq_api_key and self.groq_api_key != 'your-groq-api-key-here')}")
        logger.info(f"SERPAPI key present: {bool(self.serpapi_key and self.serpapi_key != 'your-serpapi-key-here')}")
    
    def search_news(self, query):
        """Search for news using SerpAPI"""
        try:
            print(f"🔍 Searching for news: {query}")
            logger.info(f"Searching for news: {query}")
            
            params = {
                "engine": "google",
                "q": query,
                "api_key": self.serpapi_key,
                "tbm": "nws",  # News search
                "num": 5
            }
            
            print(f"📡 SerpAPI params: engine={params['engine']}, tbm={params['tbm']}, num={params['num']}")
            logger.info(f"SerpAPI params: engine={params['engine']}, tbm={params['tbm']}, num={params['num']}")
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            print(f"📦 SerpAPI raw response keys: {list(results.keys())}")
            logger.info(f"SerpAPI raw response keys: {list(results.keys())}")
            
            news_results = results.get("news_results", [])
            
            print(f"📰 Found {len(news_results)} news results")
            logger.info(f"Found {len(news_results)} news results")
            
            if not news_results:
                print("⚠️ No search results found")
                return None, "No search results found for this news."
                return None, "No search results found for this news."
                return None, "No search results found for this news."
            
            # Format search results for the model
            formatted_results = []
            for result in news_results[:5]:
                formatted_results.append({
                    "title": result.get("title", ""),
                    "source": result.get("source", ""),
                    "snippet": result.get("snippet", ""),
                    "link": result.get("link", "")
                })
            
            return formatted_results, None
            
        except Exception as e:
            logger.error(f"Search error: {str(e)}")
            return None, f"Search error: {str(e)}"
    
    def analyze_with_meta(self, user_news, search_results):
        """Analyze news using Meta 4 Scout model"""
        try:
            # Analyze source credibility from search results
            high_cred_sources = 0
            fact_check_sources = 0
            
            for result in search_results:
                link = result.get('link', '')
                credibility = get_source_credibility(link)
                if credibility == 'HIGH':
                    high_cred_sources += 1
                elif credibility == 'FACT_CHECKER':
                    fact_check_sources += 1
            
            # Create context from search results
            context = "Search Results:\n"
            for idx, result in enumerate(search_results, 1):
                link = result.get('link', '')
                credibility = get_source_credibility(link)
                is_fact_check, _, _ = check_if_fact_check_article(link, result.get('title', ''))
                
                context += f"\n{idx}. {result['title']}\n"
                context += f"   Source: {result['source']} (Credibility: {credibility})\n"
                if is_fact_check:
                    context += f"   [FACT-CHECK ARTICLE]\n"
                context += f"   Snippet: {result['snippet']}\n"
            
            # Create prompt for the model
            prompt = f"""You are an expert news fact-checker. Analyze the following news claim against real search results.

News Claim: "{user_news}"

{context}

IMPORTANT GUIDELINES:
1. Articles from fact-checking websites (like AltNews, BOOM, AFP Fact Check) are DEBUNKING fake news - they are TRUE articles about FALSE claims
2. High credibility sources (BBC, Reuters, The Guardian, etc.) are generally reliable
3. Look for consensus among multiple credible sources
4. Pay special attention to fact-check articles - they identify misinformation

Based on the search results above, provide:
1. A verdict: Is this claim TRUE, FALSE, or UNVERIFIABLE?
2. Your confidence level (0-100%)
3. A brief explanation (2-3 sentences)
4. Key supporting or contradicting facts from the search results

Format your response as:
VERDICT: [TRUE/FALSE/UNVERIFIABLE]
CONFIDENCE: [0-100]%
EXPLANATION: [Your explanation]
KEY FACTS: [Bullet points]"""

            # Call Meta 4 Scout model
            completion = self.groq_client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more factual responses
                max_completion_tokens=1024,
                top_p=1,
                stream=False,
                stop=None
            )
            
            response_text = completion.choices[0].message.content
            
            # Parse the response
            verdict = "UNVERIFIABLE"
            confidence = 50
            
            if "VERDICT:" in response_text:
                verdict_line = [line for line in response_text.split("\n") if "VERDICT:" in line][0]
                if "TRUE" in verdict_line and "FALSE" not in verdict_line:
                    verdict = "TRUE"
                elif "FALSE" in verdict_line:
                    verdict = "FALSE"
            
            if "CONFIDENCE:" in response_text:
                conf_line = [line for line in response_text.split("\n") if "CONFIDENCE:" in line][0]
                try:
                    confidence = int(''.join(filter(str.isdigit, conf_line)))
                except:
                    confidence = 50
            
            # Boost confidence if we have many high credibility sources
            if high_cred_sources >= 3:
                confidence = min(confidence + 10, 100)
            
            return {
                "prediction": verdict == "TRUE",
                "verdict": verdict,
                "confidence": confidence,
                "detailed_analysis": response_text,
                "search_results": search_results,
                "source_analysis": {
                    "high_credibility_sources": high_cred_sources,
                    "fact_check_sources": fact_check_sources
                }
            }
            
        except Exception as e:
            return {
                "prediction": False,
                "verdict": "ERROR",
                "confidence": 0,
                "detailed_analysis": f"Error analyzing news: {str(e)}",
                "search_results": search_results,
                "source_analysis": {
                    "high_credibility_sources": 0,
                    "fact_check_sources": 0
                }
            }
    
    def verify_news(self, user_news):
        """Main method to verify news"""
        # Step 1: Search for the news
        search_results, error = self.search_news(user_news)
        
        if error:
            return {
                "prediction": False,
                "verdict": "UNVERIFIABLE",
                "confidence": 0,
                "detailed_analysis": error,
                "search_results": []
            }
        
        # Step 2: Analyze with Meta model
        analysis = self.analyze_with_meta(user_news, search_results)
        
        return analysis
