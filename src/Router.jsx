import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import App from "@/App";
import Profile from "@/pages/Profile";

export default function MainRouter() {
  return (
    <Router>
      <nav className="p-4 bg-gray-100 text-sm flex justify-end gap-4">
        <Link to="/" className="text-blue-600 hover:underline">Home</Link>
        <Link to="/profile" className="text-blue-600 hover:underline">Profile</Link>
      </nav>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Router>
  );
}
