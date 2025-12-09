"""
Meta 4 Scout + SerpAPI integration for enhanced news verification
"""
from groq import Groq
from serpapi import GoogleSearch
import os


class MetaNewsVerifier:
    """Uses Meta 4 Scout and SerpAPI to verify news authenticity"""
    
    def __init__(self):
        self.groq_api_key = os.getenv('GROQ_API_KEY', 'your-groq-api-key-here')
        self.serpapi_key = os.getenv('SERPAPI_KEY', 'your-serpapi-key-here')
        self.groq_client = Groq(api_key=self.groq_api_key)
    
    def search_news(self, query):
        """Search for news using SerpAPI"""
        try:
            params = {
                "engine": "google",
                "q": query,
                "api_key": self.serpapi_key,
                "tbm": "nws",  # News search
                "num": 5
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            
            news_results = results.get("news_results", [])
            
            if not news_results:
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
            return None, f"Search error: {str(e)}"
    
    def analyze_with_meta(self, user_news, search_results):
        """Analyze news using Meta 4 Scout model"""
        try:
            # Create context from search results
            context = "Search Results:\n"
            for idx, result in enumerate(search_results, 1):
                context += f"\n{idx}. {result['title']}\n"
                context += f"   Source: {result['source']}\n"
                context += f"   Snippet: {result['snippet']}\n"
            
            # Create prompt for the model
            prompt = f"""You are an expert news fact-checker. Analyze the following news claim against real search results.

News Claim: "{user_news}"

{context}

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
            
            return {
                "prediction": verdict == "TRUE",
                "verdict": verdict,
                "confidence": confidence,
                "detailed_analysis": response_text,
                "search_results": search_results
            }
            
        except Exception as e:
            return {
                "prediction": False,
                "verdict": "ERROR",
                "confidence": 0,
                "detailed_analysis": f"Error analyzing news: {str(e)}",
                "search_results": search_results
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
