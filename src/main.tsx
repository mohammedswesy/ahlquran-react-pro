
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'
import './styles.css'
import { ToastProvider } from '@/store/toast'
import { AppToaster } from '@/components/ui/toast'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AppToaster />
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)
