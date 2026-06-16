import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import Index from './pages/Index'
import NotFound from './pages/NotFound'
import Layout from './components/Layout'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const GlobalErrorFallback = (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <div className="text-center p-8 bg-destructive/5 rounded-xl border border-destructive/20 max-w-md shadow-sm">
      <div className="flex justify-center mb-4">
        <div className="bg-destructive/10 p-3 rounded-full">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
      </div>
      <h2 className="text-xl font-bold mb-2 text-destructive">
        Application Error
      </h2>
      <p className="text-muted-foreground mb-6">
        A critical error occurred while rendering the application. Please try
        resetting the application data.
      </p>
      <div className="flex gap-4 justify-center">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
        <Button
          variant="destructive"
          onClick={() => {
            localStorage.clear()
            window.location.reload()
          }}
        >
          Reset App State
        </Button>
      </div>
    </div>
  </div>
)

const App = () => (
  <ThemeProvider
    defaultTheme="system"
    storageKey="mindmap-ui-theme"
    attribute="class"
  >
    <ErrorBoundary fallback={GlobalErrorFallback}>
      <BrowserRouter
        future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
      >
        <TooltipProvider delayDuration={0}>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </ThemeProvider>
)

export default App
