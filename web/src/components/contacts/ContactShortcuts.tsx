import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  QrCode, 
  Search, 
  Filter, 
  Users,
  Calendar,
  MapPin,
  MessageCircle,
  Star,
  Clock
} from 'lucide-react';

interface ContactShortcutsProps {
  onQuickAdd: () => void;
  onImport: () => void;
  onGenerateQR: () => void;
  onSearch: (query: string) => void;
  onFilter: (filter: string) => void;
  totalContacts: number;
  recentContacts: number;
  upcomingFollowUps: number;
}

export function ContactShortcuts({
  onQuickAdd,
  onImport,
  onGenerateQR,
  onSearch,
  onFilter,
  totalContacts,
  recentContacts,
  upcomingFollowUps
}: ContactShortcutsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const quickActions = [
    {
      id: 'add-contact',
      title: 'Add Contact',
      description: 'Quickly add a new contact',
      icon: Plus,
      color: 'bg-blue-500',
      action: onQuickAdd
    },
    {
      id: 'import-contacts',
      title: 'Import Contacts',
      description: 'Import from CSV or add manually',
      icon: Upload,
      color: 'bg-green-500',
      action: onImport
    },
    {
      id: 'generate-qr',
      title: 'Generate QR',
      description: 'Create your networking QR code',
      icon: QrCode,
      color: 'bg-purple-500',
      action: onGenerateQR
    }
  ];

  const filters = [
    { id: 'all', label: 'All Contacts', count: totalContacts },
    { id: 'recent', label: 'Recent', count: recentContacts },
    { id: 'followups', label: 'Follow-ups', count: upcomingFollowUps },
    { id: 'starred', label: 'Starred', count: 0 }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
  };

  const handleFilter = (filterId: string) => {
    setActiveFilter(filterId === activeFilter ? null : filterId);
    onFilter(filterId === activeFilter ? '' : filterId);
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{totalContacts}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Recent</p>
              <p className="text-2xl font-bold text-gray-900">{recentContacts}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingFollowUps}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex space-x-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilter(filter.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
                  {filter.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center`}>
                  {React.createElement(action.icon, { className: "w-5 h-5 text-white" })}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{action.title}</h4>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">💡 Quick Tips</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Use the search bar to quickly find contacts by name, email, or company</li>
          <li>• Import contacts from CSV to add multiple people at once</li>
          <li>• Generate QR codes to make networking easier at events</li>
          <li>• Set follow-up reminders to stay connected with important contacts</li>
        </ul>
      </div>
    </div>
  );
}

// Default export for better compatibility
export default ContactShortcuts;
