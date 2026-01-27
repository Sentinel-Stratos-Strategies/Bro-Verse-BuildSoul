# BroVerse Frontend

The BroVerse is a React application for sacred construction and personal growth. This isn't therapy—it's resurrection.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.19.0
- npm (comes with Node.js)

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables (Optional):**
   ```bash
   cp .env.example .env
   ```
   
   If you want Azure Application Insights telemetry, edit `.env` and add your connection string. Otherwise, the app works fine without it.

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality

## 🏗️ Tech Stack

- **React 19.2** - UI framework
- **React Router DOM 7.13** - Client-side routing
- **Vite 7.2** (Rolldown) - Lightning-fast build tool
- **Azure Application Insights** - Telemetry and monitoring

## 📦 Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components (Home, Dashboard, Profile)
│   ├── data/           # Static data and configurations
│   ├── telemetry/      # Azure Application Insights setup
│   ├── App.jsx         # Main app component with routing
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
└── vite.config.js      # Vite configuration
```

## 🎯 Features

- **19 Archetypes + 1 Custom Character** - Build your roster
- **Bro Calls** - 3x per week, 7-10 second wisdom drops
- **30-Day Lock** - Commitment-based growth system
- **AI-Powered Characters** - Each speaks with their own voice

## 🌐 Deployment

The build output in `dist/` is static and can be deployed to:
- Azure Static Web Apps
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

Build command: `npm run build`
Output directory: `dist/`

## 📝 Notes

- The app uses rolldown-vite for faster build times
- Application Insights integration is optional but recommended for production monitoring
- All routes are handled client-side with React Router
