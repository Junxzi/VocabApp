# VocabMaster API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

現在の Web 版では認証は不要。将来的に JWT 認証を追加予定。

## Data Models

### VocabularyWord

```typescript
interface VocabularyWord {
  id: number;
  word: string;
  definition: string;
  pronunciationUs: string;
  pronunciationUk: string;
  pronunciationAu: string;
  partOfSpeech: string;
  exampleSentences: string; // JSON string containing array of {english, japanese}
  tags: string[] | null;
  difficulty: number; // 1-4
  easeFactor: number; // Spaced repetition factor
  interval: number; // Days until next review
  nextReview: string | null; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
```

### Category

```typescript
interface Category {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### DailyChallengeStatus

```typescript
interface DailyChallengeStatus {
  completed: boolean;
  date: string; // YYYY-MM-DD format
  stats?: {
    totalWords: number;
    correctWords: number;
    accuracy: string; // Percentage as string
    completedAt: string; // ISO date string
  };
}
```

## API Endpoints

### Vocabulary Management

#### Get All Vocabulary Words

```http
GET /vocabulary
```

**Response:**

```json
[
  {
    "id": 1,
    "word": "example",
    "definition": "例、実例",
    "pronunciationUs": "/ɪɡˈzæmpəl/",
    "pronunciationUk": "/ɪɡˈzɑːmpəl/",
    "pronunciationAu": "/ɪɡˈzæmpəl/",
    "partOfSpeech": "noun",
    "exampleSentences": "[{\"english\":\"This is an example sentence.\",\"japanese\":\"これは例文です。\"}]",
    "tags": ["basic", "common"],
    "difficulty": 2,
    "easeFactor": 2.5,
    "interval": 1,
    "nextReview": "2025-06-20T00:00:00.000Z",
    "createdAt": "2025-06-19T00:00:00.000Z",
    "updatedAt": "2025-06-19T00:00:00.000Z"
  }
]
```

#### Get Single Vocabulary Word

```http
GET /vocabulary/:id
```

**Parameters:**

- `id` (number): Word ID

**Response:**

```json
{
  "id": 1,
  "word": "example"
  // ... same structure as above
}
```

#### Create Vocabulary Word

```http
POST /vocabulary
```

**Request Body:**

```json
{
  "word": "example",
  "definition": "例、実例",
  "pronunciationUs": "/ɪɡˈzæmpəl/",
  "pronunciationUk": "/ɪɡˈzɑːmpəl/",
  "pronunciationAu": "/ɪɡˈzæmpəl/",
  "partOfSpeech": "noun",
  "exampleSentences": "[{\"english\":\"This is an example.\",\"japanese\":\"これは例です。\"}]",
  "tags": ["basic", "common"],
  "difficulty": 2
}
```

**Response:**

```json
{
  "id": 1,
  "word": "example"
  // ... full word object
}
```

#### Update Vocabulary Word

```http
PUT /vocabulary/:id
```

**Parameters:**

- `id` (number): Word ID

**Request Body:** Same as create, all fields optional

**Response:** Updated word object

#### Delete Vocabulary Word

```http
DELETE /vocabulary/:id
```

**Parameters:**

- `id` (number): Word ID

**Response:**

```json
{
  "success": true
}
```

### Study Modes

#### Get Random Words for Study

```http
GET /vocabulary/random/:count
```

**Parameters:**

- `count` (number): Number of words to return (default: 30)

**Response:** Array of VocabularyWord objects

#### Get Words by Tag

```http
GET /vocabulary/tag/:tag
```

**Parameters:**

- `tag` (string): Tag name

**Response:** Array of VocabularyWord objects

#### Get Daily Challenge Words

```http
GET /vocabulary/daily-challenge
```

**Description:** Returns 30 words for today's challenge. Same words returned for same date.

**Response:** Array of VocabularyWord objects (always 30 items)

#### Get Daily Challenge Status

```http
GET /vocabulary/daily-challenge/status
```

**Response:**

```json
{
  "completed": false,
  "date": "2025-06-19"
}
```

OR if completed:

```json
{
  "completed": true,
  "date": "2025-06-19",
  "stats": {
    "totalWords": 30,
    "correctWords": 25,
    "accuracy": "83.33",
    "completedAt": "2025-06-19T10:30:00.000Z"
  }
}
```

#### Complete Daily Challenge

```http
POST /vocabulary/daily-challenge/complete
```

**Request Body:**

```json
{
  "totalWords": 30,
  "correctWords": 25,
  "accuracy": 83.33
}
```

**Response:**

```json
{
  "success": true
}
```

### Spaced Repetition

#### Update Word Spaced Repetition Data

```http
PUT /vocabulary/:id/spaced-repetition
```

**Parameters:**

- `id` (number): Word ID

**Request Body:**

```json
{
  "known": true
}
```

**Description:** Updates spaced repetition data based on whether user knew the word

**Response:** Updated VocabularyWord object

#### Get Words Due for Review

```http
GET /vocabulary/review/:limit?
```

**Parameters:**

- `limit` (number, optional): Maximum number of words to return

**Response:** Array of VocabularyWord objects due for review

### Categories

#### Get All Categories

```http
GET /categories
```

**Response:**

```json
[
  {
    "id": 1,
    "name": "Academic",
    "displayName": "学術",
    "description": "Academic and scholarly vocabulary",
    "createdAt": "2025-06-19T00:00:00.000Z",
    "updatedAt": "2025-06-19T00:00:00.000Z"
  }
]
```

#### Get Vocabulary Words by Category

```http
GET /vocabulary/category/:categoryName
```

**Parameters:**

- `categoryName` (string): Category name

**Response:** Array of VocabularyWord objects

### Search and Filtering

#### Search Vocabulary Words

```http
GET /vocabulary/search?q=:query
```

**Parameters:**

- `q` (string): Search query

**Response:** Array of VocabularyWord objects matching the query

#### Get Available Tags

```http
GET /vocabulary/tags
```

**Response:**

```json
["academic", "business", "daily", "technical", "toefl"]
```

### Audio Configuration

#### Get Azure TTS Configuration

```http
GET /azure-config
```

**Response:**

```json
{
  "speechKey": "your-api-key",
  "speechRegion": "japaneast"
}
```

### Word Generation (AI)

#### Generate Words for Category

```http
POST /vocabulary/generate
```

**Request Body:**

```json
{
  "category": "business",
  "count": 10
}
```

**Response:**

```json
{
  "words": [
    {
      "word": "entrepreneur",
      "definition": "起業家",
      "category": "business"
    }
  ]
}
```

#### Generate Words with Full Data (Gacha)

```http
POST /vocabulary/gacha
```

**Request Body:**

```json
{
  "tagName": "business",
  "count": 30
}
```

**Response:**

```json
{
  "words": [
    {
      "word": "entrepreneur",
      "definition": "起業家、企業家",
      "pronunciationUs": "/ˌɑːntrəprəˈnɜːr/",
      "pronunciationUk": "/ˌɒntrəprəˈnɜːr/",
      "pronunciationAu": "/ˌɒntrəprəˈnɜːr/",
      "partOfSpeech": "noun",
      "exampleSentences": [
        {
          "english": "She is a successful entrepreneur.",
          "japanese": "彼女は成功した起業家です。"
        }
      ]
    }
  ]
}
```

## Error Responses

### Standard Error Format

```json
{
  "message": "Error description",
  "error": "Detailed error information"
}
```

### Common HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

### Example Error Responses

#### 404 Not Found

```json
{
  "message": "Vocabulary word not found"
}
```

#### 400 Bad Request

```json
{
  "message": "Known must be a boolean value"
}
```

#### 500 Internal Server Error

```json
{
  "message": "Failed to fetch vocabulary words",
  "error": "Database connection failed"
}
```

## Rate Limiting

現在は実装されていないが、将来的に以下の制限を追加予定：

- 一般 API: 100 requests/minute
- 音声生成: 50 requests/minute
- AI 生成: 10 requests/minute

## Data Validation

### Word Creation/Update

- `word`: Required, 1-100 characters
- `definition`: Required, 1-500 characters
- `pronunciationUs/Uk/Au`: Optional, valid IPA format
- `partOfSpeech`: Optional, predefined values
- `tags`: Optional, array of strings
- `difficulty`: Optional, integer 1-4

### Spaced Repetition Update

- `known`: Required boolean

### Daily Challenge Completion

- `totalWords`: Required positive integer
- `correctWords`: Required non-negative integer ≤ totalWords
- `accuracy`: Required number 0-100

## Database Schema

### vocabulary_words table

```sql
CREATE TABLE vocabulary_words (
  id SERIAL PRIMARY KEY,
  word VARCHAR(255) NOT NULL,
  definition TEXT NOT NULL,
  pronunciation_us VARCHAR(255),
  pronunciation_uk VARCHAR(255),
  pronunciation_au VARCHAR(255),
  part_of_speech VARCHAR(100),
  example_sentences TEXT,
  tags TEXT[],
  difficulty INTEGER DEFAULT 2,
  ease_factor DECIMAL(3,2) DEFAULT 2.5,
  interval INTEGER DEFAULT 1,
  next_review TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### daily_challenges table

```sql
CREATE TABLE daily_challenges (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  completed_at TIMESTAMP,
  total_words INTEGER,
  correct_words INTEGER,
  accuracy VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### categories table

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Notes

### Frontend Integration

React Native アプリでの実装時は以下を考慮：

1. **Network Layer**

   ```typescript
   const API_BASE_URL = 'http://localhost:5000/api';

   class VocabularyService {
     async getAll(): Promise<VocabularyWord[]> {
       const response = await fetch(`${API_BASE_URL}/vocabulary`);
       return response.json();
     }
   }
   ```

2. **Error Handling**

   ```typescript
   try {
     const words = await vocabularyService.getAll();
   } catch (error) {
     console.error('Failed to fetch words:', error);
     // Show user-friendly error message
   }
   ```

3. **Caching Strategy**

   - React Query for server state management
   - AsyncStorage for offline caching
   - Optimistic updates for better UX

4. **Real-time Updates**
   - WebSocket connection for live updates (future feature)
   - Background sync for offline-first experience

この包括的な API 仕様書により、React Native 開発者は完全に Web 版と同等の機能を実装できます。
