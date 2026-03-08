# Health Tracker Frontend

This is the React frontend for the Health Tracking application. It provides a multi-tenant interface for tracking ECG and blood pressure data.

## Features

- **Multi-Tenant Support**: Isolates data by tenant and user via HTTP headers
- **ECG Management**: View and analyze ECG sessions with interactive charts using recharts
- **Blood Pressure Tracking**: Track and monitor blood pressure readings
- **Responsive Design**: Mobile-friendly interface with modern styling
- **Real-time Data**: Fetches data from the backend API

## Project Structure

\`\`\`
src/
├── main.jsx                    # React app entry point
├── App.jsx                     # Root component
├── index.css                   # Global styles
├── App.css                     # App component styles
│
├── app/
│   └── routes.jsx             # Route definitions
│
├── layout/
│   ├── MainLayout.jsx         # Main layout component
│   ├── Header.jsx             # Header with tenant info
│   └── Sidebar.jsx            # Navigation sidebar
│
├── features/
│   ├── ecg/
│   │   ├── EcgList.jsx        # ECG sessions list view
│   │   └── EcgDetail.jsx      # ECG detail with recharts visualization
│   └── bloodPressure/
│       └── BloodPressureList.jsx  # Blood pressure readings list
│
├── services/
│   ├── api.js                 # API client with tenant headers
│   └── tenant.jsx             # Tenant context provider
│
├── hooks/
│   └── useTenant.js           # Hook for accessing tenant context
│
└── types/
    └── models.js              # TypeScript/JSDoc type definitions
\`\`\`

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create a `.env` file (or use `.env.example` as template):
\`\`\`bash
VITE_API_URL=http://localhost:5001
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The app will be available at `http://localhost:5173`

### Building for Production

\`\`\`bash
npm run build
\`\`\`

The optimized build will be in the `dist/` directory.

## Multi-Tenant Usage

The application requires two HTTP headers for all API requests:
- `X-Tenant-Id`: Identifies the tenant
- `X-User-Id`: Identifies the user within the tenant

These are automatically added to all API calls via the `useTenant()` hook and the `apiService`.

### Default Test Credentials

The app comes with test credentials (can be changed in `App.jsx`):
- Tenant ID: `550e8400-e29b-41d4-a716-446655440000`
- User ID: `550e8400-e29b-41d4-a716-446655440001`

Change these by modifying localStorage or the `.env` file.

## ECG Chart Visualization

The ECG Detail page displays ECG waveforms using **recharts**:
- Line chart showing ECG samples over time
- Interactive tooltip with sample values
- Responsive container that adapts to screen size
- Real-time rendering of ECG signal data

## API Endpoints

The frontend communicates with the backend API at `http://localhost:5001`:

### ECG Endpoints
- `GET /api/ecg` - Get all ECG sessions (with pagination)
- `GET /api/ecg/{id}` - Get specific ECG session
- `POST /api/ecg` - Create new ECG session

### Blood Pressure Endpoints
- `GET /api/bloodpressure` - Get all readings (with pagination)
- `GET /api/bloodpressure/{id}` - Get specific reading
- `POST /api/bloodpressure` - Create new reading

All requests require multi-tenant headers (`X-Tenant-Id`, `X-User-Id`).

## Dependencies

- **React 18.2.0**: UI library
- **Recharts 2.10.3**: Charting library for ECG visualization
- **Vite 5.0.8**: Build tool and dev server
- **ESLint**: Code quality tool

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

The project uses ESLint with React plugins to maintain code quality. Run the linter before committing:
\`\`\`bash
npm run lint
\`\`\`

## Deployment

### Docker

To containerize the frontend:

\`\`\`dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
\`\`\`

### Environment Variables

Set the following environment variable in production:
\`\`\`
VITE_API_URL=<backend-api-url>
\`\`\`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
