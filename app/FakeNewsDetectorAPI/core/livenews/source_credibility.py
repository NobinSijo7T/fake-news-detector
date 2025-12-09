"""
Source credibility checker for news verification
Determines the reliability of news sources and identifies fact-checking sites
"""

from urllib.parse import urlparse


# Define trusted news sources and fact-checking sites
FACT_CHECKING_SOURCES = {
    'altnews.in': 'AltNews',
    'factcheck.afp.com': 'AFP Fact Check',
    'thequint.com/news/webqoof': 'The Quint WebQoof',
    'boomlive.in': 'BOOM Live',
    'newschecker.in': 'Newschecker',
    'vishvasnews.com': 'Vishvas News',
    'indiatoday.in/fact-check': 'India Today Fact Check',
    'factly.in': 'Factly',
    'reuters.com/fact-check': 'Reuters Fact Check',
    'apnews.com/ap-fact-check': 'AP Fact Check',
    'snopes.com': 'Snopes',
    'fullfact.org': 'Full Fact',
    'politifact.com': 'PolitiFact',
}

# Highly credible news sources
HIGH_CREDIBILITY_SOURCES = {
    'theguardian.com': 'The Guardian',
    'bbc.com': 'BBC',
    'bbc.co.uk': 'BBC',
    'reuters.com': 'Reuters',
    'apnews.com': 'Associated Press',
    'thehindubusinessline.com': 'The Hindu Business Line',
    'thehindu.com': 'The Hindu',
    'ndtv.com': 'NDTV',
    'indianexpress.com': 'Indian Express',
    'timesofindia.indiatimes.com': 'Times of India',
    'scroll.in': 'Scroll',
    'thewire.in': 'The Wire',
    'news.google.com': 'Google News',
}

# Medium credibility sources (mainstream but may have bias)
MEDIUM_CREDIBILITY_SOURCES = {
    'hindustantimes.com': 'Hindustan Times',
    'zeenews.india.com': 'Zee News',
    'dnaindia.com': 'DNA India',
    'news18.com': 'News18',
    'republicworld.com': 'Republic World',
    'aninews.in': 'ANI',
    'onmanorama.com': 'Onmanorama',
}

def extract_domain(url):
    """Extract domain from URL"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        # Remove www. prefix
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    except:
        return None


def check_if_fact_check_article(url, title):
    """
    Check if an article is a fact-checking article
    Returns: (is_fact_check, source_name, verdict_from_title)
    """
    url_lower = url.lower()
    title_lower = title.lower()
    
    # Check if URL is from a fact-checking source
    domain = extract_domain(url)
    if domain:
        for fact_check_domain, source_name in FACT_CHECKING_SOURCES.items():
            if fact_check_domain in domain or domain in fact_check_domain:
                # Try to extract verdict from title
                verdict = extract_verdict_from_title(title)
                return True, source_name, verdict
    
    # Check if title contains fact-check keywords
    fact_check_keywords = [
        'fact check', 'fact-check', 'factcheck',
        'debunk', 'debunked', 'debunking',
        'fake news', 'misleading', 'false claim',
        'misinformation', 'disinformation',
        'fact checked', 'claim check', 'truth check',
        'viral claim', 'fake', 'hoax'
    ]
    
    if any(keyword in title_lower for keyword in fact_check_keywords):
        verdict = extract_verdict_from_title(title)
        return True, 'Unknown Fact Checker', verdict
    
    return False, None, None


def extract_verdict_from_title(title):
    """Extract fact-check verdict from article title"""
    title_lower = title.lower()
    
    # Common verdict indicators
    if any(word in title_lower for word in ['false', 'fake', 'hoax', 'misleading', 'fabricated']):
        return 'FALSE'
    elif any(word in title_lower for word in ['true', 'verified', 'confirmed', 'correct']):
        return 'TRUE'
    elif any(word in title_lower for word in ['partially', 'partly', 'mixed', 'incomplete']):
        return 'PARTIALLY_TRUE'
    else:
        return 'FACT_CHECK'


def get_source_credibility(url):
    """
    Determine source credibility level
    Returns: credibility_level (HIGH, MEDIUM, LOW, FACT_CHECKER, UNKNOWN)
    """
    domain = extract_domain(url)
    
    if not domain:
        return 'UNKNOWN'
    
    # Check if it's a fact-checking source
    for fact_check_domain in FACT_CHECKING_SOURCES.keys():
        if fact_check_domain in domain or domain in fact_check_domain:
            return 'FACT_CHECKER'
    
    # Check high credibility sources
    for high_cred_domain in HIGH_CREDIBILITY_SOURCES.keys():
        if high_cred_domain in domain or domain in high_cred_domain:
            return 'HIGH'
    
    # Check medium credibility sources
    for med_cred_domain in MEDIUM_CREDIBILITY_SOURCES.keys():
        if med_cred_domain in domain or domain in med_cred_domain:
            return 'MEDIUM'
    
    # Unknown source
    return 'UNKNOWN'


def should_trust_prediction(url, title, ml_prediction):
    """
    Decide whether to trust ML prediction based on source credibility
    Returns: (final_prediction, reasoning)
    """
    credibility = get_source_credibility(url)
    is_fact_check, fact_check_source, verdict = check_if_fact_check_article(url, title)
    
    # If it's a fact-checking article, it's about debunking fake news
    # So the article itself is TRUE, but it's discussing FALSE news
    if is_fact_check:
        return True, f"Fact-check article from {fact_check_source}"
    
    # High credibility sources are more likely to be true
    if credibility == 'HIGH' and ml_prediction == False:
        # If ML says false but source is highly credible, trust the source more
        return True, "High credibility source overrides ML prediction"
    
    # For fact-checkers (non fact-check articles), trust them
    if credibility == 'FACT_CHECKER':
        return True, "Trusted fact-checking organization"
    
    # Otherwise trust ML prediction
    return ml_prediction, "Based on ML prediction"
