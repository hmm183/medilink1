// Navbar where the dropdown is:
import React, { useState } from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import { useLang } from "../../context/LangContext"; // ✅ import context
import MigrantModal from "../modals/MigrantModal";
import DoctorModal from "../modals/DoctorModal";


const Navbar = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [showMigrantModal, setShowMigrantModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // ✅ from LangContext
  const { language, setLanguage, t, languages } = useLang();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleThemeAndLightToggle = () => {
    toggleDarkMode();
  };

  const changeLanguage = (code) => {
    setLanguage(code); // ✅ update context
    setShowLangMenu(false);
  };
  
  const redirectToAuth = () => {
    window.location.href = "/auth";
  };

  return (
    <>
      <nav className="bg-white dark:bg-gray-900 shadow-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center text-2xl font-bold text-blue-600 dark:text-blue-400">
              <a href="/">SwiftMediLink</a>
            </div>

            {/* Navbar Links */}
            <div className="hidden md:flex space-x-6 items-center">
              <a href="/" className="text-gray-800 dark:text-gray-200 hover:text-blue-500">
                {t('home')}
              </a>
              <a href="#about" className="text-gray-800 dark:text-gray-200 hover:text-blue-500">
                {t('about')}
              </a>
              <a href="#features" className="text-gray-800 dark:text-gray-200 hover:text-blue-500">
                {t('services')}
              </a>
              <a href="#contact" className="text-gray-800 dark:text-gray-200 hover:text-blue-500">
                {t('contact')}
              </a>

              {/* Doctor Sign In (redirects to /auth) */}
              <button
                onClick={() => setShowDoctorModal(true)}
                className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
              >
                {t('doctorSignIn')}
              </button>

              {/* Patient Sign In (redirects to /auth) */}
              <button
                onClick={redirectToAuth}
                className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700"
              >
                {t('patientSignIn')}
              </button>

              {/* Language Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="px-3 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {language.toUpperCase()} ▼
                </button>
                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                    {languages.map((lang) => (
                      <button
                        key={lang.value}
                        onClick={() => changeLanguage(lang.value)}
                        className="block px-4 py-2 text-sm w-full text-left hover:bg-gray-100 dark:text-gray-200"
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark/Light Toggle */}
              <button
                onClick={handleThemeAndLightToggle}
                className="ml-4 text-gray-800 dark:text-gray-200 focus:outline-none"
              >
                {darkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* Modals */}
      <DoctorModal show={showDoctorModal} onClose={() => setShowDoctorModal(false)} />
      <MigrantModal show={showMigrantModal} onClose={() => setShowMigrantModal(false)} />
    </>
  );
};

export default Navbar;