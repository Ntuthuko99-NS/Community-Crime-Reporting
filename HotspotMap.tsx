import { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, TrendingUp } from 'lucide-react';
import { supabase, Hotspot, Incident } from '../lib/supabase';

export default function HotspotMap() {
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  useEffect(() => {
    fetchHotspotsAndIncidents();
  }, []);

  const fetchHotspotsAndIncidents = async () => {
    try {
      const [hotspotsResult, incidentsResult] = await Promise.all([
        supabase.from('hotspots').select('*').order('severity_score', { ascending: false }),
        supabase.from('incidents').select('*').order('timestamp', { ascending: false }).limit(50)
      ]);

      if (hotspotsResult.data) setHotspots(hotspotsResult.data);
      if (incidentsResult.data) setIncidents(incidentsResult.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (score: number) => {
    if (score >= 8) return 'bg-red-500';
    if (score >= 5) return 'bg-orange-500';
    if (score >= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSeverityLabel = (score: number) => {
    if (score >= 8) return 'Critical';
    if (score >= 5) return 'High';
    if (score >= 3) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading hotspot data...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Crime Hotspots</h2>
        </div>
        <p className="text-red-50">High-risk areas based on recent incident patterns</p>
      </div>

      <div className="p-6">
        {hotspots.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hotspots identified yet</p>
            <p className="text-sm mt-2">Hotspots will appear as incidents are reported</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotspots.map((hotspot) => (
                <div
                  key={hotspot.id}
                  onClick={() => setSelectedHotspot(hotspot)}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(hotspot.severity_score)}`} />
                      <span className="font-semibold text-gray-800">
                        {getSeverityLabel(hotspot.severity_score)} Risk
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{hotspot.crime_count} incidents</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">
                        {hotspot.location_lat.toFixed(4)}, {hotspot.location_lng.toFixed(4)}
                      </span>
                    </div>

                    {hotspot.dominant_crime_type && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Common: {hotspot.dominant_crime_type}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Radius: {hotspot.radius_meters}m
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedHotspot && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-900 mb-2">Selected Hotspot Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Severity Score:</span>
                    <span className="ml-2 font-medium">{selectedHotspot.severity_score.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Incidents:</span>
                    <span className="ml-2 font-medium">{selectedHotspot.crime_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedHotspot.last_updated).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Coverage:</span>
                    <span className="ml-2 font-medium">{selectedHotspot.radius_meters}m radius</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Incidents Map View</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-sm text-gray-800">{incident.type}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    incident.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    incident.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {incident.severity}
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{incident.location_lat.toFixed(4)}, {incident.location_lng.toFixed(4)}</span>
                  </div>
                  <div>
                    {new Date(incident.timestamp).toLocaleDateString()} {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
