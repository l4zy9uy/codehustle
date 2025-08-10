import {MantineProvider, Container} from '@mantine/core';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';
import {Notifications} from '@mantine/notifications';
import {BrowserRouter} from 'react-router-dom';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
    <MantineProvider withGlobalStyles withNormalizeCSS
                     theme={{
                         fontFamily: 'Poppins, sans-serif',    // ← apply custom font
                         headings: {fontFamily: 'Poppins, sans-serif'},
                     }}>
        {/* Global notification container (only one!) */}
        <Notifications position="top-right" limit={5}/>
        <BrowserRouter>
            <App/>
        </BrowserRouter>
    </MantineProvider>
);
