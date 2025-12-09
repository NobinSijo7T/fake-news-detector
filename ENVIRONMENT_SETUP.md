# Environment Setup

## API Keys Configuration

This project uses Meta 4 Scout AI and SerpAPI for advanced news verification. You'll need to set up your API keys:

### Step 1: Get Your API Keys

1. **Groq API Key** (for Meta 4 Scout AI):
   - Visit: https://console.groq.com
   - Create an account and generate an API key

2. **SerpAPI Key** (for Google News Search):
   - Visit: https://serpapi.com
   - Sign up and get your free API key

### Step 2: Configure Environment Variables

1. Navigate to the backend directory:
   ```bash
   cd app/FakeNewsDetectorAPI
   ```

2. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

3. Open `.env` and add your actual API keys:
   ```
   GROQ_API_KEY=your-actual-groq-api-key-here
   SERPAPI_KEY=your-actual-serpapi-key-here
   ```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Important Notes

- **Never commit the `.env` file** to version control
- The `.env` file is already in `.gitignore`
- Always use `.env.example` as a template for team members

### Security

- Keep your API keys private
- Rotate keys regularly
- Never hardcode API keys in source code
