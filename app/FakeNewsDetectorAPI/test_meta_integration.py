import os
import sys

# Add the parent directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

print("=" * 60)
print("Testing Meta 4 Scout + SerpAPI Integration")
print("=" * 60)

# Check environment variables
groq_key = os.getenv('GROQ_API_KEY')
serp_key = os.getenv('SERPAPI_KEY')

print(f"\n1. Environment Variables Check:")
print(f"   GROQ_API_KEY: {'✓ Loaded' if groq_key and groq_key != 'your-groq-api-key-here' else '✗ Missing'}")
print(f"   SERPAPI_KEY: {'✓ Loaded' if serp_key and serp_key != 'your-serpapi-key-here' else '✗ Missing'}")

if not groq_key or groq_key == 'your-groq-api-key-here':
    print("\n❌ ERROR: GROQ_API_KEY not found or invalid!")
    print("   Please check your .env file")
    sys.exit(1)

if not serp_key or serp_key == 'your-serpapi-key-here':
    print("\n❌ ERROR: SERPAPI_KEY not found or invalid!")
    print("   Please check your .env file")
    sys.exit(1)

# Test the Meta model
print(f"\n2. Testing MetaNewsVerifier class...")
try:
    from core.usercheckbytitle.meta_model import MetaNewsVerifier
    verifier = MetaNewsVerifier()
    print("   ✓ MetaNewsVerifier initialized successfully")
except Exception as e:
    print(f"   ✗ Error initializing MetaNewsVerifier: {e}")
    sys.exit(1)

# Test with a simple news query
print(f"\n3. Testing news verification...")
test_news = "Scientists discover water on Mars"
print(f"   Testing query: '{test_news}'")

try:
    result = verifier.verify_news(test_news)
    print(f"\n   Results:")
    print(f"   - Prediction: {result.get('prediction')}")
    print(f"   - Verdict: {result.get('verdict')}")
    print(f"   - Confidence: {result.get('confidence')}%")
    print(f"   - Search Results: {len(result.get('search_results', []))} articles found")
    
    if result.get('verdict') != 'ERROR':
        print(f"\n   ✓ Meta model working correctly!")
        print(f"\n   Sample Analysis:")
        analysis = result.get('detailed_analysis', '')
        print(f"   {analysis[:200]}..." if len(analysis) > 200 else f"   {analysis}")
    else:
        print(f"\n   ✗ Error in verification: {result.get('detailed_analysis')}")
        
except Exception as e:
    print(f"\n   ✗ Error during verification: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n" + "=" * 60)
print("Test completed successfully!")
print("=" * 60)
