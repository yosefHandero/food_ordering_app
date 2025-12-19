# API Setup for Healthy Picks Feature

## Overview

The Healthy Picks feature requires a server-side API endpoint at `/api/recommendations` to handle OpenAI integration and protect API keys.

## Option 1: Expo Router API Routes (Web Only)

If you're deploying to web, Expo Router supports API routes. The file `app/api/recommendations.ts` should work automatically when deployed.

## Option 2: Separate Server (Recommended for Production)

For production or if API routes don't work, set up a separate server:

### Using Express/Node.js

1. Create a `server.js` file in the project root:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Import your recommendation handler
const { POST } = require('./app/api/recommendations');

app.post('/api/recommendations', async (req, res) => {
  const request = new Request('http://localhost/api/recommendations', {
    method: 'POST',
    body: JSON.stringify(req.body),
    headers: req.headers,
  });
  
  const response = await POST(request);
  const data = await response.json();
  res.status(response.status).json(data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

2. Update the API URL in `app/(tabs)/search.tsx`:

```typescript
const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/recommendations';
```

## Environment Variables

Add to `.env.local`:

```
OPENAI_API_KEY=your-openai-api-key-here
EXPO_PUBLIC_API_URL=http://localhost:3000  # If using separate server
```

## Testing

1. Start your server (if using Option 2)
2. Ensure `OPENAI_API_KEY` is set
3. Test the Healthy Picks feature in the app

