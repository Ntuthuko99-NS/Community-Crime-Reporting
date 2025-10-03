import { useState, useEffect } from 'react';
import { Shield, FileText, Map, Bell, Users, Menu, X, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useAuth } from './lib/auth';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import IncidentReportForm from './components/IncidentReportForm';
import HotspotMap from './components/HotspotMap';
import AlertsPanel from './components/AlertsPanel';
import NeighbourhoodWatch from './components/NeighbourhoodWatch';

type TabType = 'dashboard' | 'report' | 'hotspots' | 'alerts' | 'watch';

function App() {
  const { user, userId, loading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchUnreadAlerts();

      const subscription = supabase
        .channel('alerts_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'alerts'
          },
          () => {
            fetchUnreadAlerts();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [userId]);

  const fetchUnreadAlerts = async () => {
    if (!userId) return;

    const { count } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    setUnreadAlerts(count || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: Shield },
    { id: 'report' as TabType, label: 'Report Incident', icon: FileText },
    { id: 'hotspots' as TabType, label: 'Hotspots', icon: Map },
    { id: 'alerts' as TabType, label: 'Alerts', icon: Bell, badge: unreadAlerts },
    { id: 'watch' as TabType, label: 'Watch Groups', icon: Users }
  ];

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <nav className="bg-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">SafeWatch SA</h1>
                <p className="text-xs text-gray-500">Community Safety Platform</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={signOut}
                className="ml-2 px-4 py-2 rounded-lg font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center gap-3 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={signOut}
                className="w-full px-4 py-3 rounded-lg font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-3"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && userId && <Dashboard userId={userId} />}
        {activeTab === 'report' && userId && (
          <IncidentReportForm
            userId={userId}
            onSuccess={() => {
              setActiveTab('dashboard');
            }}
          />
        )}
        {activeTab === 'hotspots' && <HotspotMap />}
        {activeTab === 'alerts' && userId && <AlertsPanel userId={userId} />}
        {activeTab === 'watch' && userId && <NeighbourhoodWatch userId={userId} />}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
            <p className="font-semibold mb-1">SafeWatch SA - Community Crime Reporting Platform</p>
            <p className="text-xs text-gray-500">
              Working together to create safer communities across South Africa
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
