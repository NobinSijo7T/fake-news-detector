import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'FakeNewsDetectorAPI.settings')
django.setup()

from core.livenews.models import LiveNews

print("\n=== Recent News Articles ===\n")
news = LiveNews.objects.order_by('-id')[:5]

for n in news:
    print(f"Title: {n.title[:60]}")
    print(f"Image URL: {n.img_url}")
    print(f"Section: {n.section_name}")
    print("-" * 80)
