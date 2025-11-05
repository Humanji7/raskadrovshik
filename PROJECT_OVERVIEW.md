# Раскадровщик Курильщика - Project Overview

## Описание проекта

**Раскадровщик Курильщика** - веб-приложение для генерации storyboard кадров из эскизов с помощью Google Gemini AI.

Пользователь загружает черновой набросок, добавляет текстовое описание, выбирает художественный стиль, и AI генерирует 4 профессиональных варианта раскадровки в монохромном стиле.

## Технологический стек

### Frontend
- **React 19.2.0** - UI фреймворк
- **TypeScript** - типизация
- **Vite** - сборщик и dev-сервер
- **Tailwind CSS** - стилизация (inline в компонентах)

### Backend (Serverless)
- **Vercel Serverless Functions** - API endpoints
- **Google Gemini AI** (@google/genai ^1.28.0)
  - `gemini-2.5-flash-image` - генерация изображений
  - `gemini-2.5-flash` - текстовая генерация

### Деплой
- **Vercel** - hosting + serverless
- **GitHub** - репозиторий и автоматический деплой
- **Production URL**: https://raskadrovshik.vercel.app

## Архитектура проекта

```
raskadrovshik/
├── api/                          # Vercel Serverless Functions
│   ├── generate-storyboards.ts   # Генерация 4 вариантов раскадровки
│   ├── generate-description.ts   # AI описание из эскиза
│   └── edit-image.ts             # Редактирование изображения
├── components/                   # React компоненты
│   ├── ImageUploader.tsx         # Загрузка + сжатие изображений
│   └── EditModal.tsx             # Модальное окно редактирования
├── services/                     # Frontend сервисы
│   └── geminiService.ts          # API клиент для serverless функций
├── App.tsx                       # Главный компонент приложения
├── vercel.json                   # Конфигурация Vercel
└── package.json                  # Зависимости

```

## Ключевые особенности

### 1. Автоматическое сжатие изображений
**Проблема**: 413 Payload Too Large при загрузке больших изображений
**Решение**: `ImageUploader.tsx` автоматически сжимает до 1024px max, JPEG 0.8 quality

### 2. Детальное логирование ошибок
- Все API запросы логируются с деталями
- Ошибки содержат полную информацию от Gemini API
- UI показывает детальные сообщения об ошибках

### 3. Serverless Architecture
Frontend → Vercel Functions → Gemini AI
- Скрывает API ключи от клиента
- Работает как proxy для пользователей с VPN
- Масштабируемость без backend инфраструктуры

## API Endpoints

### POST /api/generate-storyboards
Генерирует 4 варианта раскадровки из эскиза

**Request**:
```json
{
  "prompt": "Описание сцены",
  "image": {
    "base64": "...",
    "mimeType": "image/jpeg"
  },
  "stylePrompt": "Описание художественного стиля"
}
```

**Response**:
```json
{
  "images": [
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,..."
  ]
}
```

### POST /api/generate-description
Генерирует текстовое описание из эскиза

**Request**:
```json
{
  "image": {
    "base64": "...",
    "mimeType": "image/jpeg"
  }
}
```

**Response**:
```json
{
  "description": "Описание композиции эскиза"
}
```

### POST /api/edit-image
Редактирует изображение по текстовой инструкции

**Request**:
```json
{
  "originalImage": {
    "base64": "...",
    "mimeType": "image/jpeg"
  },
  "editInstruction": "Добавь дым на заднем плане",
  "stylePrompt": "Карандашный эскиз"
}
```

**Response**:
```json
{
  "editedImage": "data:image/jpeg;base64,..."
}
```

## User Flow

1. **Загрузка эскиза** → автоматическое сжатие до 1024px
2. **AI описание** (опционально) → `/api/generate-description`
3. **Выбор стиля** → 4 стиля (карандаш, маркер, уголь, тушь)
4. **Генерация** → `/api/generate-storyboards` → 4 варианта
5. **Действия с результатами**:
   - Вариации (повторная генерация с тем же изображением)
   - Редактирование (текстовые инструкции для правок)
   - Скачивание

