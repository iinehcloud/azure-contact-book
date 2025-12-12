# Contact Book Frontend

A React-based frontend application for managing contacts, built with TypeScript and deployed on Azure Static Web Apps.

## Overview

This is the presentation layer of the 3-tier Contact Book application. It provides a responsive, user-friendly interface for creating, viewing, updating, and deleting contacts.

## Technology Stack

- **React** 19.2+ - UI framework
- **TypeScript** 4.9+ - Type-safe JavaScript
- **React Router** 7.10+ - Client-side routing
- **Axios** 1.13+ - HTTP client for API communication
- **React Scripts** 5.0+ - Build tooling and development server
- **Jest & React Testing Library** - Testing framework

## Component Structure

The application follows a component-based architecture with clear separation of concerns:

```
src/
├── api/
│   ├── config.ts              # Axios configuration and base setup
│   ├── config.test.ts         # API config tests
│   ├── contactService.ts      # Contact API service layer
│   └── contactService.test.ts # API service tests
├── components/
│   ├── ContactList.tsx        # List view component
│   ├── ContactList.css        # List view styles
│   ├── ContactList.test.tsx   # List view tests
│   ├── ContactDetail.tsx      # Detail view component
│   ├── ContactDetail.css      # Detail view styles
│   ├── ContactDetail.test.tsx # Detail view tests
│   ├── ContactForm.tsx        # Create/Edit form component
│   ├── ContactForm.css        # Form styles
│   └── ContactForm.test.tsx   # Form tests
├── __mocks__/
│   └── react-router-dom.tsx   # Router mocks for testing
├── App.tsx                    # Root component with routing
├── App.css                    # Global app styles
├── App.test.tsx               # App component tests
├── index.tsx                  # Application entry point
├── index.css                  # Global styles
└── setupTests.ts              # Test configuration
```

### Component Descriptions

#### App Component
- Root component managing application routing
- Configures React Router with routes for list, detail, create, and edit views
- Provides global error boundary
- Routes:
  - `/` - Contact list view
  - `/contacts/:id` - Contact detail view
  - `/contacts/new` - Create new contact
  - `/contacts/:id/edit` - Edit existing contact

#### ContactList Component
- Displays all contacts in a responsive grid layout
- Fetches contacts on mount
- Provides navigation to detail view and create form
- Shows loading and error states

#### ContactDetail Component
- Displays detailed information for a single contact
- Provides edit and delete functionality
- Includes delete confirmation dialog
- Handles not found scenarios

#### ContactForm Component
- Reusable form for creating and editing contacts
- Client-side validation matching backend rules
- Displays field-specific validation errors
- Supports both create and edit modes

#### API Service Layer
- Centralized API communication using Axios
- Error handling and response transformation
- Type-safe interfaces for all API operations
- Functions: `getAllContacts()`, `getContactById()`, `createContact()`, `updateContact()`, `deleteContact()`

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the frontend directory based on `.env.example`:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `REACT_APP_API_BASE_URL` | Base URL for the backend API | `http://localhost:3000` (development)<br/>`https://your-api.azurewebsites.net` (production) |

### Configuration Files

- **`.env`** - Local development environment variables (not committed to git)
- **`.env.example`** - Template for environment variables (committed to git)
- **`.env.production`** - Production environment variables (optional, for local production builds)

**Note:** All environment variables must be prefixed with `REACT_APP_` to be accessible in the React application.

## Local Development Setup

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher
- Backend API running (see backend README)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your local backend API URL:
   ```
   REACT_APP_API_BASE_URL=http://localhost:3000
   ```

### Running the Development Server

Start the development server with hot reload:

```bash
npm start
```

The application will open automatically at `http://localhost:3000` (or the next available port if 3000 is in use).

### Development Features

- **Hot Reload**: Changes to source files automatically refresh the browser
- **Type Checking**: TypeScript provides compile-time type safety
- **Linting**: ESLint checks code quality
- **Error Overlay**: Development errors display in the browser

## Testing

### Running Tests

Run all tests in watch mode:
```bash
npm test
```

Run tests once (CI mode):
```bash
npm test -- --watchAll=false
```

Run tests with coverage:
```bash
npm test -- --coverage --watchAll=false
```

### Test Structure

- **Unit Tests**: Test individual components and functions in isolation
- **Integration Tests**: Test component interactions and API service
- **Mocking**: Uses Jest mocks for API calls and router navigation

### Test Files

