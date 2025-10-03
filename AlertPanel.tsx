import { useState, useEffect } from 'react';
import { Bell, BellOff, AlertCircle, MapPin, CheckCircle } from 'lucide-react';
import { supabase, Alert } from '../lib/supabase';

interface AlertsPanelProps {
  userId: string;
}

export default function AlertsPanel({ userId }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  useEffect(() => {
    fetchAlerts();

    const subscription = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId, filter]);

  const fetchAlerts = async () => {
    try {
      let query = supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filter === 'unread') {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(alerts.map(alert =>
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'hotspot':
        return <MapPin className="w-5 h-5 text-orange-600" />;
      case 'community':
        return <Bell className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'incident':
        return 'border-red-200 bg-red-50';
      case 'hotspot':
        return 'border-orange-200 bg-orange-50';
      case 'community':
        return 'border-blue-200 bg-blue-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Alerts</h2>
              <p className="text-blue-50 text-sm">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({alerts.length})
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BellOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No alerts to display</p>
            <p className="text-sm mt-2">
              {filter === 'unread' ? "You're all caught up!" : "Alerts will appear here when available"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border rounded-lg p-4 transition-all ${
                  alert.is_read ? 'border-gray-200 bg-white' : getAlertColor(alert.alert_type)
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">{getAlertIcon(alert.alert_type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-800">{alert.title}</h3>
                      {!alert.is_read && (
                        <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                      )}
                    </div>

                    <p className="text-gray-700 text-sm mb-3">{alert.message}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(alert.created_at).toLocaleString()}
                      </span>

                      {!alert.is_read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
