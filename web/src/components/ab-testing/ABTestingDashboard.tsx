/**
 * A/B Testing Dashboard
 * Comprehensive experiment management and results visualization
 */

import React, { useState, useEffect } from 'react';
import { useExperimentManagement } from '../../hooks/useABTesting';

interface ExperimentFormData {
  name: string;
  description: string;
  trafficAllocation: number;
  variants: Array<{
    name: string;
    description: string;
    trafficWeight: number;
    isControl: boolean;
    configuration: Record<string, any>;
  }>;
  metrics: Array<{
    name: string;
    type: 'conversion' | 'engagement' | 'revenue' | 'custom';
    goal: 'increase' | 'decrease' | 'neutral';
    weight: number;
  }>;
}

export const ABTestingDashboard: React.FC = () => {
  const {
    experiments,
    isLoading,
    error,
    createExperiment,
    updateExperiment,
    startExperiment,
    pauseExperiment,
    completeExperiment,
    getExperimentResults,
    getExperimentStats
  } = useExperimentManagement();

  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [experimentResults, setExperimentResults] = useState<any[]>([]);
  const [formData, setFormData] = useState<ExperimentFormData>({
    name: '',
    description: '',
    trafficAllocation: 100,
    variants: [
      { name: 'Control', description: 'Control variant', trafficWeight: 50, isControl: true, configuration: {} },
      { name: 'Variant A', description: 'Test variant A', trafficWeight: 50, isControl: false, configuration: {} }
    ],
    metrics: [
      { name: 'Conversion', type: 'conversion', goal: 'increase', weight: 100 }
    ]
  });

  useEffect(() => {
    if (selectedExperiment) {
      loadExperimentResults(selectedExperiment);
    }
  }, [selectedExperiment, getExperimentResults]);

  const loadExperimentResults = async (experimentId: string) => {
    try {
      const results = await getExperimentResults(experimentId);
      setExperimentResults(results);
    } catch (error) {
      console.error('Failed to load experiment results:', error);
    }
  };

  const handleCreateExperiment = async () => {
    try {
      await createExperiment({
        name: formData.name,
        description: formData.description,
        status: 'draft',
        startDate: new Date().toISOString(),
        trafficAllocation: formData.trafficAllocation,
        variants: formData.variants.map((v, index) => ({
          id: `variant_${index}`,
          name: v.name,
          description: v.description,
          trafficWeight: v.trafficWeight,
          isControl: v.isControl,
          configuration: v.configuration
        })),
        targeting: {},
        metrics: formData.metrics.map((m, index) => ({
          id: `metric_${index}`,
          name: m.name,
          type: m.type,
          goal: m.goal,
          weight: m.weight
        }))
      });

      setShowCreateForm(false);
      setFormData({
        name: '',
        description: '',
        trafficAllocation: 100,
        variants: [
          { name: 'Control', description: 'Control variant', trafficWeight: 50, isControl: true, configuration: {} },
          { name: 'Variant A', description: 'Test variant A', trafficWeight: 50, isControl: false, configuration: {} }
        ],
        metrics: [
          { name: 'Conversion', type: 'conversion', goal: 'increase', weight: 100 }
        ]
      });
    } catch (error) {
      console.error('Failed to create experiment:', error);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'paused':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'completed':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'draft':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading && experiments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">A/B Testing Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage experiments and analyze results</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Experiment
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Experiments List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Experiments List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Experiments</h2>
            <div className="space-y-4">
              {experiments.map((experiment) => (
                <div
                  key={experiment.id}
                  className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-colors ${
                    selectedExperiment === experiment.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedExperiment(experiment.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{experiment.name}</h3>
                      <p className="text-gray-600">{experiment.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(experiment.status)}`}>
                      {experiment.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Traffic Allocation</div>
                      <div className="font-semibold">{formatPercentage(experiment.trafficAllocation)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Variants</div>
                      <div className="font-semibold">{experiment.variants.length}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Created: {formatDate(experiment.createdAt)}
                    </div>
                    <div className="flex space-x-2">
                      {experiment.status === 'draft' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startExperiment(experiment.id);
                          }}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          Start
                        </button>
                      )}
                      {experiment.status === 'running' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            pauseExperiment(experiment.id);
                          }}
                          className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                        >
                          Pause
                        </button>
                      )}
                      {experiment.status === 'running' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            completeExperiment(experiment.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experiment Details */}
          <div className="lg:col-span-1">
            {selectedExperiment ? (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Experiment Details</h2>
                {(() => {
                  const experiment = experiments.find(e => e.id === selectedExperiment);
                  if (!experiment) return null;

                  const stats = getExperimentStats(experiment.id);

                  return (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{experiment.name}</h3>
                        <p className="text-gray-600 text-sm">{experiment.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-500">Participants</div>
                          <div className="font-semibold">{stats.totalParticipants}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Conversions</div>
                          <div className="font-semibold">{stats.totalConversions}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Conversion Rate</div>
                          <div className="font-semibold">{formatPercentage(stats.averageConversionRate)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Significance</div>
                          <div className={`font-semibold ${stats.statisticalSignificance ? 'text-green-600' : 'text-gray-600'}`}>
                            {stats.statisticalSignificance ? 'Yes' : 'No'}
                          </div>
                        </div>
                      </div>

                      {experimentResults.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Variant Results</h4>
                          <div className="space-y-2">
                            {experimentResults.map((result) => (
                              <div key={result.variantId} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">{result.variantId}</div>
                                    <div className="text-sm text-gray-600">
                                      {result.participants} participants
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">{formatPercentage(result.conversionRate)}</div>
                                    <div className="text-sm text-gray-600">
                                      {result.confidence.toFixed(1)}% confidence
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="text-center text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No experiment selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select an experiment to view details and results.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Experiment Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Experiment</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Experiment Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Traffic Allocation (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.trafficAllocation}
                      onChange={(e) => setFormData({ ...formData, trafficAllocation: parseInt(e.target.value) })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateExperiment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create Experiment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
