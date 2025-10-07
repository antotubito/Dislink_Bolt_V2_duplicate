/**
 * Advanced A/B Testing Framework
 * Comprehensive experiment management with statistical analysis and targeting
 */

import { supabase } from '@dislink/shared/lib/supabase';
import { analytics } from '@dislink/shared/lib/analytics';

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  trafficAllocation: number; // 0-100
  variants: ExperimentVariant[];
  targeting: ExperimentTargeting;
  metrics: ExperimentMetric[];
  createdAt: string;
  updatedAt: string;
}

interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  trafficWeight: number; // 0-100
  configuration: Record<string, any>;
  isControl: boolean;
}

interface ExperimentTargeting {
  userIds?: string[];
  userSegments?: string[];
  deviceTypes?: ('desktop' | 'mobile' | 'tablet')[];
  browsers?: string[];
  countries?: string[];
  customRules?: Record<string, any>;
}

interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'revenue' | 'custom';
  goal: 'increase' | 'decrease' | 'neutral';
  weight: number; // 0-100
  targetValue?: number;
}

interface ExperimentAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: string;
  isActive: boolean;
}

interface ExperimentResult {
  experimentId: string;
  variantId: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  statisticalSignificance: boolean;
  metrics: Record<string, number>;
}

class ABTestingFramework {
  private experiments: Map<string, Experiment> = new Map();
  private assignments: Map<string, ExperimentAssignment> = new Map();
  private results: Map<string, ExperimentResult[]> = new Map();

  constructor() {
    this.loadExperiments();
  }

  /**
   * Create a new experiment
   */
  async createExperiment(experiment: Omit<Experiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateExperimentId();
    const now = new Date().toISOString();
    
    const newExperiment: Experiment = {
      ...experiment,
      id,
      createdAt: now,
      updatedAt: now
    };

    // Save to database
    const { error } = await supabase
      .from('experiments')
      .insert([{
        id,
        name: newExperiment.name,
        description: newExperiment.description,
        status: newExperiment.status,
        start_date: newExperiment.startDate,
        end_date: newExperiment.endDate,
        traffic_allocation: newExperiment.trafficAllocation,
        variants: newExperiment.variants,
        targeting: newExperiment.targeting,
        metrics: newExperiment.metrics,
        created_at: now,
        updated_at: now
      }]);

    if (error) {
      throw new Error(`Failed to create experiment: ${error.message}`);
    }

    this.experiments.set(id, newExperiment);
    return id;
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): Experiment | null {
    return this.experiments.get(experimentId) || null;
  }

  /**
   * Get all experiments
   */
  getExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Update experiment
   */
  async updateExperiment(experimentId: string, updates: Partial<Experiment>): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const updatedExperiment = {
      ...experiment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const { error } = await supabase
      .from('experiments')
      .update({
        name: updatedExperiment.name,
        description: updatedExperiment.description,
        status: updatedExperiment.status,
        start_date: updatedExperiment.startDate,
        end_date: updatedExperiment.endDate,
        traffic_allocation: updatedExperiment.trafficAllocation,
        variants: updatedExperiment.variants,
        targeting: updatedExperiment.targeting,
        metrics: updatedExperiment.metrics,
        updated_at: updatedExperiment.updatedAt
      })
      .eq('id', experimentId);

    if (error) {
      throw new Error(`Failed to update experiment: ${error.message}`);
    }

    this.experiments.set(experimentId, updatedExperiment);
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentId: string): Promise<void> {
    await this.updateExperiment(experimentId, {
      status: 'running',
      startDate: new Date().toISOString()
    });
  }

  /**
   * Pause an experiment
   */
  async pauseExperiment(experimentId: string): Promise<void> {
    await this.updateExperiment(experimentId, { status: 'paused' });
  }

  /**
   * Complete an experiment
   */
  async completeExperiment(experimentId: string): Promise<void> {
    await this.updateExperiment(experimentId, {
      status: 'completed',
      endDate: new Date().toISOString()
    });
  }

