# Quick Reference: Source Credibility & Fact-Check Features

## API Endpoints

### Get Live News (with credibility info)
```bash
GET http://127.0.0.1:8000/api/live/
```

**Response includes:**
- `source_credibility`: "HIGH", "MEDIUM", "LOW", "FACT_CHECKER", or "UNKNOWN"
- `is_fact_check_article`: true/false
- `fact_check_verdict`: "TRUE", "FALSE", "PARTIALLY_TRUE", or "FACT_CHECK"
- `source_domain`: extracted domain from URL

### Manual Refresh (fetches from all sources including AltNews)
```bash
GET http://127.0.0.1:8000/api/refresh/
```

### India News (includes AltNews)
```bash
GET http://127.0.0.1:8000/api/india-news/
```

## Frontend Badge System

### Badge Types

1. **Verification Badges**
   - ✓ Verified (Green) - News predicted as real
   - ✗ Flagged (Red) - News predicted as fake
   - ✓ Fact-Check (Blue) - Fact-checking article

2. **Credibility Badges** (Small indicators)
   - H (Green) - High credibility source
   - M (Yellow) - Medium credibility source
   - L (Orange) - Low credibility source
   - FC (Blue) - Fact-checker organization

## Source Credibility Lists

### Fact-Checking Organizations (FACT_CHECKER)
```python
- altnews.in
- factcheck.afp.com
- thequint.com/news/webqoof
- boomlive.in
- newschecker.in
- vishvasnews.com
- indiatoday.in/fact-check
- factly.in
- reuters.com/fact-check
- apnews.com/ap-fact-check
- snopes.com
- fullfact.org
- politifact.com
```

### High Credibility Sources (HIGH)
```python
- theguardian.com
- bbc.com / bbc.co.uk
- reuters.com
- apnews.com
- thehindu.com
- thehindubusinessline.com
- ndtv.com
- indianexpress.com
- timesofindia.indiatimes.com
- scroll.in
- thewire.in
- news.google.com
```

### Medium Credibility Sources (MEDIUM)
```python
- hindustantimes.com
- zeenews.india.com
- dnaindia.com
- news18.com
- republicworld.com
- aninews.in
- onmanorama.com
```

## How Predictions Work

### Multi-Factor Decision Process

1. **ML Model Analysis**
   - Traditional Naive Bayes prediction on article title
   - Returns: True (real) or False (fake)

2. **Source Credibility Check**
   - Extract domain from URL
   - Classify source credibility level
   - Detect if it's a fact-checking article

3. **Final Decision Logic**
   ```python
   if is_fact_check_article:
       return True  # Fact-check articles are legitimate
   elif source_credibility == 'HIGH' and ml_prediction == False:
       return True  # Trust high-credibility sources
   elif source_credibility == 'FACT_CHECKER':
       return True  # Trust fact-checking organizations
   else:
       return ml_prediction  # Use ML prediction
   ```

4. **Reasoning Captured**
   - System logs why each decision was made
   - Helps with debugging and transparency

## Example News Flow

### AltNews Article
```
1. Fetched from: https://www.altnews.in/feed/
2. Title: "False claim about vaccine debunked"
3. ML Prediction: False (might flag as fake)
4. Domain: altnews.in
5. Source Credibility: FACT_CHECKER
6. Is Fact-Check: True
7. Verdict: FALSE (the claim being debunked is false)
8. Final Prediction: True (the article itself is legitimate)
9. Badge: "Fact-Check" (Blue)
```

### Guardian Article
```
1. Fetched from: Guardian API
2. Title: "Climate summit reaches agreement"
3. ML Prediction: True
4. Domain: theguardian.com
5. Source Credibility: HIGH
6. Is Fact-Check: False
7. Final Prediction: True
8. Badge: "Verified" (Green) + "H" (High credibility)
```

### Unknown Source
```
1. Fetched from: unknown-blog.com
2. Title: "Breaking news alert"
3. ML Prediction: False
4. Domain: unknown-blog.com
5. Source Credibility: UNKNOWN
6. Is Fact-Check: False
7. Final Prediction: False (trust ML)
8. Badge: "Flagged" (Red)
```

## CSS Classes Reference

