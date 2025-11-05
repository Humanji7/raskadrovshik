# Troubleshooting Guide - Раскадровщик Курильщика

## История решенных проблем

### Проблема #1: 413 Payload Too Large (Ноябрь 2025)

**Симптомы**:
- Ошибка "413 ошибка генерации апи еррор" при попытке сгенерировать раскадровку
- Работает с маленькими изображениями, не работает с большими
- Ошибка происходит сразу после нажатия "Создать шедевры"

**Причина**:
Vercel serverless функции имеют лимит **4.5 MB** на request body. Пользователи загружали большие изображения (например, скриншоты 5-10 MB), которые превышали этот лимит.

**Решение**:
Добавлено автоматическое сжатие изображений на клиенте в `components/ImageUploader.tsx`:

```typescript
const compressImage = (file: File): Promise<{ base64: string; mimeType: string; dataUrl: string }> => {
  // Сжатие до max 1024px по большей стороне
  // JPEG качество 0.8
  // Результат: ~10-20x меньше размер
}
```

**Commit**: `5017b7e` - "fix: добавлено автоматическое сжатие изображений"

**Verification**:
```javascript
// В browser console после загрузки изображения
[ImageUploader] Original size: 8388608 Compressed base64 length: 524288
```

---

### Проблема #2: Неинформативные сообщения об ошибках (Ноябрь 2025)

**Симптомы**:
- UI показывает только "Ошибка генерации. Проверь консоль"
- Пользователям непонятно, что именно пошло не так
- Нужно открывать DevTools чтобы увидеть детали

**Причина**:
Frontend код в `services/geminiService.ts` не читал response body при ошибках:

```typescript
// До исправления
if (!response.ok) {
  throw new Error(`API error: ${response.statusText}`); // Только статус!
}
```

**Решение**:
1. Чтение error details из response body:
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: response.statusText }));
  throw new Error(`API error (${response.status}): ${errorData.details || errorData.error}`);
}
```

2. Показ детальных ошибок в UI (`App.tsx`):
```typescript
catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
  setError(`Ошибка генерации: ${errorMessage}`);
}
```

**Commit**: `8b24bb2` - "feat: улучшенное логирование и обработка ошибок API"

---

### Проблема #3: Подозрение на VPN-блокировку (Ноябрь 2025)

**Симптомы**:
- У пользователя с VPN появлялись ошибки 403/404
- Предполагалось, что Gemini API блокирует VPN

**Расследование**:
1. Проверка архитектуры показала: Frontend → Vercel → Gemini API
2. Gemini видит IP **Vercel**, а не VPN пользователя
3. 403 ошибки не были от Gemini API
4. Реальная проблема: 413 Payload Too Large (см. Проблема #1)

**Вывод**:
VPN не влияет на работу приложения благодаря serverless архитектуре. Все запросы к Gemini идут с серверов Vercel.

---

### Проблема #4: API endpoints не работают локально (Ноябрь 2025)

**Симптомы**:
```bash
curl http://localhost:3000/api/generate-description
# → 404 Not Found
```

**Причина**:
Vite dev server (`npm run dev`) не обслуживает `/api` endpoints. Это Vercel serverless функции, которые работают только на deployed версии.

**Решение**:
Для локальной разработки API:
```bash
# Вариант 1: Vercel dev (эмулирует production)
vercel dev

# Вариант 2: Деплой и тестирование на preview
vercel
# → Preview URL для тестирования
```

**Рекомендация**:
Разрабатывать frontend локально (`npm run dev`), API тестировать на Vercel preview deployments.

---

## Текущие известные ограничения

### 1. Долгая генерация (15-30 секунд)

**Причина**: Gemini API генерирует 4 изображения, каждое ~5-8 секунд

**Mitigation**:
- Показывается loading spinner
- Timeout увеличен до 60 секунд
- Генерация происходит параллельно (Promise.all)

**Потенциальное улучшение**: Прогресс бар с индикацией количества готовых изображений

### 2. Только монохромные изображения

**Причина**: Storyboard концепция - это черновики для кино/анимации

**Design decision**: Цветные изображения отвлекают от композиции и светотени

### 3. Gemini 2.5 доступен не везде

**Регионы**: Модель `gemini-2.5-flash-image` работает в регионе `global`, не во всех странах

**Проверка доступности**: https://ai.google.dev/gemini-api/docs/models

---

## Частые ошибки и решения

### "Failed to load resource: the server responded with a status of 404"

**Причина**: Статические файлы (favicon, CSS) не найдены - обычно не критично

**Решение**: Проверить что файлы есть в `dist/` после build

---

### "API error (400): Unable to process input image"

**Причина**: Gemini API не может обработать изображение (corrupted или неподдерживаемый формат)

**Решение**:
1. Проверить что image сжимается правильно
2. Попробовать другое изображение
3. Проверить console logs для размера base64

---

### "API error (500): Failed to generate storyboards"

**Причина**: Internal error от Gemini API или network timeout

**Debugging**:
1. Проверить Vercel logs: `vercel logs https://raskadrovshik.vercel.app`
2. Проверить Gemini API status: https://status.cloud.google.com/
3. Проверить browser console для деталей ошибки

