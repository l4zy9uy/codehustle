import { Navigate, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login.jsx";
import LandingPage from "./pages/LandingPage.jsx";

export default function App() {
    return (
        <Routes>
            {/* Redirect root path */}
            {/*<Route index element={<Navigate to="/login" replace />} />*/}

            {/* Your existing routes */}
            <Route path="login"         element={<Login />} />
            <Route path=""         element={<LandingPage />} />
            …
            {/* Catch-all (also sends anything else back to login) */}
            {/*<Route path="*" element={<Navigate to="/login" replace />} />*/}
        </Routes>
    );
}
