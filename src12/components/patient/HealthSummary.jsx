import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5000/api/v1';

export default function HealthSummary({ patientId }) {
  // State to manage the summary content and loading status
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Function to call the backend and generate a new summary
  const handleGenerateSummary = async () => {
    if (!patientId) {
      setError('Patient ID is missing. Cannot generate summary.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSummary(null);

    try {
      const response = await fetch(`${BACKEND_URL}/summary/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patientId }), // Send patientId in the body
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setSummary(data.healthSummary); // Set the summary from the response

    } catch (err) {
      console.error("Error generating summary:", err);
      setError(err.message); // Display the error to the user
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      className="mt-6 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl border border-white/10 dark:border-gray-700 shadow-lg rounded-2xl p-6"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
        <BrainCircuit className="mr-2 text-indigo-500" /> AI Health Summary
      </h3>

      {/* Conditional rendering based on state */}
      {isGenerating ? (
        <p className="text-gray-600 dark:text-gray-300">Generating your AI summary, please wait...</p>
      ) : error ? (
        <div className="text-red-500 bg-red-100 dark:bg-red-900/50 p-3 rounded-lg">
          <p className="font-semibold">An Error Occurred</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : summary ? (
        <div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{summary}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleGenerateSummary}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
          >
            Regenerate Summary
          </motion.button>
        </div>
      ) : (
        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Generate an AI-powered summary of your health records for a concise overview.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={handleGenerateSummary}
            disabled={isGenerating}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Generate My Summary
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}