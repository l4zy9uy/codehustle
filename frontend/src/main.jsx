import {MantineProvider, Container} from '@mantine/core';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import './index.css';
import {Notifications} from '@mantine/notifications';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Optionally enable API mocking in dev via env flag
if (import.meta.env.VITE_ENABLE_API_MOCKS === 'true') {
  // Top-level await is supported by Vite
  const { enableApiMocking } = await import('./lib/api/mock');
  enableApiMocking();
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <MantineProvider withGlobalStyles withNormalizeCSS
                     theme={{
                         fontFamily: 'Inter, sans-serif',    // ← apply custom font
                         headings: {fontFamily: 'Inter, sans-serif'},
                     }}>
        {/* Global notification container (only one!) */}
        <Notifications position="top-right" limit={5}/>
        <BrowserRouter>
            <AuthProvider>
                <App/>
            </AuthProvider>
        </BrowserRouter>
    </MantineProvider>
);