**Workaround**: Попробовать снова через 1-2 минуты

---

### "GEMINI_API_KEY environment variable not set"

**Причина**: Не установлена переменная окружения на Vercel

**Решение**:
1. Зайти в Vercel Dashboard → Project Settings → Environment Variables
2. Добавить `GEMINI_API_KEY` со значением вашего Google AI ключа
3. Redeploy: `vercel --prod`

---

### Timeout errors после 60 секунд

**Причина**: Gemini API не отвечает в течение timeout периода

**Возможные причины**:
- Gemini API перегружен
- Сетевые проблемы
- Слишком большой request

**Решение**:
1. Проверить что изображение сжато (<1 MB)
2. Уменьшить prompt (если очень длинный)
3. Попробовать позже

---

## Debugging Checklist

При возникновении проблемы, проверьте по порядку:

### 1. Browser Console (F12 → Console)
```javascript
// Ищите эти логи
[geminiService] Calling generate-storyboards API...
[ImageUploader] Original size: ... Compressed base64 length: ...
[geminiService] API error: { status, statusText, errorData }
```

### 2. Network Tab (F12 → Network)
```
- Найдите запрос к /api/generate-*
- Status Code: 200, 400, 413, 500?
- Response: прочитайте error details
- Request Payload: проверьте размер
```

### 3. Vercel Logs
```bash
vercel logs https://raskadrovshik.vercel.app
# Ищите [generate-*] логи
# Проверьте error stack traces
```

### 4. Vercel Dashboard
- Functions → Check invocations
- Deployments → Убедитесь что последний deploy successful
- Settings → Environment Variables → Проверьте GEMINI_API_KEY

### 5. Gemini API Status
- https://status.cloud.google.com/
- https://ai.google.dev/gemini-api/docs/models (проверить модель доступна)

---

## Performance Issues

### Медленная генерация (>45 секунд)

**Normal**: 15-30 секунд для 4 изображений

**Slow**: >45 секунд

**Debugging**:
```javascript
// В serverless logs смотрите
[generate-storyboards] Success! Generated 4 images in 45000ms
```

**Возможные причины**:
- Gemini API перегружен (peak hours)
- Большой prompt
- Сложная композиция эскиза

**Mitigation**:
- Simplify prompt
- Попробовать в другое время
- Проверить Gemini API status

---

### Высокий memory usage

**Check**: Vercel Dashboard → Functions → Memory Usage

**Normal**: <512 MB для большинства операций

**High**: >800 MB

**Причина**: Большие изображения в памяти

**Решение**: Image compression уже реализовано, должно помочь

---

## Error Codes Reference

### HTTP Status Codes

- **200 OK**: Успех
- **400 Bad Request**: Invalid request (missing fields, bad image data)
- **404 Not Found**: Endpoint не существует или static file
- **405 Method Not Allowed**: Использован GET instead of POST
- **413 Payload Too Large**: Image >4.5 MB (должно быть исправлено сжатием)
- **500 Internal Server Error**: Gemini API error или serverless function error
- **504 Gateway Timeout**: Timeout >60 секунд

### Gemini API Error Codes

- **400 INVALID_ARGUMENT**: Bad image data или unsupported format
- **403 PERMISSION_DENIED**: API key invalid или quota exceeded
- **403 RESOURCE_EXHAUSTED**: Rate limit exceeded
- **429 Too Many Requests**: Слишком много запросов
- **500 INTERNAL**: Gemini internal error
- **503 UNAVAILABLE**: Gemini temporarily unavailable

---

## Getting Help

### Logs для отчета об ошибке

Соберите:
1. **Browser console logs** (F12 → Console → скопируйте все)
2. **Network response** (F12 → Network → Response tab)
3. **Vercel logs**: `vercel logs https://raskadrovshik.vercel.app`
4. **Steps to reproduce**: что делали перед ошибкой
5. **Image info**: размер оригинала, формат

### Полезные команды

```bash
# Проверить deployment status
vercel ls

# Inspect конкретный deployment
vercel inspect <deployment-url>

# Tail logs в реальном времени
vercel logs https://raskadrovshik.vercel.app --follow

# Redeploy текущей версии
vercel --prod
```

---

## Preventive Maintenance

### Regular Checks

**Weekly**:
- Проверить Vercel invocation quota
- Проверить Gemini API usage quota
- Review error logs для новых паттернов

**Monthly**:
- Update dependencies: `npm update`
- Check Vercel changelog для breaking changes
- Review Gemini API updates: https://ai.google.dev/gemini-api/docs/changelog

### Monitoring Recommendations

Setup alerts для:
- Error rate >5% в последний час
- Average response time >40 секунд
- 413 errors (should be 0 после compression fix)
- Function timeout rate >1%

---

## Version History

- **v0.0.0** (Initial): Basic functionality
- **Nov 4, 2025**: Image compression fix (413 error)
- **Nov 4, 2025**: Enhanced error logging
- **Nov 4, 2025**: Timeout increased to 60s