  /**
   * Assign user to experiment variant
   */
  async assignUserToExperiment(userId: string, experimentId: string): Promise<string | null> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user is already assigned
    const existingAssignment = this.assignments.get(`${userId}-${experimentId}`);
    if (existingAssignment && existingAssignment.isActive) {
      return existingAssignment.variantId;
    }

    // Check targeting rules
    if (!this.isUserEligible(userId, experiment.targeting)) {
      return null;
    }

    // Check traffic allocation
    if (!this.shouldIncludeUser(userId, experiment.trafficAllocation)) {
      return null;
    }

    // Assign variant based on traffic weights
    const variantId = this.selectVariant(experiment.variants);
    
    const assignment: ExperimentAssignment = {
      userId,
      experimentId,
      variantId,
      assignedAt: new Date().toISOString(),
      isActive: true
    };

    // Save assignment to database
    const { error } = await supabase
      .from('experiment_assignments')
      .insert([{
        user_id: userId,
        experiment_id: experimentId,
        variant_id: variantId,
        assigned_at: assignment.assignedAt,
        is_active: true
      }]);

    if (error) {
      console.error('Failed to save experiment assignment:', error);
      return null;
    }

    this.assignments.set(`${userId}-${experimentId}`, assignment);

    // Track experiment assignment
    analytics.trackEvent('experiment_assigned', {
      experiment_id: experimentId,
      variant_id: variantId,
      user_id: userId
    });