### Prediction Badges
```css
.prediction-badge.real      /* Green - verified news */
.prediction-badge.fake      /* Red - flagged news */
.prediction-badge.fact-check /* Blue - fact-checking article */
```

### Credibility Badges
```css
.credibility-badge.high          /* Green - high credibility */
.credibility-badge.medium        /* Yellow - medium credibility */
.credibility-badge.low           /* Orange - low credibility */
.credibility-badge.fact-checker  /* Blue - fact-checker */
.credibility-badge.unknown       /* Gray - unknown */
```

## Database Schema

### LiveNews Model Fields
```python
# Original Fields
title = CharField(max_length=2000)
publication_date = DateTimeField()
news_category = CharField(max_length=200)
prediction = BooleanField(default=True)
section_id = CharField(max_length=200)
section_name = CharField(max_length=200)
type = CharField(max_length=200)
web_url = CharField(max_length=600)
img_url = CharField(max_length=600)

# New Fields (Added in migration 0005)
source_credibility = CharField(max_length=50, default='UNKNOWN')
is_fact_check_article = BooleanField(default=False)
fact_check_verdict = CharField(max_length=100, blank=True, null=True)
source_domain = CharField(max_length=300, blank=True, null=True)
```

## Testing Commands

### Test Source Credibility
```bash
cd app/FakeNewsDetectorAPI
python manage.py shell
```
```python
from core.livenews.source_credibility import *

# Test credibility detection
print(get_source_credibility('https://www.altnews.in/article'))  # FACT_CHECKER
print(get_source_credibility('https://www.bbc.com/article'))      # HIGH
print(get_source_credibility('https://unknown.com/article'))      # UNKNOWN

# Test fact-check detection
is_fc, source, verdict = check_if_fact_check_article(
    'https://www.altnews.in/article',
    'False claim about election debunked'
)
print(f"Is Fact-Check: {is_fc}")  # True
print(f"Source: {source}")         # AltNews
print(f"Verdict: {verdict}")       # FALSE
```

### Fetch News with Credibility
```bash
curl http://127.0.0.1:8000/api/live/ | python -m json.tool
```

### Manual News Refresh
```bash
curl http://127.0.0.1:8000/api/refresh/
```

## Common Issues & Solutions

### Issue: AltNews articles not appearing
**Solution**: 
1. Check internet connection
2. Verify AltNews RSS feed is accessible: https://www.altnews.in/feed/
3. Check server logs for fetch errors

### Issue: All news showing as "UNKNOWN" credibility
**Solution**:
1. Verify source_credibility.py is imported correctly
2. Check database migration 0005 was applied
3. Refresh news to populate new fields

### Issue: Fact-check badge not displaying
**Solution**:
1. Verify CSS is loaded (check browser developer tools)
2. Check `is_fact_check_article` field in API response
3. Clear browser cache and reload

### Issue: High credibility sources flagged as fake
**Solution**:
1. Check if domain is in HIGH_CREDIBILITY_SOURCES list
2. Verify `should_trust_prediction()` function is called
3. Check server logs for reasoning

## Performance Considerations

### News Refresh Timing
- Auto-refresh: Every 5 minutes (300 seconds)
- Manual refresh: On-demand via UI button or API
- Frontend refresh: Every 30 seconds

### Source Limits
- Guardian API: 20 articles per fetch
- Times of India: 15 articles (10 per category)
- AltNews: 15 articles
- Total: ~50 articles per refresh

### Caching Strategy
- Database: All fetched articles cached
- Duplicate detection: By web_url
- Image placeholders: For failed image loads

## Monitoring & Logging

### Key Log Messages
```
"Fetched X articles from Guardian"
"Fetched X articles from Times of India"
"Fetched X fact-check articles from AltNews"
"Article: [title]"
"  ML Prediction: True/False, Source: HIGH/MEDIUM/etc."
"  Is Fact-Check: True/False, Final: True/False"
"  Reasoning: [why prediction was made]"
"✓ Saved: [article]"
```

### Error Indicators
```
"Failed to fetch X RSS: [status_code]"
"Error parsing item: [error]"
"Error saving article: [error]"
"❌ Error fetching news: [error]"
```
