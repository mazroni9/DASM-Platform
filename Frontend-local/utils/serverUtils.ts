/**
 * Utility functions for server operations
 */

/**
 * Restarts both frontend and backend servers
 * This function makes a request to a batch script endpoint
 */
export const restartServers = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Using the fetch API to call a local endpoint that will trigger the batch script
    const response = await fetch('/api/restart-servers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error restarting servers:', error);
    return {
      success: false,
      message: 'حدث خطأ أثناء إعادة تشغيل الخوادم',
    };
  }
}; 