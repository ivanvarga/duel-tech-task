# Admin Dashboard

React Admin dashboard for managing failed imports and viewing advocacy platform data.

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev
# Dashboard will be available at http://localhost:3002
```

## Configuration

The dashboard is configured to:
- Run on port **3002** (configured in `vite.config.ts`)
- Proxy API requests to `http://localhost:3000` (main API server)

## Features

- **Failed Imports Management**: View, filter, and manage failed file imports
- **Users**: Browse and manage user records
- **Brands**: View and manage brand information
- **Programs**: Manage advocacy programs
- **Tasks**: View and manage completed tasks
- **Program Memberships**: Browse membership records

## Development

```bash
# Development server with hot reload
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview
```

## Tech Stack

- React 18
- React Admin 4.16
- Vite 5
- TypeScript 5
- Material-UI

## API Integration

The dashboard connects to the main API server at `http://localhost:3000`. Ensure the API server is running:

```bash
# In the root directory
yarn dev
```

Then start the admin dashboard:

```bash
# In the admin-dashboard directory
cd admin-dashboard
yarn dev
```

Access the dashboard at: http://localhost:3002
