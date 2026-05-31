import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, Users, Activity, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Define the full base URL for your backend API
const BACKEND_URL = 'http://localhost:5000';

// A custom hook for debouncing to prevent excessive API calls while typing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ patientsBeingCured: 0, patientsDischarged: 0, totalPatients: 0 });
  const [patients, setPatients] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch stats and patient lists on component load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken'); 
        const headers = { 
          'Authorization': token,
          'Content-Type': 'application/json'
        };

        // Fetch statistics
        const statsRes = await fetch(`${BACKEND_URL}/api/v1/patients/statistics`, { headers });
        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.statistics);

        // Fetch patients "under treatment"
        const patientsRes = await fetch(`${BACKEND_URL}/api/v1/patients?status=under treatment`, { headers });
        if (!patientsRes.ok) throw new Error('Failed to fetch patients');
        const patientsData = await patientsRes.json();
        setPatients(patientsData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Optionally set an error state to show a message to the user
      }
    };
    fetchData();
  }, []);

  // Effect for handling debounced search
  useEffect(() => {
    const searchPatients = async () => {
      if (debouncedSearchTerm.length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${BACKEND_URL}/api/v1/patients/search?q=${debouncedSearchTerm}`, { 
          headers: { 'Authorization': token } 
        });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Error searching patients:", error);
      } finally {
        setIsSearching(false);
      }
    };
    searchPatients();
  }, [debouncedSearchTerm]);

  const handleSelectPatient = (patient) => {
    navigate(`/patient/${patient._id}`);
  };

  const statCards = [
    { title: "Total Patients", value: stats.totalPatients, icon: <Users size={42}/>, color: "from-indigo-500 to-indigo-700" },
    { title: "Currently Treating", value: stats.patientsBeingCured, icon: <Activity size={42}/>, color: "from-rose-500 to-rose-700" },
    { title: "Patients Discharged", value: stats.patientsDischarged, icon: <UserCheck size={42}/>, color: "from-green-500 to-green-700" },
  ];

  // ... the rest of your component (the return statement with JSX) remains the same
  return (
    <div className="pt-20 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Doctor's Dashboard</h1>
      
      {/* Search Bar */}
      <div className="relative max-w-lg mb-8">
        <div className="flex items-center border rounded-lg overflow-hidden shadow-sm bg-white">
          <Search className="ml-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Search patient by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 outline-none"
          />
        </div>
        {(searchResults.length > 0 || isSearching) && (
          <ul className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
            {isSearching ? <li className="px-4 py-2 text-gray-500">Searching...</li> :
             searchResults.map((patient) => (
              <li key={patient._id} onClick={() => handleSelectPatient(patient)} className="px-4 py-2 cursor-pointer hover:bg-gray-100">
                {patient.fullName}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            className={`bg-gradient-to-r ${stat.color} text-white rounded-2xl shadow-lg p-6 flex items-center justify-between`}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
          >
            <div>
              <h3 className="text-lg font-semibold">{stat.title}</h3>
              <p className="text-4xl font-extrabold mt-2">{stat.value}</p>
            </div>
            <div className="opacity-80">{stat.icon}</div>
          </motion.div>
        ))}
      </div>

      {/* Patient List */}
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Patients Currently Under Treatment</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.length > 0 ? patients.map((patient) => (
                <tr key={patient._id}>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{patient.age}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(patient.updatedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleSelectPatient(patient)} className="text-indigo-600 hover:text-indigo-900">
                      View Profile
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">No patients currently under treatment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}