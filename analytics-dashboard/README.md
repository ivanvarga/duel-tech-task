# Analytics Dashboard

React-based analytics dashboard for visualizing advocacy platform metrics and insights.

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
# Dashboard will be available at http://localhost:3001
```

## Configuration

The dashboard is configured to:
- Run on port **3001** (configured in `vite.config.ts`)
- Connect to API at `http://localhost:3000` (or `VITE_API_URL` if set)

## Features

- **Overview Dashboard**: High-level metrics and KPIs
- **Brand Analytics**: Performance metrics by brand
- **User Analytics**: Top performing users and influencers
- **Platform Analytics**: Cross-platform performance comparison
- **Program Analytics**: Campaign performance tracking
- **Interactive Charts**: Built with ECharts for rich visualizations

## Development

```bash
# Development server with hot reload
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Lint code
yarn lint
```

## Tech Stack

- React 18
- Vite 5
- TypeScript 5
- ECharts 5 (charting library)
- React Query (data fetching)
- React Router (navigation)
- Tailwind CSS + DaisyUI (styling)

## API Integration

The dashboard connects to the analytics API at `http://localhost:3000/api/analytics`. Ensure the API server is running:

```bash
# In the root directory
yarn dev
```

Then start the analytics dashboard:

```bash
# In the analytics-dashboard directory
cd analytics-dashboard
yarn dev
```

## Docker

Run with Docker:

```bash
# From root directory
yarn docker:full  # Runs everything including this dashboard

# Or build and run just this dashboard
cd analytics-dashboard
docker build -t analytics-dashboard .
docker run -p 3001:3001 -e VITE_API_URL=http://localhost:3000 analytics-dashboard
```

Access the dashboard at: http://localhost:3001

## Available Endpoints

The dashboard queries these API endpoints:

- `GET /api/analytics/stats` - Dashboard summary statistics
- `GET /api/analytics/brands` - Brand performance metrics
- `GET /api/analytics/users` - User analytics and rankings
- `GET /api/analytics/platforms` - Platform distribution
- `GET /api/analytics/programs` - Program performance
- `GET /api/analytics/brands-platforms` - Cross-analytics

See the main API documentation for more details.
