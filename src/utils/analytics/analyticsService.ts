import api from './api';

const analyticsService = {
  async trackEvent(eventName: string, properties: Record<string, any> = {}) {
    console.log(`Tracking event: ${eventName}`, properties);
    // In a real application, you might send this to a backend endpoint
    // await api.post('/analytics/events', { eventName, properties });
  },

  async trackPageView(pageName: string, properties: Record<string, any> = {}) {
    console.log(`Tracking page view: ${pageName}`, properties);
    // await api.post('/analytics/page-views', { pageName, properties });
  },

  async trackError(error: Error, properties: Record<string, any> = {}) {
    console.error(`Tracking error: ${error.message}`, error, properties);
    // await api.post('/analytics/errors', { message: error.message, stack: error.stack, properties });
  },
};

export default analyticsService;
