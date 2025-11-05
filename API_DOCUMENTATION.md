# API Documentation - Раскадровщик Курильщика

## Обзор

Все API endpoints реализованы как Vercel Serverless Functions в директории `/api`. Они работают как proxy между frontend и Google Gemini AI, скрывая API ключи и обрабатывая ошибки.

## Base URL

- **Production**: `https://raskadrovshik.vercel.app/api`
- **Local**: `/api` (работает только на deployed версии)

## Общие правила

### Request Headers
```http
Content-Type: application/json
```

### Response Format

Успешные ответы (200):
```json
{
  "images": [...],      // для генерации изображений
  "description": "...", // для генерации текста
  "editedImage": "..."  // для редактирования
}
```

Ошибки (400, 500):
```json
{
  "error": "Краткое описание ошибки",
  "details": "Детали от Gemini API или internal error"
}
```

## Endpoints

---

## POST /api/generate-storyboards

Генерирует 4 варианта раскадровки из исходного эскиза с применением выбранного стиля.

### Request Body

```typescript
{
  prompt: string;        // Текстовое описание сцены
  image: {
    base64: string;      // Base64 без data URL prefix
    mimeType: string;    // "image/jpeg" или "image/png"
  };
  stylePrompt: string;   // Описание художественного стиля
}
```

### Example Request

```json
{
  "prompt": "Крупный план, рука старика сжимает компас. На фоне — размытый лес. Тревожный вечерний свет.",
  "image": {
    "base64": "/9j/4AAQSkZJRgABAQAA...",
    "mimeType": "image/jpeg"
  },
  "stylePrompt": "The style is a dynamic, expressive pencil sketch. Use a range of tonal values from light grays to deep blacks..."
}
```

### Response (200 OK)

```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
  ]
}
```

### Errors

- **400 Bad Request**: Missing required fields или invalid image data
- **500 Internal Server Error**: Gemini API error

### Implementation Details

- Генерирует 4 изображения параллельно (`Promise.all`)
- Использует модель `gemini-2.5-flash-image`
- Timeout: 60 секунд
- Memory: 1024 MB
- Логирует размеры, время выполнения

### Console Logs

```
[generate-storyboards] Request received
[generate-storyboards] Params: { hasPrompt, hasImage, hasStylePrompt, imageSize }
[generate-storyboards] Starting generation of 4 images...
[generate-storyboards] Success! Generated 4 images in 23456ms
```

---

## POST /api/generate-description

Анализирует загруженный эскиз и генерирует текстовое описание композиции для использования как prompt.

### Request Body

```typescript
{
  image: {
    base64: string;      // Base64 без data URL prefix
    mimeType: string;    // "image/jpeg" или "image/png"
  }
}
```

### Example Request

```json
{
  "image": {
    "base64": "/9j/4AAQSkZJRgABAQAA...",
    "mimeType": "image/jpeg"
  }
}
```

### Response (200 OK)

```json
{
  "description": "A central circular object positioned above a horizontal base with vertical elements suggesting depth."
}
```

### Errors

- **400 Bad Request**: Invalid image data
- **500 Internal Server Error**: Gemini API error или no description generated

### Implementation Details

- Использует модель `gemini-2.5-flash` (текстовая)
- Специальный prompt для анализа композиции эскизов
- Возвращает краткое описание в 1-2 предложения

### Console Logs

```
[generate-description] Request received
[generate-description] Image size: 524288
[generate-description] Success! Description length: 127
```

---

## POST /api/edit-image

Редактирует существующее изображение согласно текстовой инструкции, сохраняя стиль.

### Request Body

```typescript
{
  originalImage: {
    base64: string;      // Base64 без data URL prefix
    mimeType: string;    // "image/jpeg" или "image/png"
  };
  editInstruction: string;  // Инструкция для редактирования
  stylePrompt: string;      // Описание стиля (для сохранения)
}
```

### Example Request

```json
{
  "originalImage": {
    "base64": "/9j/4AAQSkZJRgABAQAA...",
    "mimeType": "image/jpeg"
  },
  "editInstruction": "Добавь дым на заднем плане",
  "stylePrompt": "The style is a dynamic, expressive pencil sketch..."
}
```

