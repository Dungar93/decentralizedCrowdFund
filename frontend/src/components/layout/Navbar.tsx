import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";


export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-purple-900 text-white px-6 py-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <RouterLink to="/" className="text-2xl font-bold hover:opacity-80 transition">
          MedTrustFund
        </RouterLink>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-purple-500 rounded-lg transition"
            aria-label="Toggle theme"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          {isAuthenticated ? (
            <>
              <RouterLink
                to="/dashboard"
                className="hover:bg-purple-500 px-4 py-2 rounded-lg transition"
              >
                Dashboard
              </RouterLink>
              <RouterLink
                to="/create"
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-100 transition"
              >
                Create Campaign
              </RouterLink>
              <RouterLink
                to="/hospital"
                className="border border-white px-4 py-2 rounded-lg hover:bg-purple-500 transition"
              >
                Hospital Portal
              </RouterLink>
              <RouterLink
                to="/login"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                }}
                className="border border-white px-4 py-2 rounded-lg hover:bg-purple-500 transition"
              >
                Logout
              </RouterLink>
            </>
          ) : (
            <>
              <RouterLink
                to="/login"
                className="hover:bg-purple-500 px-4 py-2 rounded-lg transition"
              >
                Login
              </RouterLink>
              <RouterLink
                to="/signup"
                className="bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold hover:bg-purple-100 transition"
              >
                Sign Up
              </RouterLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
