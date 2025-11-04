# 🔍 Гайд по дебагу

## 1. Локальный дебаг (рекомендуется!)

### Установка Vercel CLI
```bash
npm i -g vercel
vercel login
```

### Создай .env для локалки
```bash
echo "GEMINI_API_KEY=твой_ключ" > .env
```

### Запуск dev режима
```bash
vercel dev
```

Теперь:
- Frontend: `http://localhost:3000`
- API: `http://localhost:3000/api/*`
- Все `console.log()` видны в терминале
- Hot reload работает для изменений

### Дебаг через браузер
1. Открой DevTools (F12)
2. Network → смотри запросы к `/api/*`
3. Console → смотри ошибки frontend

## 2. Дебаг на Production (Vercel Dashboard)

### Просмотр логов Functions
После деплоя:

1. Зайди в [Vercel Dashboard](https://vercel.com/dashboard)
2. Выбери проект `raskadrovshik`
3. Вкладка **Functions** (слева)
4. Выбери функцию (например, `api/generate-storyboards.ts`)
5. Увидишь все логи в реальном времени

Теперь все функции пишут подробные логи:
```
[generate-storyboards] Request received
[generate-storyboards] Params: { hasPrompt: true, hasImage: true, ... }
[generate-storyboards] Starting generation of 4 images...
[generate-storyboards] Success! Generated 4 images in 15234ms
```

### Просмотр логов через CLI
```bash
# Все логи в реальном времени
vercel logs --follow

# Логи конкретного деплоя
vercel logs <deployment-url>

# Только ошибки
vercel logs --follow | grep -i error
```

## 3. Типичные проблемы и решения

### ❌ "GEMINI_API_KEY environment variable not set"
**Причина**: Не добавлена переменная окружения в Vercel

**Решение**:
1. Vercel Dashboard → Settings → Environment Variables
2. Добавь `GEMINI_API_KEY` = твой ключ
3. Redeploy проект

**CLI вариант**:
```bash
vercel env add GEMINI_API_KEY
# Вставь ключ когда попросит
vercel --prod
```

### ❌ "API error: 404 Not Found"
**Причина**: API routes не задеплоились

**Проверь**:
```bash
# Должна быть папка api/ в корне
ls -la api/
# Должны быть 3 файла:
# - generate-description.ts
# - generate-storyboards.ts
# - edit-image.ts
```

**Решение**: Закоммить и запушить файлы из `api/`

### ❌ Долгая генерация / таймауты
**Причина**: Gemini API медленный или превышен лимит Vercel (60 секунд для hobby плана)

**Проверь логи**:
```
[generate-storyboards] Success! Generated 4 images in 45000ms
```

Если > 50 секунд, может быть таймаут.

**Решение**:
- Уменьши количество генераций с 4 до 2
- Или используй Vercel Pro (300 секунд таймаут)

### ❌ "Failed to fetch"
**Причина**: CORS или неправильный URL в production

**Проверь**:
```javascript
// services/geminiService.ts
// Должен быть относительный путь:
fetch('/api/generate-storyboards', { ... })
// НЕ абсолютный:
// fetch('http://localhost:3000/api/...', { ... })
```

### ❌ Изображения не грузятся
**Причина**: Base64 слишком большой

**Проверь логи**:
```
[generate-storyboards] Params: { imageSize: 5242880 }
```

Если > 5MB, это проблема.

**Решение**: Compress изображение перед отправкой (в ImageUploader)

## 4. Отладочные команды

### Проверка API локально
```bash
# Запусти vercel dev
vercel dev

# В другом терминале:
curl -X POST http://localhost:3000/api/generate-description \
  -H "Content-Type: application/json" \
  -d '{"image": {"base64": "test", "mimeType": "image/png"}}'
```

### Проверка переменных окружения
```bash
# Локально
cat .env

# В Vercel
vercel env ls
```

### Build локально (проверка перед деплоем)
```bash
npm run build
# Должно пройти без ошибок
```

## 5. Структура логов

Все API endpoints теперь логируют:

### generate-storyboards
```
[generate-storyboards] Request received
[generate-storyboards] Params: { hasPrompt: true, hasImage: true, hasStylePrompt: true, imageSize: 123456 }
[generate-storyboards] Starting generation of 4 images...
[generate-storyboards] Success! Generated 4 images in 15234ms
```

### generate-description
```
[generate-description] Request received
[generate-description] Image size: 123456
[generate-description] Success! Description length: 145
```

### edit-image
```
[edit-image] Request received
[edit-image] Params: { hasImage: true, hasEditInstruction: true, hasStylePrompt: true, imageSize: 123456 }
[edit-image] Success! Image edited
```

## 6. Monitoring в реальном времени

### Real-time логи (рекомендуется для дебага)
```bash
vercel logs --follow
```

Открой приложение в браузере и делай действия - увидишь логи в реальном времени!

### Vercel Analytics (опционально)
В Dashboard можно включить:
- Speed Insights
- Web Analytics
- Runtime Logs (расширенные логи)

## 7. Если ничего не помогает

### Проверь статус Gemini API
```bash
curl https://generativelanguage.googleapis.com/v1beta/models \
  -H "x-goog-api-key: твой_ключ"
```

### Redeploy с нуля
```bash
# Удали .vercel
rm -rf .vercel

# Redeploy
vercel --prod
```

### Откат к старой версии
В Vercel Dashboard → Deployments → выбери старый деплой → "Promote to Production"

## Чеклист дебага

- [ ] Проверил логи в Vercel Dashboard → Functions
- [ ] Запустил `vercel dev` локально
- [ ] Проверил переменные окружения (`GEMINI_API_KEY`)
- [ ] Посмотрел Network в DevTools браузера
- [ ] Проверил размер изображений (не > 5MB)
- [ ] Build проходит без ошибок (`npm run build`)
- [ ] API routes существуют в папке `api/`

Удачи с дебагом! 🔍
