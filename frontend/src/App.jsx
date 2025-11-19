import { Navigate, Routes, Route } from 'react-router-dom';
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import AppLayout from "./components/AppLayout";
import ProblemLayout from "./components/ProblemLayout";
import Problems from "./pages/Problems";
import Courses from "./pages/Courses";
import Submissions from "./pages/Submissions";
import Home from "./pages/Home";
import Contests from "./pages/Contests";
import ContestDetail from "./pages/ContestDetail";
import ProfilePage from "./pages/Profile";
import ProblemPage from "./pages/SingleProblem";
import CourseDetail from "./pages/CourseDetail";
import ProblemEditor from "./pages/admin/problems/ProblemEditor";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ContestCreate from "./pages/admin/ContestCreate";
import GoogleAuthCallback from "./pages/GoogleAuthCallback";

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
            <Route path="auth/google/callback" element={<GoogleAuthCallback />} />
            <Route path=""         element={<LandingPage />} />
            <Route element={<AppLayout />}>
                {/* Problems page (list) */}
                <Route path="problems" element={<Problems />} />
                <Route path="courses" element={<Courses />} />
                <Route path="courses/:id" element={<CourseDetail />} />
                <Route path="submissions" element={<Submissions />} />
                <Route path="contests" element={<Contests />} />
                <Route path="contests/:id" element={<ContestDetail />} />
                <Route path="contests/new" element={<ContestCreate />} />
                {/* Home (Announcements) page */}
                <Route path="home/*" element={<Home />} />
                <Route path="problems/new" element={<ProblemEditor />} />
                <Route path="problems/:id/edit" element={<ProblemEditor />} />
                <Route path="admin" element={<AdminDashboard />} />
                <Route path="profile" element={
                    <ProfilePage
                        user={mockUser}
                        stats={mockStats}
                        recentSubmissions={mockRecentSubmissions}
                    />
                } />
            </Route>
            {/* Full-bleed layout for single problem */}
            <Route element={<ProblemLayout />}>
                <Route path="problems/:slug" element={<ProblemPage />} />
            </Route>
            {/* Catch-all (also sends anything else back to login) */}
            {/*<Route path="*" element={<Navigate to="/login" replace />} />*/}
        </Routes>
    );
}
