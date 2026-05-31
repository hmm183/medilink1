import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CustomNavbar from "./components/common/NavBar";
import LandingPage from "./components/landing/LandingPage";
import "./index.css";
import "./App.css";
import Footer from "./components/common/Footer";
import PatientDashboard from "./components/patient/PatientDashboard";
import DoctorDashboard from "./components/doctor/DoctorDashboard";
import DiseaseHistory from "./components/patient/DiseaseHistory";
import PrescriptionPage from './components/patient/Prescriptions';
import AuthPage from './components/AuthPage';
import DailyReadingsPage from './components/patient/DailyReadingsPage';
import DoctorAuth from './components/doctor/DoctorAuth';
import PatientProfile from './components/patient/PatientProfile';
import DiseasePrediction from "./components/common/image_test";
import HotspotMap from "./components/common/HotspotMap";

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Apply Tailwind dark class to <html>
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <Router>
      <div
        className={
          darkMode
            ? "dark bg-gray-900 text-white min-h-screen flex flex-col"
            : "bg-white text-gray-900 min-h-screen flex flex-col"
        }
      >
        {/* Navbar always visible */}
        <CustomNavbar darkMode={darkMode} setDarkMode={setDarkMode} />

        {/* Routes */}
        <main className="flex-grow dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<LandingPage darkMode={darkMode} />} />
            <Route path="/patient/dashboard" element={<PatientDashboard />} />
            <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
            <Route path="/patient/history" element={<DiseaseHistory />} />
            <Route path="/patient/prescriptions" element={<PrescriptionPage />} />
            <Route path="/patient/readings" element={<DailyReadingsPage />} />
            <Route path="/doctor/auth" element={<DoctorAuth />} />
            <Route path="/patient/:id" element={<PatientProfile />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/disease-prediction" element={<DiseasePrediction />} />

            {/* ✅ HotspotMap integrated with default props */}
            <Route
              path="/hotspot-map"
              element={
                <HotspotMap
                  disease="Chickenpox"
                  center={{ lat: 28.6139, lng: 77.2090 }} // Default: New Delhi
                  radius={10} // km
                />
              }
            />
          </Routes>
        </main>

        {/* Footer always visible */}
        <Footer darkMode={darkMode} />
      </div>
    </Router>
  );
}

export default App;
