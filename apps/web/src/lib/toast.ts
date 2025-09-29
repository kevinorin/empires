import toast, { Toaster, Toast } from 'react-hot-toast'
import { Crown, Sword, Shield, Users, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

// Custom toast types with Empires/Travian theming
export const empiresToast = {
  success: (message: string, options?: { duration?: number }) => {
    return toast.success(message, {
      duration: options?.duration || 4000,
      style: {
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        color: '#ffffff',
        border: '2px solid #10b981',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(16, 185, 129, 0.2)',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    })
  },

  error: (message: string, options?: { duration?: number }) => {
    return toast.error(message, {
      duration: options?.duration || 5000,
      style: {
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        color: '#ffffff',
        border: '2px solid #ef4444',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(239, 68, 68, 0.2)',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    })
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        color: '#ffffff',
        border: '2px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(245, 158, 11, 0.2)',
      },
      iconTheme: {
        primary: '#f59e0b',
        secondary: '#ffffff',
      },
    })
  },

  info: (message: string, options?: { duration?: number }) => {
    return toast(message, {
      duration: options?.duration || 4000,
      icon: '⚔️',
      style: {
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        color: '#ffffff',
        border: '2px solid #3b82f6',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(59, 130, 246, 0.2)',
      },
    })
  },

  // Game-specific toasts
  empire: (message: string, options?: { duration?: number; icon?: string }) => {
    return toast(message, {
      duration: options?.duration || 4000,
      icon: options?.icon || '👑',
      style: {
        background: 'linear-gradient(135deg, #4c1d95 0%, #581c87 100%)',
        color: '#ffffff',
        border: '2px solid #fbbf24',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(251, 191, 36, 0.3)',
      },
    })
  },

  battle: (message: string, options?: { duration?: number }) => {
    return toast(message, {
      duration: options?.duration || 5000,
      icon: '⚔️',
      style: {
        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
        color: '#ffffff',
        border: '2px solid #dc2626',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(220, 38, 38, 0.3)',
      },
    })
  },

  village: (message: string, options?: { duration?: number }) => {
    return toast(message, {
      duration: options?.duration || 4000,
      icon: '🏰',
      style: {
        background: 'linear-gradient(135deg, #155e75 0%, #164e63 100%)',
        color: '#ffffff',
        border: '2px solid #0891b2',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(8, 145, 178, 0.3)',
      },
    })
  },

  resources: (message: string, options?: { duration?: number }) => {
    return toast(message, {
      duration: options?.duration || 3000,
      icon: '💰',
      style: {
        background: 'linear-gradient(135deg, #365314 0%, #3f6212 100%)',
        color: '#ffffff',
        border: '2px solid #65a30d',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(101, 163, 13, 0.3)',
      },
    })
  },

  alliance: (message: string, options?: { duration?: number }) => {
    return toast(message, {
      duration: options?.duration || 4000,
      icon: '🤝',
      style: {
        background: 'linear-gradient(135deg, #6b21a8 0%, #7c2d12 100%)',
        color: '#ffffff',
        border: '2px solid #a855f7',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(168, 85, 247, 0.3)',
      },
    })
  },

  // Utility functions
  dismiss: (toastId?: string) => {
    return toast.dismiss(toastId)
  },

  promise: <T,>(
    promise: Promise<T>,
    msgs: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, msgs, {
      style: {
        background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
        color: '#ffffff',
        border: '2px solid #6b7280',
        borderRadius: '8px',
        padding: '16px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      },
      success: {
        style: {
          border: '2px solid #10b981',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(16, 185, 129, 0.2)',
        },
        iconTheme: {
          primary: '#10b981',
          secondary: '#ffffff',
        },
      },
      error: {
        style: {
          border: '2px solid #ef4444',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(239, 68, 68, 0.2)',
        },
        iconTheme: {
          primary: '#ef4444',
          secondary: '#ffffff',
        },
      },
      loading: {
        style: {
          border: '2px solid #f59e0b',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(245, 158, 11, 0.2)',
        },
        iconTheme: {
          primary: '#f59e0b',
          secondary: '#ffffff',
        },
      },
    })
  }
}

// Toaster configuration (to be used in layout or main component)
export const toasterConfig = {
  position: 'top-right' as const,
  gutter: 8,
  containerClassName: 'empires-toaster',
  toastOptions: {
    duration: 4000,
    style: {
      background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
      color: '#ffffff',
      border: '2px solid #6b7280',
      borderRadius: '8px',
      padding: '16px',
      fontWeight: '500',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      minWidth: '320px',
      maxWidth: '500px',
    },
    success: {
      iconTheme: {
        primary: '#10b981',
        secondary: '#ffffff',
      },
    },
    error: {
      iconTheme: {
        primary: '#ef4444',
        secondary: '#ffffff',
      },
    },
    loading: {
      iconTheme: {
        primary: '#f59e0b',
        secondary: '#ffffff',
      },
    },
  }
}

export default empiresToast