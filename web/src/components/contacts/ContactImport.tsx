import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  X,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { supabase } from '@dislink/shared/lib/supabase';
import { logger } from '@dislink/shared/lib/logger';
import { useAuth } from '../auth/AuthProvider';

interface ImportContact {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
}

interface ContactImportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedCount: number) => void;
}

export function ContactImport({ isOpen, onClose, onImportComplete }: ContactImportProps) {
  const { user } = useAuth();
  const [importMethod, setImportMethod] = useState<'csv' | 'manual' | null>(null);
  const [csvData, setCsvData] = useState<ImportContact[]>([]);
  const [manualContacts, setManualContacts] = useState<ImportContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setError('CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'email'];
      
      if (!requiredHeaders.every(h => headers.includes(h))) {
        setError('CSV must have "name" and "email" columns');
        return;
      }

      const contacts: ImportContact[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 2 && values[0] && values[1]) {
          const contact: ImportContact = {
            name: values[headers.indexOf('name')] || '',
            email: values[headers.indexOf('email')] || '',
            phone: values[headers.indexOf('phone')] || '',
            company: values[headers.indexOf('company')] || '',
            jobTitle: values[headers.indexOf('jobtitle')] || values[headers.indexOf('job_title')] || '',
            notes: values[headers.indexOf('notes')] || ''
          };
          contacts.push(contact);
        }
      }

      setCsvData(contacts);
      setError(null);
    } catch (err) {
      setError('Error parsing CSV file. Please check the format.');
      logger.error('CSV parsing error:', err);
    }
  };

  const addManualContact = () => {
    setManualContacts([...manualContacts, {
      name: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      notes: ''
    }]);
  };

  const updateManualContact = (index: number, field: keyof ImportContact, value: string) => {
    const updated = [...manualContacts];
    updated[index] = { ...updated[index], [field]: value };
    setManualContacts(updated);
  };

  const removeManualContact = (index: number) => {
    setManualContacts(manualContacts.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (!user) return;

    const contactsToImport = importMethod === 'csv' ? csvData : manualContacts;
    const validContacts = contactsToImport.filter(c => c.name && c.email);

    if (validContacts.length === 0) {
      setError('No valid contacts to import');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let importedCount = 0;
      
      for (const contact of validContacts) {
        // Check if contact already exists
        const { data: existing } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .eq('email', contact.email)
          .single();

        if (existing) {
          logger.info('Contact already exists, skipping:', contact.email);
          continue;
        }

        // Create new contact
        const { error: insertError } = await supabase
          .from('contacts')
          .insert({
            user_id: user.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone || null,
            company: contact.company || null,
            job_title: contact.jobTitle || null,
            notes: contact.notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          logger.error('Error importing contact:', insertError);
          continue;
        }

        importedCount++;
      }

      setSuccess(true);
      onImportComplete(importedCount);
      
      // Reset form
      setTimeout(() => {
        setImportMethod(null);
        setCsvData([]);
        setManualContacts([]);
        setSuccess(false);
        onClose();
      }, 2000);

    } catch (err) {
      setError('Failed to import contacts. Please try again.');
      logger.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,email,phone,company,jobtitle,notes\nJohn Doe,john@example.com,+1234567890,Acme Corp,Software Engineer,Met at conference';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Import Contacts</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Import Successful!
                </h3>
                <p className="text-gray-600">
                  Your contacts have been imported successfully.
                </p>
              </div>
            ) : !importMethod ? (
              // Import Method Selection
              <div>
                <p className="text-gray-600 mb-6">
                  Choose how you'd like to import your contacts:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setImportMethod('csv')}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Import from CSV
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload a CSV file with your contacts
                      </p>
                      <button
                        onClick={downloadTemplate}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Download Template
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-6 border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setImportMethod('manual')}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        Add Manually
                      </h3>
                      <p className="text-sm text-gray-600">
                        Enter contacts one by one
                      </p>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : importMethod === 'csv' ? (
              // CSV Import
              <div>
                <div className="mb-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Click to upload CSV file</p>
                    <p className="text-sm text-gray-500 mt-1">
                      or drag and drop your file here
                    </p>
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                {csvData.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">
                        Preview ({csvData.length} contacts)
                      </h3>
                      <button
                        onClick={() => setPreviewMode(!previewMode)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{previewMode ? 'Hide' : 'Show'} Preview</span>
                      </button>
                    </div>

                    {previewMode && (
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">Name</th>
                              <th className="px-3 py-2 text-left">Email</th>
                              <th className="px-3 py-2 text-left">Company</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvData.slice(0, 10).map((contact, index) => (
                              <tr key={index} className="border-t border-gray-200">
                                <td className="px-3 py-2">{contact.name}</td>
                                <td className="px-3 py-2">{contact.email}</td>
                                <td className="px-3 py-2">{contact.company}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {csvData.length > 10 && (
                          <p className="p-3 text-sm text-gray-500 text-center">
                            ... and {csvData.length - 10} more contacts
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setImportMethod(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={csvData.length === 0 || loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Importing...' : `Import ${csvData.length} Contacts`}
                  </button>
                </div>
              </div>
            ) : (
              // Manual Import
              <div>
                <div className="mb-4">
                  <button
                    onClick={addManualContact}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <Users className="w-4 h-4" />
                    <span>Add Contact</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {manualContacts.map((contact, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">
                          Contact {index + 1}
                        </h4>
                        <button
                          onClick={() => removeManualContact(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Name *"
                          value={contact.name}
                          onChange={(e) => updateManualContact(index, 'name', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="email"
                          placeholder="Email *"
                          value={contact.email}
                          onChange={(e) => updateManualContact(index, 'email', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Phone"
                          value={contact.phone}
                          onChange={(e) => updateManualContact(index, 'phone', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={contact.company}
                          onChange={(e) => updateManualContact(index, 'company', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Job Title"
                          value={contact.jobTitle}
                          onChange={(e) => updateManualContact(index, 'jobTitle', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="Notes"
                          value={contact.notes}
                          onChange={(e) => updateManualContact(index, 'notes', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setImportMethod(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={manualContacts.length === 0 || loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Importing...' : `Import ${manualContacts.length} Contacts`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
