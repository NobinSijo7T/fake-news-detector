from rest_framework.response import Response
from rest_framework import viewsets, generics
from rest_framework import status

import requests

from bs4 import BeautifulSoup

from .models import LiveNews
from .serializers import LiveNewsSerializer, LiveNewsDetailedSerializer
from core.model import load_models

import threading
import time
from datetime import datetime

def get_onmanorama_news():
    """Fetch news from Onmanorama website"""
    try:
        news_articles = []
        base_url = "https://www.onmanorama.com"
        
        # Fetch from different sections
        sections = [
            ('news', 'News'),
            ('sports', 'Sport'),
            ('entertainment', 'Lifestyle'),
            ('lifestyle', 'Lifestyle')
        ]
        
        for section_path, category in sections:
            try:
                url = f"{base_url}/{section_path}.html"
                response = requests.get(url, timeout=10)
                if response.status_code != 200:
                    continue
                    
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # Find article cards
                articles = soup.find_all('div', class_='storycontent')[:5]  # Get top 5 from each section
                
                for article in articles:
                    try:
                        # Extract title
                        title_elem = article.find('h2') or article.find('h3')
                        if not title_elem:
                            continue
                        title = title_elem.get_text(strip=True)
                        
                        # Extract URL
                        link_elem = article.find('a')
                        if not link_elem or not link_elem.get('href'):
                            continue
                        article_url = link_elem['href']
                        if not article_url.startswith('http'):
                            article_url = base_url + article_url
                        
                        # Extract image
                        img_elem = article.find('img')
                        img_url = "None"
                        if img_elem:
                            img_url = img_elem.get('data-src') or img_elem.get('src') or "None"
                            if img_url != "None" and not img_url.startswith('http'):
                                img_url = base_url + img_url
                        
                        # Skip if no image
                        if img_url == "None":
                            continue
                        
                        news_articles.append({
                            'title': title,
                            'web_url': article_url,
                            'img_url': img_url,
                            'category': category,
                            'section_id': section_path,
                            'section_name': category,
                            'publication_date': datetime.now().isoformat(),
                            'type': 'article'
                        })
                    except Exception as e:
                        print(f"Error parsing article: {e}")
                        continue
                        
            except Exception as e:
                print(f"Error fetching from {section_path}: {e}")
                continue
        
        return news_articles
    except Exception as e:
        print(f"Error in get_onmanorama_news: {e}")
        return []

def get_new_news_from_api_and_update():
    """Gets news from the guardian news using it's API and Onmanorama"""
    
    # Fetch from Guardian API
    try:
        news_data = requests.get("https://content.guardianapis.com/search?api-key=e705adff-ca49-414e-89e2-7edede919e2e&show-fields=thumbnail", timeout=10)
        news_data = news_data.json()

        guardian_articles = []
        for article in news_data["response"]["results"]:
            try:
                # Get thumbnail from fields
                img_url = article.get("fields", {}).get("thumbnail", "None")
                
                # If no thumbnail in API, try scraping
                if img_url == "None" or not img_url:
                    img_url = scrap_img_from_web(article["webUrl"])
                
                # Skip articles without images
                if img_url == "None":
                    continue
                
                guardian_articles.append({
                    'title': article["webTitle"],
                    'web_url': article["webUrl"],
                    'img_url': img_url,
                    'category': article.get("pillarName", "Undefined"),
                    'section_id': article["sectionId"],
                    'section_name': article["sectionName"],
                    'publication_date': article["webPublicationDate"],
                    'type': article["type"]
                })
            except Exception as e:
                print(f"Error processing Guardian article: {e}")
                continue
    except Exception as e:
        print(f"Error fetching Guardian news: {e}")
        guardian_articles = []
    
    # Fetch from Onmanorama
    onmanorama_articles = get_onmanorama_news()
    
    # Combine all articles
    all_articles = guardian_articles + onmanorama_articles
    
    nb_model, vect_model = load_models()

    for article_data in all_articles:
        try:
            web_url_ = article_data['web_url']
            
            if not LiveNews.objects.filter(web_url=web_url_).exists():
                
                vectorized_text = vect_model.transform([article_data['title']])
                prediction = nb_model.predict(vectorized_text)
                prediction_bool = True if prediction[0] == 1 else False
                
                news_article = LiveNews(
                    title=article_data['title'],
                    publication_date=article_data['publication_date'],
                    news_category=article_data['category'],
                    prediction=prediction_bool,
                    section_id=article_data['section_id'],
                    section_name=article_data['section_name'],
                    type=article_data['type'],
                    web_url=web_url_,
                    img_url=article_data['img_url']
                )

                news_article.save()
                print(f"Saved: {article_data['title'][:50]}...")
        except Exception as e:
            print(f"Error saving article: {e}")
            continue

def scrap_img_from_web(url):
    """Scrape image from Guardian article page"""
    try:
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            return "None"
        web_content = r.content
        soup = BeautifulSoup(web_content, 'html.parser')
        
        # Try different selectors for Guardian images
        img = soup.find('img', class_='dcr-evn1e9')
        if not img:
            img = soup.find('picture')
            if img:
                img = img.find('img')
        if not img:
            # Try meta tags
            meta_img = soup.find('meta', property='og:image')
            if meta_img:
                return meta_img.get('content', "None")
        
        if img:
            src = img.get("src") or img.get("data-src")
            if src:
                return src
        
        return "None"
    except Exception as e:
        print(f"Error scraping image from {url}: {e}")
        return "None"

def auto_refresh_news():
    """Auto refresh news periodically"""
    print("Starting initial news fetch...")
    get_new_news_from_api_and_update()
    
    interval = 300  # 5 minutes instead of 10 seconds for better performance
    while True:
        print("Auto-refreshing news...")
        get_new_news_from_api_and_update()
        time.sleep(interval)


auto_refresh_thread = threading.Thread(target=auto_refresh_news)
auto_refresh_thread.daemon = True
auto_refresh_thread.start()


class LiveNewsPrediction(viewsets.ViewSet):
    http_method_names = ('get', 'post', )

    def list(self, request):
        """Handles GET request by displaying all newly retrieved in database."""
        all_live_news = LiveNews.objects.filter(img_url__isnull=False).exclude(img_url='None').order_by('-id')[:30]

        serializer = LiveNewsDetailedSerializer(all_live_news, many=True)

        return Response(serializer.data, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        """Get's all data from a specific id in database."""
        try:
            news_prediction = LiveNews.objects.get(pk=pk)
        except LiveNews.DoesNotExist:
            return Response({"error": "News not found"}, status=404)
        
        serializer = LiveNewsDetailedSerializer(news_prediction)

        return Response(serializer.data, status=status.HTTP_200_OK)

class LiveNewsByCategory(viewsets.ViewSet):
    def list(self, request, category=None):
        if category is not None:
            live_news = LiveNews.objects.filter(news_category=category, img_url__isnull=False).exclude(img_url='None').order_by('-id')[:30]
            serializer = LiveNewsDetailedSerializer(live_news, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Category not provided in the URL'}, status=status.HTTP_400_BAD_REQUEST)