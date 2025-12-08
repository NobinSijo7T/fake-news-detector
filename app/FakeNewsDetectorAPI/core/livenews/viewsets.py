from rest_framework.response import Response
from rest_framework import viewsets, generics
from rest_framework import status
from rest_framework.views import APIView

import requests

from bs4 import BeautifulSoup

from .models import LiveNews
from .serializers import LiveNewsSerializer, LiveNewsDetailedSerializer
from core.model import load_models

import threading
import time
from datetime import datetime
import urllib.parse
from email.utils import parsedate_to_datetime

def get_google_news_india():
    """Fetch news from Google News India"""
    try:
        news_articles = []
        
        # Google News RSS feed for India
        rss_url = "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en"
        
        response = requests.get(rss_url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        if response.status_code != 200:
            print(f"Failed to fetch Google News India: {response.status_code}")
            return []
        
        # Try XML parser first, fallback to html.parser
        try:
            soup = BeautifulSoup(response.content, 'xml')
        except:
            soup = BeautifulSoup(response.content, 'html.parser')
            
        items = soup.find_all('item')[:20]  # Get top 20 items
        
        for item in items:
            try:
                title = item.find('title').get_text(strip=True) if item.find('title') else None
                link = item.find('link').get_text(strip=True) if item.find('link') else None
                pub_date_str = item.find('pubDate').get_text(strip=True) if item.find('pubDate') else None
                
                # Convert RFC 822 date to Django datetime format
                if pub_date_str:
                    try:
                        pub_date = parsedate_to_datetime(pub_date_str)
                        pub_date = pub_date.isoformat()
                    except:
                        pub_date = datetime.now().isoformat()
                else:
                    pub_date = datetime.now().isoformat()
                
                if not title or not link:
                    continue
                
                # Try to extract image from description (Google News includes image in HTML)
                img_url = "https://via.placeholder.com/400x300/FFE500/1a1a1a?text=India+News"
                
                description = item.find('description')
                if description:
                    # Parse the HTML content inside description
                    desc_html = str(description)
                    desc_soup = BeautifulSoup(desc_html, 'html.parser')
                    img_tag = desc_soup.find('img')
                    if img_tag:
                        img_src = img_tag.get('src') or img_tag.get('data-src')
                        if img_src and img_src.startswith('http'):
                            img_url = img_src
                            print(f"Found image: {img_url[:60]}...")
                
                news_articles.append({
                    'title': title,
                    'web_url': link,
                    'img_url': img_url,
                    'category': 'News',
                    'section_id': 'india-news',
                    'section_name': 'India News',
                    'publication_date': pub_date,
                    'type': 'article'
                })
                    
            except Exception as e:
                print(f"Error parsing Google News item: {e}")
                continue
        
        print(f"Fetched {len(news_articles)} articles from Google News India")
        return news_articles
        
    except Exception as e:
        print(f"Error fetching Google News India: {e}")
        return []

def get_times_of_india_news():
    """Fetch news from Times of India RSS feed"""
    try:
        news_articles = []
        
        # Times of India RSS feeds
        rss_feeds = [
            ('https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'Top Stories'),
            ('https://timesofindia.indiatimes.com/rssfeeds/1221656.cms', 'India News'),
        ]
        
        for rss_url, category in rss_feeds:
            try:
                print(f"Fetching from Times of India: {category}")
                response = requests.get(rss_url, timeout=10, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                
                if response.status_code != 200:
                    print(f"Failed to fetch TOI RSS: {response.status_code}")
                    continue
                
                soup = BeautifulSoup(response.content, 'xml')
                items = soup.find_all('item')[:10]
                
                for item in items:
                    try:
                        title = item.find('title')
                        title = title.get_text(strip=True) if title else None
                        
                        link = item.find('link')
                        link = link.get_text(strip=True) if link else None
                        
                        if not title or not link:
                            continue
                        
                        # Get publication date
                        pub_date = item.find('pubDate')
                        if pub_date:
                            try:
                                pub_date_dt = parsedate_to_datetime(pub_date.get_text(strip=True))
                                pub_date_str = pub_date_dt.isoformat()
                            except:
                                pub_date_str = datetime.now().isoformat()
                        else:
                            pub_date_str = datetime.now().isoformat()
                        
                        # Extract image from description or enclosure
                        img_url = "https://via.placeholder.com/400x300/FFE500/1a1a1a?text=Times+of+India"
                        
                        # Try enclosure tag first
                        enclosure = item.find('enclosure')
                        if enclosure and enclosure.get('url'):
                            img_url = enclosure['url']
                        else:
                            # Try description
                            description = item.find('description')
                            if description:
                                desc_html = str(description)
                                desc_soup = BeautifulSoup(desc_html, 'html.parser')
                                img_tag = desc_soup.find('img')
                                if img_tag:
                                    img_src = img_tag.get('src') or img_tag.get('data-src')
                                    if img_src and img_src.startswith('http'):
                                        img_url = img_src
                        
                        # Check for duplicates
                        if any(a['web_url'] == link for a in news_articles):
                            continue
                        
                        news_articles.append({
                            'title': title,
                            'web_url': link,
                            'img_url': img_url,
                            'category': category,
                            'section_id': 'toi-india',
                            'section_name': 'Times of India',
                            'publication_date': pub_date_str,
                            'type': 'article'
                        })
                        
                        print(f"Added TOI: {title[:50]}...")
                        
                    except Exception as e:
                        print(f"Error parsing TOI item: {e}")
                        continue
                
                # Limit total
                if len(news_articles) >= 15:
                    break
                    
            except Exception as e:
                print(f"Error fetching TOI RSS: {e}")
                continue
        
        print(f"Total Times of India articles fetched: {len(news_articles)}")
        return news_articles
        
    except Exception as e:
        print(f"Error in get_times_of_india_news: {e}")
        return []

def get_new_news_from_api_and_update():
    """Gets news from the guardian news using it's API and Onmanorama"""
    
    print("Fetching fresh news from sources...")
    articles_added = 0
    
    # Fetch from Guardian API
    try:
        news_data = requests.get("https://content.guardianapis.com/search?api-key=e705adff-ca49-414e-89e2-7edede919e2e&show-fields=thumbnail&page-size=20", timeout=10)
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
        print(f"Fetched {len(guardian_articles)} articles from Guardian")
    except Exception as e:
        print(f"Error fetching Guardian news: {e}")
        guardian_articles = []
    
    # Fetch from Times of India
    toi_articles = get_times_of_india_news()
    print(f"Fetched {len(toi_articles)} articles from Times of India")
    
    # Combine all articles
    all_articles = guardian_articles + toi_articles
    
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
                articles_added += 1
                print(f"Saved: {article_data['title'][:50]}...")
        except Exception as e:
            print(f"Error saving article: {e}")
            continue
    
    print(f"News refresh complete. Added {articles_added} new articles.")
    return articles_added

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
    
    def create(self, request):
        """Force refresh news from API sources."""
        try:
            print("Manual refresh triggered by user...")
            # Run the news fetch function
            articles_added = get_new_news_from_api_and_update()
            
            # Return updated news
            all_live_news = LiveNews.objects.filter(img_url__isnull=False).exclude(img_url='None').order_by('-id')[:30]
            serializer = LiveNewsDetailedSerializer(all_live_news, many=True)
            
            return Response({
                "message": f"News refreshed successfully. {articles_added} new articles added.",
                "count": len(all_live_news),
                "new_articles": articles_added,
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Error in manual refresh: {str(e)}")
            return Response({
                "error": f"Failed to refresh news: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LiveNewsByCategory(viewsets.ViewSet):
    def list(self, request, category=None):
        if category is not None:
            live_news = LiveNews.objects.filter(news_category=category, img_url__isnull=False).exclude(img_url='None').order_by('-id')[:30]
            serializer = LiveNewsDetailedSerializer(live_news, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Category not provided in the URL'}, status=status.HTTP_400_BAD_REQUEST)


class RefreshNewsView(APIView):
    """Dedicated endpoint to force refresh news from external sources"""
    
    def get(self, request):
        """Handle GET request to refresh news"""
        try:
            print("=" * 60)
            print("MANUAL NEWS REFRESH TRIGGERED")
            print("=" * 60)
            
            # Run the news fetch function
            articles_added = get_new_news_from_api_and_update()
            
            # Return updated news
            all_live_news = LiveNews.objects.filter(img_url__isnull=False).exclude(img_url='None').order_by('-id')[:30]
            serializer = LiveNewsDetailedSerializer(all_live_news, many=True)
            
            response_data = {
                "success": True,
                "message": f"News refreshed successfully. {articles_added} new articles added.",
                "count": len(all_live_news),
                "new_articles": articles_added,
                "data": serializer.data
            }
            
            print(f"✓ Refresh completed: {articles_added} new articles")
            print("=" * 60)
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"✗ Error in manual refresh: {str(e)}")
            print("=" * 60)
            return Response({
                "success": False,
                "error": f"Failed to refresh news: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class IndiaNewsView(APIView):
    """Dedicated endpoint to fetch India-specific news from Google News India and Times of India"""
    
    def get(self, request):
        """Handle GET request to fetch India news"""
        try:
            print("=" * 60)
            print("FETCHING INDIA NEWS FROM GOOGLE NEWS & TIMES OF INDIA")
            print("=" * 60)
            
            articles_added = 0
            
            # Fetch from Google News India
            google_news_articles = get_google_news_india()
            print(f"Fetched {len(google_news_articles)} from Google News India")
            
            # Fetch from Times of India
            toi_articles = get_times_of_india_news()
            print(f"Fetched {len(toi_articles)} from Times of India")
            
            # Combine articles
            all_articles = google_news_articles + toi_articles
            
            # Load ML models
            nb_model, vect_model = load_models()
            
            # Save articles to database
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
                        articles_added += 1
                        print(f"Saved: {article_data['title'][:50]}...")
                except Exception as e:
                    print(f"Error saving article: {e}")
                    continue
            
            # Return India-specific news
            india_news = LiveNews.objects.filter(
                img_url__isnull=False
            ).exclude(img_url='None').filter(
                section_id__icontains='india'
            ).order_by('-id')[:50]
            
            # If not enough India-specific news, get all recent news
            if india_news.count() < 10:
                india_news = LiveNews.objects.filter(
                    img_url__isnull=False
                ).exclude(img_url='None').order_by('-id')[:30]
            
            serializer = LiveNewsDetailedSerializer(india_news, many=True)
            
            response_data = {
                "success": True,
                "message": f"India news fetched successfully. {articles_added} new articles added.",
                "count": len(serializer.data),
                "new_articles": articles_added,
                "data": serializer.data
            }
            
            print(f"✓ India news fetch completed: {articles_added} new articles")
            print("=" * 60)
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"✗ Error fetching India news: {str(e)}")
            print("=" * 60)
            return Response({
                "success": False,
                "error": f"Failed to fetch India news: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)