// components/patient/PatientDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import {
  ClipboardList, FileText, Pill, History, Trash2, Edit, Save, XCircle, ArchiveRestore, RefreshCw, PlusCircle,
} from 'lucide-react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
//import '../../App.css';

// 🌐 Import your custom LangContext and useLang hook
import { useLang } from '../../context/LangContext';

// Backend URL from the new file
const BACKEND_URL = 'http://localhost:5000/api/v1';

// Custom tooltip (from the old file's design)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-lg p-3 shadow-lg bg-white/90 dark:bg-gray-900/90
                   text-gray-900 dark:text-gray-100 backdrop-blur-md"
      >
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm">
            {entry.name}: <span className="font-medium">{entry.value}</span>
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

export default function PatientDashboard() {
  // 🌐 Use the custom hook to get translation function, language data, and the translateText function
  const { language, setLanguage, t, languages, translateText } = useLang();

  const [init, setInit] = useState(false);

  // ✅ State from the new file
  const [historySummary, setHistorySummary] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionCount, setPrescriptionCount] = useState(0);

  // Notes state
  const [patientNote, setPatientNote] = useState('');
  const [notesList, setNotesList] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Health summary state
  const [healthSummary, setHealthSummary] = useState(null);
  const [displayedSummary, setDisplayedSummary] = useState(''); // NEW STATE
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [showPrompt, setShowPrompt] = useState(false);

  // Patient ID from JWT
  const [patientId, setPatientId] = useState(null);

  // NEW: dynamic readings state
  const [dailyReadings, setDailyReadings] = useState([]);

  // Custom states from the OLD file, but note that the functionality is not implemented
  const [newCurrentMed, setNewCurrentMed] = useState({ name: '', dosage: '', frequency: '' });

  // helper: parse JSON when possible, otherwise return text wrapper
  async function parseResponse(res) {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        return await res.json();
      } catch (err) {
        return { success: false, message: 'Invalid JSON response' };
      }
    }
    const text = await res.text();
    return { success: false, message: text };
  }

  // ---------- Notes API (from working code) ----------
  const fetchNotes = async (pId) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('fetchNotes: no auth token; skipping.');
      return;
    }
    if (!pId) {
      console.warn('fetchNotes: no patientId; skipping.');
      return;
    }

    try {
      const url = `${BACKEND_URL}/notes/patient/${pId}?includeArchived=${showArchived}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) {
        const text = await res.text();
        console.error('fetchNotes failed:', res.status, text.slice(0, 400));
        if (res.status === 404) setNotesList([]);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        const data = Array.isArray(json) ? json : json.data ?? json;
        setNotesList(Array.isArray(data) ? data : []);
      } else {
        const text = await res.text();
        console.error('fetchNotes: expected JSON but got:', text.slice(0, 400));
        setNotesList([]);
      }
    } catch (err) {
      console.error('fetchNotes network error:', err);
    }
  };

  // create note
  const handleCreateNote = async (noteText) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('createNote: no auth token');
      return;
    }
    if (!patientId) {
      console.warn('createNote: no patientId');
      return;
    }
    const trimmed = (noteText || '').trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`${BACKEND_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ noteText: trimmed, patientId }),
      });

      const parsed = await parseResponse(res);
      if (!res.ok || parsed?.success === false) {
        console.error('create note failed:', res.status, parsed);
        return;
      }

      const newNote = parsed.data ?? parsed;
      setNotesList((prev) => [newNote, ...prev]);
      setPatientNote('');
    } catch (err) {
      console.error('create note network error:', err);
    }
  };

  // onKeyDown handler for textarea: Enter to submit
  const handleNoteSubmit = async (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await handleCreateNote(patientNote);
    }
  };

  // update an existing note
  const handleUpdateNote = async (noteId) => {
    const token = localStorage.getItem('authToken');
    if (!token || !patientId) {
      console.warn('updateNote: missing token or patientId');
      return;
    }
    const trimmed = (editingText || '').trim();
    if (!trimmed) {
      console.warn('updateNote: empty text, skipping');
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/notes/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ noteText: trimmed, patientId }),
      });

      const parsed = await parseResponse(res);
      if (!res.ok || parsed?.success === false) {
        console.error('updateNote failed:', res.status, parsed);
        return;
      }

      const updated = parsed.data ?? parsed;
      setNotesList((prev) => prev.map((n) => (n._id === noteId ? updated : n)));
      setEditingNoteId(null);
      setEditingText('');
    } catch (err) {
      console.error('updateNote network error:', err);
    }
  };

  // delete (soft) a note
  const handleDeleteNote = async (noteId) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    if (!patientId) {
      console.warn('deleteNote: no patientId; skipping.');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patientId }),
      });
      const parsed = await parseResponse(res);
      if (!res.ok) {
        console.error('deleteNote failed:', res.status, parsed);
        return;
      }
      setNotesList((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      console.error('deleteNote network error:', err);
    }
  };

  // restore an archived note
  const handleRestoreNote = async (noteId) => {
    const token = localStorage.getItem('authToken');
    if (!token || !patientId) {
      console.warn('restoreNote: missing token or patientId');
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/notes/${noteId}/restore`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patientId }),
      });
      const parsed = await parseResponse(res);
      if (!res.ok || parsed?.success === false) {
        console.error('restoreNote failed:', res.status, parsed);
        return;
      }
      const restored = parsed.data ?? parsed;
      setNotesList((prev) => prev.map((n) => (n._id === noteId ? restored : n)));
    } catch (err) {
      console.error('restoreNote network error:', err);
    }
  };

  // ---------- Health Summary API (from working code) ----------
  const fetchHealthSummary = async (pId) => {
    setSummaryError('');
    setSummaryLoading(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
      setSummaryError('Not authenticated.');
      setSummaryLoading(false);
      return;
    }
    if (!pId) {
      setSummaryError('Missing patientId.');
      setSummaryLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/summary/patient/${pId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 404) {
          setHealthSummary(null);
          setSummaryLoading(false);
          return;
        }
        const text = await res.text();
        setSummaryError(`Failed to fetch summary: ${res.status}`);
        console.error('fetchHealthSummary failed:', res.status, text.slice(0, 400));
        setSummaryLoading(false);
        return;
      }
      const json = await res.json();
      setHealthSummary(json);
      setSummaryLoading(false);
    } catch (err) {
      console.error('fetchHealthSummary network error:', err);
      setSummaryError('Network error while fetching summary.');
      setSummaryLoading(false);
    }
  };

  // ------------------- MODIFIED FUNCTION TO INCLUDE TRANSLATION -------------------
  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    setSummaryError('');
    const token = localStorage.getItem('authToken');
    if (!token) {
      setSummaryError('Not authenticated.');
      setGeneratingSummary(false);
      return;
    }
    if (!patientId) {
      setSummaryError('Missing patientId.');
      setGeneratingSummary(false);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/summary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ patientId }),
      });

      const parsed = await parseResponse(res);

      if (!res.ok) {
        console.error('generate summary failed:', res.status, parsed);
        setSummaryError(parsed?.message || parsed?.error || 'Failed to generate summary.');
        setGeneratingSummary(false);
        return;
      }

      const newSummary = {
        summaryContent: parsed.healthSummary,
        generatedAt: new Date().toISOString(),
        sourceData: parsed.source,
      };

      setHealthSummary(newSummary); // Update the original summary first
      setShowPrompt(false);
    } catch (err) {
      console.error('generate summary network error:', err);
      setSummaryError('Network error while generating summary.');
    } finally {
      setGeneratingSummary(false);
    }
  };
  // ----------------- END OF MODIFIED FUNCTION -----------------

  // NEW useEffect to handle translation on language or summary change
  useEffect(() => {
    const translateSummaryForDisplay = async () => {
      if (healthSummary) {
        if (language !== 'en') {
          try {
            const translatedTexts = await translateText(healthSummary.summaryContent, language);
            setDisplayedSummary(translatedTexts[0]);
          } catch (translationError) {
            console.error('Translation failed:', translationError);
            setDisplayedSummary(healthSummary.summaryContent); // Fallback to original
          }
        } else {
          setDisplayedSummary(healthSummary.summaryContent); // Use original English text
        }
      } else {
        setDisplayedSummary(''); // Reset if no summary exists
      }
    };

    translateSummaryForDisplay();
  }, [language, healthSummary, translateText]);

  // ---------- Medicine status update (from working code) ----------
  const handleStatusUpdate = async (prescriptionId, medicineId, newStatus) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn('No auth token; cannot update medicine status.');
      return;
    }
    try {
      const response = await fetch(
        `${BACKEND_URL}/prescriptions/${prescriptionId}/medicines/${medicineId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!response.ok) {
        const text = await response.text();
        console.error('Failed to update medicine status:', response.status, text.slice(0, 400));
        return;
      }
      setPrescriptions((prev) =>
        prev.map((p) =>
          p._id === prescriptionId
            ? {
                ...p,
                medicines: (p.medicines ?? []).map((m) =>
                  m._id === medicineId ? { ...m, status: newStatus } : m
                ),
              }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to update medicine status:', err);
    }
  };

  // Add medicine functionality from OLD code (now a placeholder as in previous response)
  const addMedicine = (type) => {
    alert("Functionality not implemented with the new backend. Medicines are fetched from prescriptions.");
  };

  // Save note functionality from OLD code (now uses the new API logic from working code)
  const saveNote = () => handleCreateNote(patientNote);

  // ---------- NEW: Fetch daily readings ----------
  const fetchDailyReadings = async (pId) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/readings/patient/${pId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.error('Failed to fetch daily readings:', res.status);
        return;
      }
      const data = await res.json();
      setDailyReadings(Array.isArray(data) ? data : data.data ?? []);
    } catch (error) {
      console.error('Error fetching daily readings:', error);
    }
  };

  // ---------- Fetch initial data ----------
  useEffect(() => {
    initParticlesEngine(async (engine) => await loadSlim(engine)).then(() => setInit(true));
    const token = localStorage.getItem('authToken');
    if (!token) return;

    let decoded;
    try {
      decoded = jwtDecode(token);
    } catch (err) {
      console.error('Invalid token:', err);
      return;
    }
    const pId = decoded?.id;
    setPatientId(pId);
    if (!pId) return;

    // fetch history summary
    (async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/history/patient/${pId}/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          console.error('history summary failed', resp.status);
          return;
        }
        const json = await resp.json();
        setHistorySummary(json.data ?? json);
      } catch (err) {
        console.error('Error fetching history summary:', err);
      }
    })();

    // fetch prescriptions
    (async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/prescriptions/patient/${pId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) {
          console.error('prescriptions fetch failed', resp.status);
          return;
        }
        const json = await resp.json();
        const list = json.data ?? json;
        setPrescriptions(Array.isArray(list) ? list : []);
        setPrescriptionCount(Array.isArray(list) ? list.length : 0);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
      }
    })();

    // initial notes fetch
    fetchNotes(pId);

    // fetch health summary if exists
    fetchHealthSummary(pId);

    // fetch dynamic readings for chart
    fetchDailyReadings(pId);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // refetch notes when showArchived toggles
  useEffect(() => {
    if (patientId) fetchNotes(patientId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  // derived lists
  const currentMeds = (prescriptions ?? []).flatMap((p) =>
    (p.medicines ?? [])
      .filter((m) => m.status === 'current')
      .map((m) => ({ ...m, prescriptionId: p._id }))
  );
  const pastMeds = (prescriptions ?? []).flatMap((p) =>
    (p.medicines ?? [])
      .filter((m) => m.status === 'past')
      .map((m) => ({ ...m, prescriptionId: p._id }))
  );

  const activeNotes = notesList.filter((n) => !n.isArchived);
  const archivedNotes = notesList.filter((n) => n.isArchived);

  // Format the readings for the chart (sorted chronologically)
  const formattedHealthData = [...dailyReadings]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((reading) => ({
      day: reading.date ? new Date(reading.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
      s: reading.bloodPressure?.systolic ?? null,
      d: reading.bloodPressure?.diastolic ?? null,
      w: reading.weightKg ?? null,
      p: reading.pulseRate ?? null,
    }));

  // Particles config (from the old file's design)
  const particlesOptions = {
    background: { color: "transparent" },
    fpsLimit: 60,
    interactivity: { events: { onHover: { enable: true, mode: "repulse" }, onClick: { enable: true, mode: "push" } },
      modes: { repulse: { distance: 100 }, push: { quantity: 4 } },
    },
    particles: {
      number: { value: 60, density: { enable: true, area: 800 } },
      size: { value: 2 }, move: { enable: true, speed: 1 }, links: { enable: true, color: "#60a5fa", opacity: 0.4, distance: 150 },
      opacity: { value: 0.5 }, color: { value: "#60a5fa" },
    },
    detectRetina: true,
  };

  // Helper to format date
  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative">
      {/* {init && (
        <Particles
          id="tsparticles"
          options={particlesOptions}
          className="absolute inset-0 -z-10"
        />
      )} */}
      <div className="pt-24 p-6">

        {/* 🌐 Language Switcher */}
        {/* <div className="absolute  right-6 z-20">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-sm text-gray-800 dark:text-gray-100"
          >
            {languages.map(lang => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div> */}

        {/* 📊 Graph Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            className="lg:col-span-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl
                       border border-white/10 dark:border-gray-700 rounded-2xl shadow-xl p-6
                       hover:shadow-2xl hover:border-indigo-400/40 transition-all duration-300"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {t('healthTrends')}
              </h2>
              {/* --- Link to the detailed readings page --- */}
              <Link to="/patient/readings" className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                {t('seeAllReadings')}
              </Link>
            </div>

            {/* --- Dynamic chart (uses formattedHealthData) --- */}
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedHealthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-700" />
                <XAxis dataKey="day" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="s" name={t('systolic')} stroke="#6366f1" strokeWidth={3} dot />
                <Line type="monotone" dataKey="d" name={t('diastolic')} stroke="#f59e0b" strokeWidth={3} dot />
                <Line type="monotone" dataKey="w" name={t('weight')} stroke="#10b981" strokeWidth={3} dot />
                {/* Pulse rate line */}
                <Line type="monotone" dataKey="p" name={t('pulse')} stroke="#ef4444" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* 📌 Stats Cards */}
          <div className="flex flex-col gap-6">
            <motion.div
              className={`bg-gradient-to-r from-indigo-500 to-indigo-700 text-white rounded-2xl shadow-lg p-6
                          flex items-center justify-between transition-all duration-300`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.07, boxShadow: "0 0 25px rgba(99,102,241,0.7)" }}
            >
              <div>
                <h3 className="text-lg font-semibold">{t('hospitalVisits')}</h3>
                <p className="text-4xl font-extrabold mt-2">12</p>
              </div>
              <div className="opacity-90">
                <ClipboardList size={42} />
              </div>
            </motion.div>
            <motion.div
              className={`bg-gradient-to-r from-emerald-500 to-emerald-700 text-white rounded-2xl shadow-lg p-6
                          flex items-center justify-between transition-all duration-300`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              whileHover={{ scale: 1.07, boxShadow: "0 0 25px rgba(16,185,129,0.7)" }}
            >
              <div>
                <h3 className="text-lg font-semibold">{t('prescriptionsStored')}</h3>
                <p className="text-4xl font-extrabold mt-2">{prescriptionCount}</p>
              </div>
              <div className="opacity-90">
                <FileText size={42} />
              </div>
            </motion.div>
          </div>
        </div>

        ---

        {/* 💊 Medicines Section */}
        <motion.div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Current Medicines */}
          <motion.div
            className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl
                       border border-white/10 dark:border-gray-700 rounded-2xl shadow-lg p-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(59,130,246,0.5)" }}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Pill className="mr-2 text-blue-500" /> {t('currentMedicines')}
            </h3>
            <ul className="space-y-3 mb-4">
              {currentMeds.length > 0 ? (
                currentMeds.map((med) => (
                  <motion.li
                    key={med._id}
                    className="flex justify-between items-center bg-gray-100/50 dark:bg-gray-700/50
                               p-3 rounded-lg hover:scale-[1.02] transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{med.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {med.dosage} — {med.frequency}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStatusUpdate(med.prescriptionId, med._id, 'past')}
                      title={t('markAsPast')}
                      className="p-2 rounded-full text-yellow-600 hover:bg-yellow-200 dark:hover:bg-gray-600 transition"
                    >
                      <History size={18} />
                    </button>
                  </motion.li>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">{t('noCurrentMedicines')}</p>
              )}
            </ul>
            {/* The old "Add" functionality is a placeholder. */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={t('medicineNamePlaceholder')}
                value={newCurrentMed.name}
                onChange={(e) => setNewCurrentMed({ ...newCurrentMed, name: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <button
                onClick={() => addMedicine('current')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-1 hover:bg-blue-700"
              >
                <PlusCircle size={18} /> {t('add')}
              </button>
            </div>
          </motion.div>

          {/* Past Medicines (new card) */}
          <motion.div
            className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/10 dark:border-gray-700 rounded-2xl shadow-lg p-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(16,185,129,0.5)" }}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <History className="mr-2 text-gray-500" /> {t('pastMedicines')}
            </h3>
            <ul className="space-y-3 mb-4">
              {pastMeds.length > 0 ? (
                pastMeds.map((med) => (
                  <motion.li
                    key={med._id}
                    className="flex justify-between items-center bg-gray-100/50 dark:bg-gray-700/50
                               p-3 rounded-lg opacity-70 hover:scale-[1.02] transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{med.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {med.dosage} — {med.frequency}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStatusUpdate(med.prescriptionId, med._id, 'current')}
                      title={t('markAsCurrent')}
                      className="p-2 rounded-full text-green-600 hover:bg-green-200 dark:hover:bg-gray-600 transition"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </motion.li>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">{t('noPastMedicines')}</p>
              )}
            </ul>
          </motion.div>
        </motion.div>

        ---

        {/* 🏥 Disease History & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Disease History */}
          <motion.div
            className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/10 dark:border-gray-700 shadow-lg rounded-2xl p-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(99,102,241,0.6)" }}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t('diseaseHistory')}
            </h3>
            <ul className="space-y-2 mb-4">
              {historySummary && historySummary.length > 0 ? (
                historySummary.map((record, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300">
                    {record.illnessName} ({record.diagnosisYear})
                  </li>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">{t('noHistoryFound')}</p>
              )}
            </ul>
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Link to="/patient/history">{t('seeMore')}</Link>
            </motion.button>
          </motion.div>

          {/* Notes */}
          <motion.div
            className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/10 dark:border-gray-700 shadow-lg rounded-2xl p-6"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(16,185,129,0.6)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('patientNotes')}
              </h3>
              <label className="flex items-center text-sm cursor-pointer text-gray-600 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={() => setShowArchived(!showArchived)}
                  className="mr-2 h-4 w-4 rounded"
                />
                {t('showArchived')}
              </label>
            </div>

            <ul className="space-y-2 mb-4">
              {activeNotes.length > 0 ? (
                activeNotes.map((note) => (
                  <li key={note._id} className="flex justify-between items-center bg-gray-100/50 dark:bg-gray-700/50 p-2 rounded-md group">
                    {editingNoteId === note._id ? (
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="flex-grow bg-transparent border-b border-indigo-500 focus:outline-none text-gray-800 dark:text-white"
                      />
                    ) : (
                      <span className="text-gray-800 dark:text-gray-200">- {note.noteText}</span>
                    )}

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingNoteId === note._id ? (
                        <>
                          <button onClick={() => handleUpdateNote(note._id)} className="text-green-500 hover:text-green-400" title={t('save')}>
                            <Save size={16} />
                          </button>
                          <button onClick={() => { setEditingNoteId(null); setEditingText(''); }} className="text-gray-500 hover:text-gray-400" title={t('cancel')}>
                            <XCircle size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingNoteId(note._id); setEditingText(note.noteText); }} className="text-blue-500 hover:text-blue-400" title={t('edit')}>
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteNote(note._id)} className="text-red-500 hover:text-red-400" title={t('delete')}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400">{t('noNotesFound')}</p>
              )}
            </ul>

            {showArchived && archivedNotes.length > 0 && (
              <>
                <h4 className="text-md font-semibold text-gray-600 dark:text-gray-400 mt-6 mb-2">
                  {t('archivedNotes')}
                </h4>
                <ul className="space-y-2 mb-4">
                  {archivedNotes.map((note) => (
                    <li key={note._id} className="flex justify-between items-center bg-gray-200/50 dark:bg-gray-800/50 p-2 rounded-md opacity-60">
                      <span className="line-through">- {note.noteText}</span>
                      <button onClick={() => handleRestoreNote(note._id)} className="text-green-500 hover:text-green-400" title={t('restoreNote')}>
                        <ArchiveRestore size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <textarea
              placeholder={t('writeNotePlaceholder')}
              value={patientNote}
              onChange={(e) => setPatientNote(e.target.value)}
              onKeyDown={handleNoteSubmit}
              className="w-full h-32 px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-900 dark:text-white"
            ></textarea>

            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={saveNote}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              {t('saveNote')}
            </motion.button>
          </motion.div>
        </div>

        ---

        {/* 📝 Health Summary */}
        <motion.div
          className="mt-6 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl
                     border border-white/10 dark:border-gray-700 shadow-lg rounded-2xl p-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileHover={{ scale: 1.01, boxShadow: "0 0 25px rgba(59,130,246,0.5)" }}
        >
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('healthSummary')}
            </h3>
            <div className="flex items-center gap-2">
              {healthSummary && <small className="text-sm text-gray-500 dark:text-gray-400 mr-2">{t('lastUpdated', { date: formatDate(healthSummary.generatedAt ?? healthSummary.updatedAt ?? healthSummary.createdAt) })}</small>}
              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary}
                className={`px-3 py-1 rounded-md text-sm ${generatingSummary ? 'bg-gray-400 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                {generatingSummary ? t('generating') : (healthSummary ? t('regenerate') : t('generate'))}
              </button>
            </div>
          </div>
          {summaryLoading ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">{t('loadingSummary')}</div>
          ) : summaryError ? (
            <div className="p-4 bg-red-50 dark:bg-red-900 text-red-700 rounded-md">
              {t('error')}: {summaryError}
            </div>
          ) : healthSummary ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                {displayedSummary}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <small className="text-xs text-gray-500 dark:text-gray-400">
                  {t('generatedAt', { date: formatDate(healthSummary.generatedAt ?? healthSummary.updatedAt ?? healthSummary.createdAt) })}
                </small>
                <button onClick={() => setShowPrompt((s) => !s)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
                  {showPrompt ? t('hidePrompt') : t('showPrompt')}
                </button>
              </div>
              {showPrompt && (
                <pre className="mt-3 p-3 bg-white dark:bg-black/60 rounded-md text-xs text-gray-700 dark:text-gray-200 overflow-auto whitespace-pre-wrap">
                  {healthSummary.sourceData ?? t('noPromptSaved')}
                </pre>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {t('noSummaryFound')}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
