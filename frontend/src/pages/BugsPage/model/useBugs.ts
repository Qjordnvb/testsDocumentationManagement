/**
 * Bugs Page Business Logic
 * Manages bugs data, filters, view modes, and navigation
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bugApi } from '@/entities/bug';
import { useProject } from '@/app/providers/ProjectContext';
import { useAuth } from '@/app/providers';
import type { Bug, TestCaseGroup } from '@/entities/bug';

export const useBugs = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProject();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [groupedBugs, setGroupedBugs] = useState<TestCaseGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View states
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set());
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Validate project
  useEffect(() => {
    if (!projectId || !currentProject) {
      navigate('/');
      return;
    }
  }, [projectId, currentProject, navigate]);

  // Load bugs
  useEffect(() => {
    loadBugs();
  }, [projectId]);

  const loadBugs = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      setError(null);

      // Load both list and grouped data
      const [bugsData, groupedData] = await Promise.all([
        bugApi.getAll({ project_id: projectId }),
        bugApi.getGrouped(projectId).catch((err) => {
          console.warn('Error loading grouped bugs, using empty array:', err);
          return { grouped_bugs: [] };
        }),
      ]);

      // DEV role: Filter to only show bugs assigned to this user
      const isDev = hasRole('dev');
      const filteredBugs = isDev
        ? bugsData.filter((bug) => bug.assigned_to === user?.email)
        : bugsData;

      setBugs(filteredBugs);
      setGroupedBugs(groupedData.grouped_bugs || []);
    } catch (err: any) {
      console.error('Error loading bugs:', err);
      setError(err.message || 'Error al cargar bugs');
      toast.error('Error al cargar bugs');
    } finally {
      setLoading(false);
    }
  };

  // Toggle functions for grouped view
  const toggleTestCase = (testCaseId: string) => {
    const newExpanded = new Set(expandedTestCases);
    if (newExpanded.has(testCaseId)) {
      newExpanded.delete(testCaseId);
    } else {
      newExpanded.add(testCaseId);
    }
    setExpandedTestCases(newExpanded);
  };

  const toggleScenario = (key: string) => {
    const newExpanded = new Set(expandedScenarios);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedScenarios(newExpanded);
  };

  // Filter bugs
  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      // Role-based filter - DEV users only see bugs assigned to them
      if (hasRole('dev') && bug.assigned_to !== user?.email) {
        return false;
      }

      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        bug.title.toLowerCase().includes(searchLower) ||
        bug.description.toLowerCase().includes(searchLower) ||
        bug.id.toLowerCase().includes(searchLower);

      // Severity filter
      const matchesSeverity = selectedSeverity === 'ALL' || bug.severity === selectedSeverity;

      // Priority filter
      const matchesPriority = selectedPriority === 'ALL' || bug.priority === selectedPriority;

      // Status filter
      const matchesStatus = selectedStatus === 'ALL' || bug.status === selectedStatus;

      // Type filter
      const matchesType = selectedType === 'ALL' || bug.bug_type === selectedType;

      return matchesSearch && matchesSeverity && matchesPriority && matchesStatus && matchesType;
    });
  }, [bugs, searchQuery, selectedSeverity, selectedPriority, selectedStatus, selectedType, hasRole, user]);

  // Navigation handler
  const handleBugClick = (bugId: string) => {
    navigate(`/projects/${projectId}/bugs/${bugId}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('ALL');
    setSelectedPriority('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedSeverity !== 'ALL') count++;
    if (selectedPriority !== 'ALL') count++;
    if (selectedStatus !== 'ALL') count++;
    if (selectedType !== 'ALL') count++;
    return count;
  }, [searchQuery, selectedSeverity, selectedPriority, selectedStatus, selectedType]);

  // Summary statistics
  const stats = useMemo(() => {
    return {
      total: bugs.length,
      open: bugs.filter((b) => ['New', 'Assigned', 'In Progress', 'Reopened'].includes(b.status)).length,
      testing: bugs.filter((b) => ['Fixed', 'Testing'].includes(b.status)).length,
      closed: bugs.filter((b) => ['Verified', 'Closed'].includes(b.status)).length,
    };
  }, [bugs]);

  return {
    // Data
    projectId,
    currentProject,
    bugs,
    filteredBugs,
    groupedBugs,
    loading,
    error,

    // View states
    viewMode,
    setViewMode,
    expandedTestCases,
    expandedScenarios,
    toggleTestCase,
    toggleScenario,

    // Filters
    searchQuery,
    setSearchQuery,
    selectedSeverity,
    setSelectedSeverity,
    selectedPriority,
    setSelectedPriority,
    selectedStatus,
    setSelectedStatus,
    selectedType,
    setSelectedType,
    resetFilters,
    activeFiltersCount,

    // Statistics
    stats,

    // Handlers
    handleBugClick,
    loadBugs,
  };
};
