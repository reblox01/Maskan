import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <TooltipProvider>
      <App />
      <Toaster position="top-right" richColors />
    </TooltipProvider>
  </BrowserRouter>,
)