    return variantId;
  }

  /**
   * Get user's assigned variant for an experiment
   */
  getUserVariant(userId: string, experimentId: string): string | null {
    const assignment = this.assignments.get(`${userId}-${experimentId}`);
    return assignment && assignment.isActive ? assignment.variantId : null;
  }

  /**
   * Track experiment conversion
   */
  async trackConversion(userId: string, experimentId: string, metricId: string, value: number = 1): Promise<void> {
    const variantId = this.getUserVariant(userId, experimentId);
    if (!variantId) {
      return;
    }

    // Save conversion to database
    const { error } = await supabase
      .from('experiment_conversions')
      .insert([{
        user_id: userId,
        experiment_id: experimentId,
        variant_id: variantId,
        metric_id: metricId,
        value,
        converted_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Failed to track experiment conversion:', error);
      return;
    }

    // Track conversion event
    analytics.trackEvent('experiment_conversion', {
      experiment_id: experimentId,
      variant_id: variantId,
      metric_id: metricId,
      value,
      user_id: userId
    });
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Get conversion data from database
    const { data: conversions, error } = await supabase
      .from('experiment_conversions')
      .select('*')
      .eq('experiment_id', experimentId);

    if (error) {
      throw new Error(`Failed to get experiment results: ${error.message}`);
    }

    // Calculate results for each variant
    const results: ExperimentResult[] = [];
    
    for (const variant of experiment.variants) {
      const variantConversions = conversions?.filter(c => c.variant_id === variant.id) || [];
      const participants = Array.from(this.assignments.values())
        .filter(a => a.experimentId === experimentId && a.variantId === variant.id)
        .length;

      const totalConversions = variantConversions.reduce((sum, c) => sum + c.value, 0);
      const conversionRate = participants > 0 ? (totalConversions / participants) * 100 : 0;

      // Calculate statistical significance (simplified)
      const confidence = this.calculateConfidence(participants, totalConversions);
      const statisticalSignificance = confidence >= 95;

      // Calculate metrics
      const metrics: Record<string, number> = {};
      for (const metric of experiment.metrics) {
        const metricConversions = variantConversions.filter(c => c.metric_id === metric.id);
        metrics[metric.name] = metricConversions.reduce((sum, c) => sum + c.value, 0);
      }

      results.push({
        experimentId,
        variantId: variant.id,
        participants,
        conversions: totalConversions,
        conversionRate,
        confidence,
        statisticalSignificance,
        metrics
      });
    }

    this.results.set(experimentId, results);
    return results;
  }

  /**
   * Get experiment statistics
   */
  getExperimentStats(experimentId: string): {
    totalParticipants: number;
    totalConversions: number;
    averageConversionRate: number;
    bestPerformingVariant: string | null;
    statisticalSignificance: boolean;
  } {
    const results = this.results.get(experimentId) || [];
    
    const totalParticipants = results.reduce((sum, r) => sum + r.participants, 0);
    const totalConversions = results.reduce((sum, r) => sum + r.conversions, 0);
    const averageConversionRate = totalParticipants > 0 ? (totalConversions / totalParticipants) * 100 : 0;
    
    const bestVariant = results.reduce((best, current) => 
      current.conversionRate > best.conversionRate ? current : best
    );
    
    const statisticalSignificance = results.some(r => r.statisticalSignificance);

    return {
      totalParticipants,
      totalConversions,
      averageConversionRate,
      bestPerformingVariant: bestVariant?.variantId || null,
      statisticalSignificance
    };
  }

  /**
   * Check if user is eligible for experiment
   */
  private isUserEligible(userId: string, targeting: ExperimentTargeting): boolean {
    // Implement targeting logic based on user properties
    // This would typically check user segments, device type, location, etc.
    
    if (targeting.userIds && !targeting.userIds.includes(userId)) {
      return false;
    }

    // Add more targeting logic here
    return true;
  }

  /**
   * Check if user should be included based on traffic allocation
   */
  private shouldIncludeUser(userId: string, trafficAllocation: number): boolean {
    // Use consistent hashing to ensure same user gets same result
    const hash = this.hashString(userId);
    return (hash % 100) < trafficAllocation;
  }

  /**
   * Select variant based on traffic weights
   */
  private selectVariant(variants: ExperimentVariant[]): string {
    const totalWeight = variants.reduce((sum, v) => sum + v.trafficWeight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const variant of variants) {
      currentWeight += variant.trafficWeight;
      if (random <= currentWeight) {
        return variant.id;
      }
    }
    
    return variants[0].id; // Fallback
  }

  /**
   * Calculate statistical confidence
   */
  private calculateConfidence(participants: number, conversions: number): number {
    if (participants === 0) return 0;
    
    const conversionRate = conversions / participants;
    const standardError = Math.sqrt((conversionRate * (1 - conversionRate)) / participants);
    const marginOfError = 1.96 * standardError; // 95% confidence interval
    
    return Math.max(0, Math.min(100, (1 - marginOfError) * 100));
  }

  /**
   * Generate consistent hash for user ID
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Generate unique experiment ID
   */
  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load experiments from database
   */
  private async loadExperiments(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('experiments')
        .select('*');

      if (error) {
        console.error('Failed to load experiments:', error);
        return;
      }

      data?.forEach(exp => {
        const experiment: Experiment = {
          id: exp.id,
          name: exp.name,
          description: exp.description,
          status: exp.status,
          startDate: exp.start_date,
          endDate: exp.end_date,
          trafficAllocation: exp.traffic_allocation,
          variants: exp.variants,
          targeting: exp.targeting,
          metrics: exp.metrics,
          createdAt: exp.created_at,
          updatedAt: exp.updated_at
        };
        this.experiments.set(exp.id, experiment);
      });

      // Load experiment assignments
      await this.loadExperimentAssignments();
    } catch (error) {
      console.error('Failed to load experiments:', error);
    }
  }

  /**
   * Load experiment assignments from database
   */
  private async loadExperimentAssignments(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('experiment_assignments')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error('Failed to load experiment assignments:', error);
        return;
      }

      data?.forEach(assignment => {
        const key = `${assignment.user_id}-${assignment.experiment_id}`;
        this.assignments.set(key, {
          userId: assignment.user_id,
          experimentId: assignment.experiment_id,
          variantId: assignment.variant_id,
          assignedAt: assignment.assigned_at,
          isActive: assignment.is_active
        });
      });
    } catch (error) {
      console.error('Failed to load experiment assignments:', error);
    }
  }
}

// Create global instance
export const abTestingFramework = new ABTestingFramework();

// Export types and utilities
export { ABTestingFramework };
export type { 
  Experiment, 
  ExperimentVariant, 
  ExperimentTargeting, 
  ExperimentMetric, 
  ExperimentAssignment, 
  ExperimentResult 
};
