'use client'

import { Toaster } from 'react-hot-toast'
import { toasterConfig } from '@/lib/toast'

export function EmpiresToaster() {
  return <Toaster {...toasterConfig} />
}