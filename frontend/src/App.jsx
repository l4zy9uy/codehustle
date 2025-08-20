import { Navigate, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import AppLayout from "./components/AppLayout.jsx";
import StudentHome from "./pages/StudentHome.jsx";
import Problems from "./pages/Problems.jsx";
import Courses from "./pages/Courses.jsx";
import Submissions from "./pages/Submissions.jsx";
import Announcements from "./pages/Announcements.jsx";
import ProblemPage from "./pages/SingleProblem.jsx";

export default function App() {
    return (
        <Routes>
            {/* Redirect root path */}
            {/*<Route index element={<Navigate to="/login" replace />} />*/}

            {/* Your existing routes */}
            <Route path="login"         element={<Login />} />
            <Route path=""         element={<LandingPage />} />
            <Route element={<AppLayout />}>
                <Route path="home" element={<StudentHome />} />
                <Route path="problems" element={<Problems />} />
                <Route path="problems/:slug" element={<ProblemPage />} />
                <Route path="courses" element={<Courses />} />
                <Route path="submissions" element={<Submissions />} />
                <Route path="announcements" element={<Announcements />} />
            </Route>
            {/* Catch-all (also sends anything else back to login) */}
            {/*<Route path="*" element={<Navigate to="/login" replace />} />*/}
        </Routes>
    );
}
