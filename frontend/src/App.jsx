import { Navigate, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Problems from "./pages/Problems.jsx";
import Courses from "./pages/Courses.jsx";
import Submissions from "./pages/Submissions.jsx";
import Home from "./pages/Home.jsx";
import ProfilePage from "./pages/Profile.jsx";
import ProblemPage from "./pages/SingleProblem.jsx";

// Add mock data for ProfilePage
const mockUser = { handle: 'john_doe', displayName: 'John Doe', avatarUrl: 'https://i.pravatar.cc/150?img=3' };
const mockStats = { total: 123, easy: 77, medium: 35, hard: 11 };
const mockRecentSubmissions = [
  { id: '5', problemTitle: '3Sum', verdict: 'AC', language: 'Java', submittedAt: '2025-01-05T18:15:00Z' },
  { id: '6', problemTitle: 'Valid Parentheses', verdict: 'AC', language: 'C++', submittedAt: '2025-01-06T19:55:00Z' },
];

export default function App() {
    return (
        <Routes>
            {/* Redirect root path */}
            {/*<Route index element={<Navigate to="/login" replace />} />*/}

            {/* Your existing routes */}
            <Route path="login"         element={<Login />} />
            <Route path=""         element={<LandingPage />} />
            <Route element={<AppLayout />}>
                {/* Problems page */}
                <Route path="problems" element={<Problems />} />
                <Route path="problems/:slug" element={<ProblemPage />} />
                <Route path="courses" element={<Courses />} />
                <Route path="submissions" element={<Submissions />} />
                {/* Home (Announcements) page */}
                <Route path="home/*" element={<Home />} />
                <Route path="profile" element={
                    <ProfilePage
                        user={mockUser}
                        stats={mockStats}
                        recentSubmissions={mockRecentSubmissions}
                    />
                } />
            </Route>
            {/* Catch-all (also sends anything else back to login) */}
            {/*<Route path="*" element={<Navigate to="/login" replace />} />*/}
        </Routes>
    );
}
