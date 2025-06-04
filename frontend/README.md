# VerbatimAI - Frontend

This is the frontend application for the VerbatimAI project, built with React, Vite, and Tailwind CSS.

## Features

- User authentication (register, login, profile management)
- Dashboard with sentiment analysis visualizations
- Feedback list with filtering and search
- CSV upload for batch feedback processing
- Manual feedback entry
- Settings and account management

## Tech Stack

- **React**: UI library
- **Vite**: Build tool and development server
- **React Router**: For routing and navigation
- **React Query**: For data fetching, caching, and state management
- **Zustand**: For global state management
- **Chart.js**: For data visualization
- **Tailwind CSS**: For styling
- **Axios**: For API communication

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/                 # Source code
│   ├── components/      # Reusable UI components
│   │   ├── common/      # Shared components (buttons, inputs, etc.)
│   │   ├── dashboard/   # Dashboard-specific components
│   │   └── feedback/    # Feedback-specific components
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── services/        # API services
│   ├── store/           # Global state management
│   ├── App.jsx          # Main application component
│   ├── index.css        # Global styles
│   └── main.jsx         # Application entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.js       # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

2. Start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:3000.

### Build for Production

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## Available Scripts

- `dev`: Start the development server
- `build`: Build for production
- `lint`: Run ESLint
- `preview`: Preview the production build locally
- `test`: Run tests

## API Configuration

The application is configured to communicate with the backend API at http://localhost:8000. This is set up in the `vite.config.js` file with a proxy to `/api`.

If you need to change the API URL for production, update the `baseURL` in `src/services/api.js`.

## Authentication

Authentication is handled using JWT tokens. The token is stored in localStorage for persistence between sessions. The authentication logic is in the `src/store/authStore.js` file.