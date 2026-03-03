/**
 * Examination Module
 * 
 * Exports all examination-related components, pages, and utilities.
 */

export { default as ExamsPage } from './college_admin/ExamsPage';
export { default as ExamFormBuilder } from './college_admin/ExamFormBuilder';
export { default as ExamTakingPage } from './student/ExamTakingPage';
export { default as LiveMonitoringPage } from './faculty/LiveMonitoringPage';

// Desktop/Exam Components
export { default as LiveMonitoringPanel } from './components/LiveMonitoringPanel';
export { default as IPRestrictionsPanel } from './components/IPRestrictionsPanel';

// API Services
export * from './api/examApi';
export * from './api/examEnhancedApi';
export * from './api/examDesktopApi';

// Types
export * from './college_admin/ExamFormBuilder';
