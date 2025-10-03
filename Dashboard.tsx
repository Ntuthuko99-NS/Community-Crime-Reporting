import { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { supabase, Incident } from '../lib/supabase';

interface DashboardProps {
  userId: string;
}

interface Stats {
  totalIncidents: number;
  recentIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
}

export default function Dashboard({ userId }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({
    totalIncidents: 0,
    recentIncidents: 0,
    criticalIncidents: 0,
    resolvedIncidents: 0
  });
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: allIncidents } = await supabase
        .from('incidents')
        .select('*')
        .order('timestamp', { ascending: false });

      if (allIncidents) {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recentCount = allIncidents.filter(
          i => new Date(i.timestamp) >= weekAgo
        ).length;

        const criticalCount = allIncidents.filter(
          i => i.severity === 'critical' && i.status !== 'resolved'
        ).length;

        const resolvedCount = allIncidents.filter(
          i => i.status === 'resolved'
        ).length;

        setStats({
          totalIncidents: allIncidents.length,
          recentIncidents: recentCount,
          criticalIncidents: criticalCount,
          resolvedIncidents: resolvedCount
        });

        setRecentIncidents(allIncidents.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'reported_to_saps':
        return 'bg-blue-100 text-blue-800';
      case 'verified':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Incidents</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalIncidents}</p>
            </div>
            <Activity className="w-10 h-10 text-blue-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Recent (7 Days)</p>
              <p className="text-3xl font-bold text-gray-800">{stats.recentIncidents}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Critical Active</p>
              <p className="text-3xl font-bold text-gray-800">{stats.criticalIncidents}</p>
            </div>
            <AlertTriangle className="w-10 h-10 text-red-500 opacity-80" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Resolved</p>
              <p className="text-3xl font-bold text-gray-800">{stats.resolvedIncidents}</p>
            </div>
            <Clock className="w-10 h-10 text-purple-500 opacity-80" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white">
          <h2 className="text-2xl font-bold">Recent Incidents</h2>
          <p className="text-slate-200 text-sm mt-1">Latest crime reports in your area</p>
        </div>

        <div className="p-6">
          {recentIncidents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No incidents reported yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Severity</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentIncidents.map((incident) => (
                    <tr key={incident.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">
                        {incident.type}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">
                        {incident.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(incident.timestamp).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(incident.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