## Environment Variables

### Production (Vercel)
```bash
GEMINI_API_KEY=your_google_ai_api_key
```

### Local Development
```bash
# .env.local
GEMINI_API_KEY=your_google_ai_api_key
```

## Лимиты и ограничения

### Vercel Serverless
- **Request Body**: 4.5 MB (поэтому сжимаем изображения)
- **Function Timeout**: 60 секунд
- **Memory**: 1024 MB

### Gemini API
- **Model**: gemini-2.5-flash-image (stable)
- **Input**: 65,536 tokens
- **Output**: 32,768 tokens
- **Region**: global (не us-central1)

## Решенные проблемы

### 1. 413 Payload Too Large (Ноябрь 2025)
**Причина**: Изображения >4.5MB превышали лимит Vercel
**Решение**: Автоматическое сжатие в `ImageUploader.tsx`
- Max 1024px по большей стороне
- JPEG качество 0.8
- Сжатие происходит в браузере до отправки

### 2. 404/403 ошибки у пользователей с VPN (Ноябрь 2025)
**Причина**: Ошибки были из-за размера payload, не VPN
**Решение**: Сжатие изображений + улучшенное логирование
**Архитектура**: Vercel уже работает как proxy → Gemini видит IP Vercel

### 3. Неинформативные сообщения об ошибках (Ноябрь 2025)
**Причина**: Frontend показывал только "Проверь консоль"
**Решение**:
- Чтение error details из response body
- Детальные логи в `geminiService.ts`
- Показ полных сообщений об ошибках в UI

## Development

### Локальный запуск
```bash
npm install
npm run dev
# → http://localhost:3000
```

**Важно**: API endpoints (`/api/*`) НЕ работают локально с Vite dev server. Для тестирования API нужен Vercel CLI или деплой.

### Build
```bash
npm run build
# → dist/
```

### Деплой на Vercel
```bash
# Автоматически при push в main
git push origin main

# Или вручную
vercel --prod
```

## Стили раскадровки

1. **Карандашный эскиз** - динамичный, экспрессивный, штриховка
2. **Светотень Pro** - детализированный стиль с профессиональной проработкой теней, 7-9 тональных градаций, различные техники теней (cast, core, occlusion, reflected light)
3. **Мягкий уголь** - атмосферный, размытые края, smoky
4. **Тушь и вода** - Sumi-e стиль, минимализм, fluid

Все стили генерируют **монохромные (ч/б)** изображения для storyboard.

## Важные файлы

- `vercel.json` - конфигурация serverless функций, CORS, timeouts
- `.vercelignore` - что не деплоить (node_modules, .env, docs)
- `services/geminiService.ts` - все API запросы с детальным логированием
- `components/ImageUploader.tsx` - сжатие изображений
- `App.tsx` - главная логика приложения, state management

## Мониторинг и дебаг

### Vercel Logs
```bash
vercel logs https://raskadrovshik.vercel.app
```

### Browser Console
- `[geminiService]` - API запросы и ответы
- `[ImageUploader]` - размеры изображений до/после сжатия
- `[generate-*]` - serverless function logs

### Inspect Deployment
```bash
vercel inspect <deployment-url> --logs
```

## Roadmap / Potential Issues

### Известные ограничения
- Генерация занимает 15-30 секунд (4 изображения параллельно)
- Только монохромные изображения
- Gemini 2.5 Flash Image доступен не во всех регионах

### Потенциальные улучшения
- Прогресс бар генерации
- Кеширование результатов
- Batch генерация для ускорения
- Сохранение истории проектов

## Контакты и ссылки

- **Production**: https://raskadrovshik.vercel.app
- **GitHub**: https://github.com/Humanji7/raskadrovshik
- **Vercel Project**: mediabot-lab/raskadrovshik
