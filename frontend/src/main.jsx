import {MantineProvider, Container} from '@mantine/core';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import './index.css';
import {Notifications} from '@mantine/notifications';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';

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