### Response (200 OK)

```json
{
  "editedImage": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA..."
}
```

### Errors

- **400 Bad Request**: Missing required fields или invalid image data
- **500 Internal Server Error**: Gemini API error или no edited image data

### Implementation Details

- Использует модель `gemini-2.5-flash-image`
- Применяет инструкцию с сохранением исходного стиля
- Возвращает 1 отредактированное изображение

### Console Logs

```
[edit-image] Request received
[edit-image] Params: { hasImage, hasEditInstruction, hasStylePrompt, imageSize }
[edit-image] Success! Image edited
```

---

## Error Handling

### Frontend Error Handling (geminiService.ts)

Все запросы обрабатываются с детальным логированием:

```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: response.statusText }));
  console.error('[geminiService] API error:', {
    status: response.status,
    statusText: response.statusText,
    errorData
  });
  throw new Error(`API error (${response.status}): ${errorData.details || errorData.error}`);
}
```

### Backend Error Handling

Все serverless функции используют единый паттерн:

```typescript
try {
  // ... logic
  return res.status(200).json({ data });
} catch (error) {
  console.error("[endpoint] Error:", error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  return res.status(500).json({
    error: "Failed to ...",
    details: errorMessage
  });
}
```

## Rate Limits

### Vercel Limits (Free Tier)
- **Serverless invocations**: 100 GB-hours/month
- **Bandwidth**: 100 GB/month
- **Function timeout**: 60 seconds (configured)
- **Request body size**: 4.5 MB (hence image compression)

### Gemini API Limits
Зависят от вашего Google AI plan. Check: https://ai.google.dev/pricing

Типичные лимиты для free tier:
- **Requests per minute**: 15 RPM
- **Requests per day**: 1,500 RPD

## Security

### API Key Protection
- `GEMINI_API_KEY` хранится в Vercel Environment Variables
- Никогда не экспонится на frontend
- Serverless функции работают как proxy

### CORS
Configured in `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

## Testing

### Manual Testing with curl

```bash
# Test generate-description
curl -X POST https://raskadrovshik.vercel.app/api/generate-description \
  -H "Content-Type: application/json" \
  -d '{"image":{"base64":"...","mimeType":"image/jpeg"}}'

# Test with invalid data (should return 400)
curl -X POST https://raskadrovshik.vercel.app/api/generate-description \
  -H "Content-Type: application/json" \
  -d '{"test":"test"}'
```

### Vercel Logs

```bash
# Real-time logs
vercel logs https://raskadrovshik.vercel.app

# Inspect specific deployment
vercel inspect <deployment-url> --logs
```

## Performance

### Typical Response Times
- **generate-description**: 2-5 секунд
- **edit-image**: 5-10 секунд
- **generate-storyboards**: 15-30 секунд (4 изображения параллельно)

### Optimization Strategies
1. **Image compression** (client-side) - reduces payload size
2. **Parallel generation** - 4 images with Promise.all
3. **Increased timeout** - 60s для длинных операций
4. **Memory allocation** - 1024 MB для heavy AI operations

## Troubleshooting

### 413 Payload Too Large
**Причина**: Image size > 4.5 MB
**Решение**: Frontend автоматически сжимает до 1024px, JPEG 0.8

### 500 Internal Server Error
**Check**:
1. Vercel logs для serverless function errors
2. Browser console для API response details
3. Gemini API status: https://status.cloud.google.com/

### Timeout Errors
**Причина**: Gemini API медленно отвечает
**Решение**: Увеличен timeout до 60 секунд в vercel.json

### CORS Errors
**Check**: vercel.json headers configuration
**Verify**: Response headers contain CORS headers

## Monitoring

### Key Metrics to Monitor
- **Response times** (Vercel Analytics)
- **Error rates** по endpoint
- **Payload sizes** (image compression effectiveness)
- **Gemini API quota** usage

### Logging Strategy
Все endpoints логируют:
- Request received
- Parameter validation
- Processing start/end with duration
- Success/error with details

Format: `[endpoint-name] Message: details`
