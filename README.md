# Раскадровщик Курильщика

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

AI-powered storyboard generator that transforms rough sketches into professional monochrome storyboards using Alibaba Cloud Qwen API.

## Features

- **AI-Powered Generation**: Upload a sketch and get a professional storyboard in "Светотень Pro" style
- **Светотень Pro Style**: Highly detailed style with professional shadow work, 7-9 tonal gradations, and sophisticated lighting
- **Smart Image Processing**: Automatic compression to avoid payload size limits
- **AI Description Generator**: Let AI analyze your sketch and create a scene description
- **Edit & Refine**: Apply text-based edits to generated images
- **Variations**: Generate different versions based on your sketch

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **AI**: Alibaba Cloud Qwen API (qwen-image-edit-plus, qwen-vl-plus)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Qwen API key from [Alibaba Cloud Model Studio](https://bailian.console.aliyun.com/?apiKey=1#/api-key)

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
   QWEN_API_KEY=your_qwen_api_key_here
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
│   ├── generate-storyboards.ts   # Generate storyboard in Светотень Pro style
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
Generate a professional storyboard from a sketch in "Светотень Pro" style.

### POST /api/generate-description
Generate a text description from an uploaded sketch.

### POST /api/edit-image
Apply text-based edits to a generated image.

## Environment Variables

### Production (Vercel Dashboard)
```bash
QWEN_API_KEY=your_qwen_api_key
```

### Local Development
```bash
# .env.local
QWEN_API_KEY=your_qwen_api_key
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

### November 2025 - Migration to Qwen API (v3.0)
- **Migrated to Qwen API**: Switched from Google Gemini to Alibaba Cloud Qwen for better cost-effectiveness
- **Image-to-image transformation**: Now using qwen-image-edit-plus for high-quality sketch transformation
- **AI vision descriptions**: Using qwen-vl-plus for automatic scene description generation
- **Maintained quality**: Same professional "Светотень Pro" style with improved API performance
- **Cost optimization**: Reduced from 4 to 1 image generation per request (4x cost reduction)

### "Светотень Pro" Style Features
- Professional shadow work with 7-9 tonal gradations
- Multiple shadow techniques (cast, core, occlusion, reflected light)
- Precise linework with varying line weights
- Balanced composition with focal point emphasis

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

This project is built with Alibaba Cloud Qwen API and is subject to Alibaba Cloud's terms of service.

## Links

- **Production**: https://raskadrovshik.vercel.app
- **GitHub**: https://github.com/Humanji7/raskadrovshik
- **AI Studio**: https://ai.studio/apps/drive/1T1kc_hUXcZFAwHglvaBeE9kKfT9O8v3c
