// src/components/HotspotMap.jsx
import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

const HotspotMap = () => {
  const [apiKey, setApiKey] = useState("");
  const [hotspots, setHotspots] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState("Chickenpox");

  const center = { lat: 16.5208, lng: 80.5233 }; // Default: Vijayawada

  // Fetch API key once
  useEffect(() => {
    const fetchKey = async () => {
      try {
        const keyRes = await fetch("http://localhost:5000/api/v1/config/maps");
        const keyData = await keyRes.json();
        setApiKey(keyData.apiKey);
      } catch (err) {
        console.error("Error fetching API key:", err);
      }
    };
    fetchKey();
  }, []);

  // Fetch cases whenever disease changes
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/v1/hotspots?illnessName=${selectedDisease}`
        );
        const cases = await res.json();
        setHotspots(cases);
      } catch (err) {
        console.error("Error fetching cases:", err);
      }
    };

    if (selectedDisease) fetchCases();
  }, [selectedDisease]);

  if (!apiKey) return <p>Loading map...</p>;

  return (
    <div className="w-full">
      {/* Dropdown for disease selection */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Select Disease:</label>
        <select
          value={selectedDisease}
          onChange={(e) => setSelectedDisease(e.target.value)}
          className="border rounded px-2 py-9"
        >
          <option value="Chickenpox">Chickenpox</option>
          <option value="Malaria">Malaria</option>
          <option value="Dengue">Dengue</option>
          <option value="COVID-19">COVID-19</option>
          <option value="Typhoid">Typhoid</option>
        </select>
      </div>

      {/* Map */}
      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "500px" }}
          center={center}
          zoom={12}
        >
          {hotspots.map((hotspot, idx) => (
            <Marker
              key={idx}
              position={{
                lat: hotspot.location.coordinates[1], // DB stores [lng, lat]
                lng: hotspot.location.coordinates[0],
              }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </div>
  );
};

export default HotspotMap;