All test files follow the naming convention `*.test.tsx` or `*.test.ts` and are located alongside their source files.

## Build and Deployment Process

### Building for Production

Create an optimized production build:

```bash
npm run build
```

This command:
- Compiles TypeScript to JavaScript
- Bundles and minifies all assets
- Optimizes for performance
- Outputs to the `build/` directory

The build folder contains:
- Minified JavaScript bundles
- Optimized CSS files
- Static assets (images, fonts, etc.)
- `index.html` entry point

### Build Verification

Test the production build locally:

```bash
# Install a static server
npm install -g serve

# Serve the build directory
serve -s build -l 3000
```

### Deployment to Azure Static Web Apps

#### Prerequisites

- Azure account with active subscription
- Azure CLI installed (optional, for CLI deployment)
- GitHub repository (for automated deployments)

#### Deployment Methods

##### Method 1: GitHub Actions (Recommended)

1. **Create Azure Static Web App**:
   - Go to Azure Portal
   - Create new Static Web App resource
   - Connect to your GitHub repository
   - Configure build settings:
     - App location: `/frontend`
     - API location: (leave empty)
     - Output location: `build`

2. **Automatic Deployment**:
   - Azure creates a GitHub Actions workflow automatically
   - Push to main branch triggers deployment
   - Build and deployment happen automatically

3. **Configure Environment Variables**:
   - In Azure Portal, go to your Static Web App
   - Navigate to Configuration
   - Add application setting:
     - Name: `REACT_APP_API_BASE_URL`
     - Value: `https://your-backend-api.azurewebsites.net`

##### Method 2: Azure CLI

```bash
# Login to Azure
az login

# Create Static Web App
az staticwebapp create \
  --name your-app-name \
  --resource-group your-resource-group \
  --source https://github.com/your-username/your-repo \
  --location "East US 2" \
  --branch main \
  --app-location "/frontend" \
  --output-location "build" \
  --login-with-github

# Configure environment variables
az staticwebapp appsettings set \
  --name your-app-name \
  --setting-names REACT_APP_API_BASE_URL=https://your-backend-api.azurewebsites.net
```

##### Method 3: Manual Upload

```bash
# Build the application
npm run build

# Install Azure Static Web Apps CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy ./build \
  --deployment-token <your-deployment-token> \
  --app-name your-app-name
```

#### Post-Deployment Configuration

1. **Custom Domain** (Optional):
   - Add custom domain in Azure Portal
   - Configure DNS records
   - SSL certificate is automatically provisioned

2. **CORS Configuration**:
   - Ensure backend API allows requests from Static Web App domain
   - Update backend `CORS_ORIGIN` environment variable

3. **Verify Deployment**:
   - Access your Static Web App URL
   - Test all CRUD operations
   - Check browser console for errors
   - Verify API connectivity

### Static Web App Configuration

The `staticwebapp.config.json` file configures routing and other Static Web App features:

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif}", "/css/*"]
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    }
  ]
}
```

This configuration ensures client-side routing works correctly by redirecting all routes to `index.html`.

## Troubleshooting

### Common Issues

#### API Connection Errors

**Problem**: Cannot connect to backend API

**Solutions**:
- Verify `REACT_APP_API_BASE_URL` is set correctly
- Check backend API is running and accessible
- Verify CORS is configured on backend
- Check browser console for specific error messages

#### Build Failures

**Problem**: `npm run build` fails

**Solutions**:
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`
- Verify all environment variables are set
- Check for dependency version conflicts

#### Routing Issues in Production

**Problem**: Direct URL access returns 404

**Solutions**:
- Verify `staticwebapp.config.json` is present
- Ensure `navigationFallback` is configured correctly
- Check Azure Static Web App configuration

#### Environment Variables Not Working

**Problem**: Environment variables are undefined

**Solutions**:
- Ensure variables are prefixed with `REACT_APP_`
- Restart development server after changing `.env`
- For production, verify variables are set in Azure Portal
- Rebuild application after changing environment variables

## Performance Optimization

The production build includes:
- Code splitting for optimal bundle sizes
- Tree shaking to remove unused code
- Minification of JavaScript and CSS
- Image optimization
- Gzip compression
- Browser caching headers

## Browser Support

The application supports:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Azure Static Web Apps Documentation](https://docs.microsoft.com/en-us/azure/static-web-apps/)
- [React Router Documentation](https://reactrouter.com/)
- [Axios Documentation](https://axios-http.com/docs/intro)

## License

This project is part of the Contact Book application suite.
