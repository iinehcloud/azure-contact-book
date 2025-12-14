import React from 'react';

// Mock navigate function
const mockNavigate = jest.fn();

// Mock params that can be set by tests
let mockParams: Record<string, string> = {};

export const useNavigate = () => mockNavigate;

export const useParams = () => mockParams;

export const Link = ({ to, children, className, ...props }: any) => (
  <a href={to} className={className} {...props}>
    {children}
  </a>
);

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="browser-router">{children}</div>
);

export const MemoryRouter = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="memory-router">{children}</div>
);

// Track current path for routing
let currentPath = '/';

export const Routes = ({ children }: { children: React.ReactNode }) => {
  // Get the current path from window.location or default to '/'
  currentPath = window.location.pathname || '/';
  
  // Find the matching route
  const routes = React.Children.toArray(children);
  
  for (const route of routes) {
    if (
      React.isValidElement<{ path?: string }>(route) &&
      route.props.path
    ) {
      const path = route.props.path;
      
      // Simple path matching
      if (path === currentPath) {
        return <div data-testid="routes">{route}</div>;
      }
      
      // Match dynamic segments like /contacts/:id
      const pathPattern = path.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${pathPattern}$`);
      
      if (regex.test(currentPath)) {
        // Extract params
        const pathParts = path.split('/');
        const currentParts = currentPath.split('/');
        
        pathParts.forEach((part, index) => {
          if (part.startsWith(':')) {
            const paramName = part.slice(1);
            mockParams[paramName] = currentParts[index];
          }
        });
        
        return <div data-testid="routes">{route}</div>;
      }
    }
  }
  
  // Return first route if no match (default behavior)
  return <div data-testid="routes">{routes[0]}</div>;
};

export const Route = ({ element }: { path?: string; element?: React.ReactNode }) => (
  <>{element}</>
);

// Helper to set mock params for tests
export const setMockParams = (params: Record<string, string>) => {
  mockParams = params;
};

// Helper to reset mocks
export const resetMocks = () => {
  mockNavigate.mockClear();
  mockParams = {};
};

export { mockNavigate };
