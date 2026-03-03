import type { UploadStatus } from '../types';

interface UploadEvent {
  type: 'progress' | 'completed' | 'error' | 'processing';
  fileId: string;
  data: {
    progress?: number;
    status?: UploadStatus;
    error?: string;
    details?: {
      currentStep?: string;
      slidesProcessed?: number;
      totalSlides?: number;
      estimatedTimeRemaining?: number;
    };
    aiFeatures?: {
      textExtracted?: boolean;
      embeddingsGenerated?: boolean;
      questionsGenerated?: boolean;
      summaryGenerated?: boolean;
      keywordsExtracted?: boolean;
    };
  };
}

type EventCallback = (event: UploadEvent) => void;

class WebSocketService {
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnected = false;
  private simulationInterval: NodeJS.Timeout | null = null;

  // Connect to WebSocket server
  connect(fileId: string): void {
    // In production, this would connect to a real WebSocket server
    // For now, we'll simulate real-time events
    this.startSimulation(fileId);
    this.isConnected = true;
    this.emit('connection', { type: 'connected', fileId } as any);
  }

  // Disconnect from WebSocket server
  disconnect(): void {
    this.stopSimulation();
    this.isConnected = false;
    this.emit('disconnection', { type: 'disconnected' } as any);
  }

  // Subscribe to events
  on(event: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  // Emit event to listeners
  private emit(event: string, data: any): void {
    this.eventListeners.get(event)?.forEach((callback) => {
      callback(data as UploadEvent);
    });
  }

  // Simulate real-time upload progress (for demo purposes)
  private startSimulation(fileId: string): void {
    let progress = 0;
    const steps = [
      { progress: 20, step: 'Uploading file...' },
      { progress: 30, step: 'Extracting text...' },
      { progress: 45, step: 'Generating embeddings...' },
      { progress: 60, step: 'Creating summary...' },
      { progress: 75, step: 'Generating questions...' },
      { progress: 90, step: 'Extracting keywords...' },
      { progress: 100, step: 'Complete' },
    ];

    let stepIndex = 0;

    this.simulationInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        const step = steps[stepIndex];
        this.emit('progress', {
          type: 'progress',
          fileId,
          data: {
            progress: step.progress,
            status: step.progress < 100 ? 'processing' : 'completed',
            details: {
              currentStep: step.step,
              slidesProcessed: Math.floor(Math.random() * 30) + 1,
              totalSlides: 30,
              estimatedTimeRemaining: Math.max(0, 30 - stepIndex * 5),
            },
          },
        });

        if (step.progress === 100) {
          this.emit('completed', {
            type: 'completed',
            fileId,
            data: {
              status: 'completed',
              aiFeatures: {
                textExtracted: true,
                embeddingsGenerated: true,
                questionsGenerated: true,
                summaryGenerated: true,
                keywordsExtracted: true,
              },
            },
          });
        }

        stepIndex++;
      } else {
        this.stopSimulation();
      }
    }, 500);
  }

  private stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  // Reconnection logic
  private reconnect(fileId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect(fileId);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  // Connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Reset connection state
  reset(): void {
    this.reconnectAttempts = 0;
    this.isConnected = false;
    this.stopSimulation();
    this.eventListeners.clear();
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Hook for using WebSocket in components
export function useWebSocket(fileId?: string) {
  const [events, setEvents] = useState<UploadEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!fileId) return;

    // Connect to WebSocket
    websocketService.connect(fileId);
    setIsConnected(true);

    // Subscribe to events
    const unsubscribe = websocketService.on('progress', (event) => {
      setEvents((prev) => [...prev, event]);
    });

    // Handle connection status
    const unsubConnection = websocketService.on('connection', () => {
      setIsConnected(true);
    });

    const unsubDisconnection = websocketService.on('disconnection', () => {
      setIsConnected(false);
    });

    // Cleanup
    return () => {
      unsubscribe();
      unsubConnection();
      unsubDisconnection();
      websocketService.disconnect();
    };
  }, [fileId]);

  return { events, isConnected };
}

// Import hooks at top level
import { useState, useEffect } from 'react';
