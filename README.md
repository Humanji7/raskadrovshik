# Раскадровщик Курильщика

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

AI-powered storyboard generator that transforms rough sketches into professional monochrome storyboards using Google Gemini AI.

## Features

- **AI-Powered Generation**: Upload a sketch and get 4 professional storyboard variations
- **Multiple Artistic Styles**:
  - **Карандашный эскиз** - Dynamic pencil sketch with expressive hatching
  - **Светотень Pro** - Detailed style with professional shadow work and 7-9 tonal gradations
  - **Мягкий уголь** - Atmospheric charcoal with soft, blended edges
  - **Тушь и вода** - Minimalist Sumi-e ink wash style
- **Smart Image Processing**: Automatic compression to avoid payload size limits
- **AI Description Generator**: Let AI analyze your sketch and create a scene description
- **Edit & Refine**: Apply text-based edits to generated images
- **Variations**: Generate multiple versions of the same concept

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **AI**: Google Gemini AI (gemini-2.5-flash-image)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Humanji7/raskadrovshik.git
   cd raskadrovshik
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

## Deployment

The app is deployed on Vercel and automatically deploys on push to `main` branch.

**Production URL**: https://raskadrovshik.vercel.app

### Manual Deployment

```bash
vercel --prod
```

## Project Structure

```
raskadrovshik/
├── api/                          # Vercel Serverless Functions
│   ├── generate-storyboards.ts   # Generate 4 storyboard variations
│   ├── generate-description.ts   # AI description from sketch
│   └── edit-image.ts             # Edit image with text instructions
├── components/                   # React components
│   ├── ImageUploader.tsx         # Image upload + compression
│   └── EditModal.tsx             # Edit modal window
├── services/                     # Frontend services
│   └── geminiService.ts          # API client for serverless functions
├── App.tsx                       # Main application component
├── vercel.json                   # Vercel configuration
└── package.json                  # Dependencies
```

## API Endpoints

### POST /api/generate-storyboards
Generate 4 storyboard variations from a sketch.

### POST /api/generate-description
Generate a text description from an uploaded sketch.

### POST /api/edit-image
Apply text-based edits to a generated image.

## Environment Variables

### Production (Vercel Dashboard)
```bash
GEMINI_API_KEY=your_google_ai_api_key
```

### Local Development
```bash
# .env.local
GEMINI_API_KEY=your_google_ai_api_key
```

## Key Features Explained

### Automatic Image Compression
Images are automatically compressed to max 1024px with JPEG quality 0.8 to avoid Vercel's 4.5MB payload limit.

### Serverless Architecture
The app uses Vercel Serverless Functions as a proxy to Gemini AI, keeping API keys secure and providing a consistent experience for users worldwide.

### Detailed Error Logging
All API requests are logged with full details, making debugging and monitoring easier.

## Documentation

- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - Detailed project documentation
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions
- [DEBUG_GUIDE.md](./DEBUG_GUIDE.md) - Debugging guide
- [DEPLOY.md](./DEPLOY.md) - Deployment instructions

## Recent Updates

### November 2025 - "Светотень Pro" Style
Replaced "Жирный маркер" style with "Светотень Pro" - a highly detailed style featuring:
- Professional shadow work with 7-9 tonal gradations
- Multiple shadow techniques (cast, core, occlusion, reflected light)
- Precise linework with varying line weights
- Balanced composition with focal point emphasis

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is built with Google Gemini AI and is subject to Google's terms of service.

## Links

- **Production**: https://raskadrovshik.vercel.app
- **GitHub**: https://github.com/Humanji7/raskadrovshik
- **AI Studio**: https://ai.studio/apps/drive/1T1kc_hUXcZFAwHglvaBeE9kKfT9O8v3c
