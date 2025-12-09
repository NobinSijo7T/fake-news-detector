from django.db import models


class LiveNews(models.Model):
    """Creates model to store news get from an API
    and predicts in real life."""
    title = models.CharField(max_length=2000)
    publication_date = models.DateTimeField()
    news_category = models.CharField(max_length=200)
    prediction = models.BooleanField(default=True)
    section_id = models.CharField(max_length=200)
    section_name = models.CharField(max_length=200)
    type = models.CharField(max_length=200)
    web_url = models.CharField(max_length=600)
    img_url = models.CharField(max_length=600)
    
    # New fields for better fact-checking
    source_credibility = models.CharField(max_length=50, default='UNKNOWN')  # HIGH, MEDIUM, LOW, FACT_CHECKER, UNKNOWN
    is_fact_check_article = models.BooleanField(default=False)  # True if article is debunking fake news
    fact_check_verdict = models.CharField(max_length=100, blank=True, null=True)  # For fact-check articles
    source_domain = models.CharField(max_length=300, blank=True, null=True)  # Extract domain from URL

    def __str__(self):
        return self.title
