import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  Filter,
  Flame,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Info,
  Calendar,
  Eye
} from 'lucide-react';
import { DetectionRecord, HotspotItem } from '../types';
import { fetchDetections, fetchHotspots } from '../services/api';
import { Language, translations } from '../locales/translations';

interface MapPageProps {
  language: Language;
  onNavigateToPrediction: (obsId: string) => void;
}

export const MapPage: React.FC<MapPageProps> = ({ language, onNavigateToPrediction }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);

  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showHotspotCircles, setShowHotspotCircles] = useState<boolean>(true);
  const [showObservationMarkers, setShowObservationMarkers] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const t = translations[language];

  // Load data
  const loadMapData = async () => {
    try {
      setLoading(true);
      const [detRes, hotRes] = await Promise.all([
        fetchDetections(undefined, undefined, 100),
        fetchHotspots()
      ]);
      setDetections(detRes.detections);
      setHotspots(hotRes.hotspots);
    } catch (err) {
      console.error('Error fetching map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMapData();
  }, []);

  // Initialize Leaflet map instance once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Centered around Indian Ocean / Bay of Bengal Coromandel Coast
    const map = L.map(mapContainerRef.current, {
      center: [13.0500, 80.2824],
      zoom: 11,
      minZoom: 3,
      maxZoom: 18
    });

    // Dark Matter basemap tiles (CartoDB)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    hotspotsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map layers on data / filter change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !hotspotsLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    hotspotsLayerRef.current.clearLayers();

    // 1. Render DBSCAN Hotspot Circles
    if (showHotspotCircles) {
      hotspots.forEach((h) => {
        const hpiColor =
          h.priority_level === 'critical'
            ? '#ef4444'
            : h.priority_level === 'high'
            ? '#f59e0b'
            : h.priority_level === 'medium'
            ? '#06b6d4'
            : '#10b981';

        const circle = L.circle([h.centroid_lat, h.centroid_lon], {
          color: hpiColor,
          fillColor: hpiColor,
          fillOpacity: 0.18,
          weight: 2,
          radius: Math.max(300, h.radius_meters)
        });

        circle.bindPopup(`
          <div class="p-2 space-y-2 text-xs">
            <div class="flex items-center justify-between border-b border-slate-700 pb-1">
              <span class="font-bold text-white">${h.location_name}</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style="background:${hpiColor}22; color:${hpiColor}">
                HPI ${h.hotspot_priority_index} (${h.priority_level})
              </span>
            </div>
            <p class="text-slate-300">${h.explanation}</p>
            <div class="flex justify-between text-[11px] text-slate-400">
              <span>Waste Items: <strong class="text-white">${h.total_waste_count}</strong></span>
              <span>Observations: <strong class="text-white">${h.observation_count}</strong></span>
            </div>
          </div>
        `);

        hotspotsLayerRef.current?.addLayer(circle);
      });
    }

    // 2. Render Verified Observation Markers
    if (showObservationMarkers) {
      const filtered = detections.filter((d) => {
        if (selectedStatus !== 'all' && d.verification_status !== selectedStatus) return false;
        if (selectedCategory !== 'all' && !d.detected_counts[selectedCategory]) return false;
        if (searchTerm && !d.location_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      });

      filtered.forEach((d) => {
        // Custom HTML Marker Icon
        const iconHtml = `
          <div style="
            background: linear-gradient(135deg, #06b6d4, #0284c7);
            border: 2px solid #ffffff;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 10px rgba(6, 182, 212, 0.6);
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
          ">
            ${d.total_objects}
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-marine-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([d.latitude, d.longitude], { icon: customIcon });

        const popupContent = `
          <div class="p-2 space-y-2 text-xs min-w-[200px]">
            <h4 class="font-bold text-white">${d.location_name}</h4>
            <div class="flex items-center space-x-2 text-[10px] text-slate-400">
              <span>Source: <strong class="text-cyan-400">${d.location_source}</strong></span>
              <span>•</span>
              <span class="capitalize">${d.verification_status}</span>
            </div>
            <div class="text-[11px] text-slate-300">
              Total Plastics Detected: <strong class="text-cyan-400 font-bold">${d.total_objects}</strong>
            </div>
            ${
              d.annotated_image_url
                ? `<img src="${d.annotated_image_url}" class="w-full h-24 object-cover rounded mt-1 border border-slate-700" alt="Annotated thumbnail"/>`
                : ''
            }
          </div>
        `;

        marker.bindPopup(popupContent);
        markersLayerRef.current?.addLayer(marker);
      });
    }
  }, [detections, hotspots, selectedCategory, selectedStatus, showHotspotCircles, showObservationMarkers, searchTerm]);

  return (
    <div className="space-y-6 pb-16">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t.nav.map}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {language === 'en'
              ? 'Interactive GIS marine pollution monitoring, DBSCAN cluster density, and ground-truth coordinates.'
              : 'நிகழ்நேர புவியியல் கடல் மாசு வரைபடம் மற்றும் கழிவு குவிப்பு மண்டலங்கள்.'}
          </p>
        </div>

        <button
          onClick={loadMapData}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>{language === 'en' ? 'Refresh Map' : 'வரைபடத்தை புதுப்பி'}</span>
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="glass-panel p-4 rounded-xl border border-cyan-900/30 flex flex-wrap items-center gap-4 text-xs">
        {/* Search */}
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder={language === 'en' ? 'Search beach or location...' : 'கடற்கரை அல்லது இடத்தை தேடுக...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-white placeholder-slate-500 focus:outline-none w-full text-xs"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Polymers</option>
            <option value="plastic_bottle">Plastic Bottles</option>
            <option value="plastic_bag">Plastic Bags</option>
            <option value="food_container">Food Containers</option>
            <option value="fishing_gear">Fishing Gear / Nets</option>
            <option value="plastic_fragment">Plastic Fragments</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified GPS Only</option>
            <option value="pending">Pending Field Audit</option>
          </select>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center space-x-4 pl-2 border-l border-slate-800">
          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showHotspotCircles}
              onChange={(e) => setShowHotspotCircles(e.target.checked)}
              className="accent-amber-500"
            />
            <span>Hotspots (HPI)</span>
          </label>
          <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showObservationMarkers}
              onChange={(e) => setShowObservationMarkers(e.target.checked)}
              className="accent-cyan-500"
            />
            <span>Observations</span>
          </label>
        </div>
      </div>

      {/* Map Container */}
      <div className="glass-panel p-2 rounded-2xl border border-cyan-900/30 overflow-hidden relative shadow-2xl">
        <div
          ref={mapContainerRef}
          className="w-full h-[620px] rounded-xl"
        />

        {/* Map Legend Overlay */}
        <div className="absolute bottom-6 left-6 z-[1000] glass-panel-subtle p-3 rounded-xl border border-slate-800 text-[11px] space-y-1.5 shadow-xl max-w-xs pointer-events-auto">
          <div className="font-bold text-white text-xs mb-1 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Map Layers Legend</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block" />
            <span className="text-slate-300">Observation Marker (Count Badge)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="text-slate-300">Critical Hotspot (HPI ≥ 70)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-300">High Hotspot (HPI 50-69)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-300">Medium/Low Density Cluster</span>
          </div>
        </div>
      </div>
    </div>
  );
};
