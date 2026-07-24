import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import SiteNav from './components/SiteNav';

const AppShell = lazy(() => import('./components/AppShell'));

const Home = lazy(() => import('./pages/Home'));
const Platform = lazy(() => import('./pages/Platform'));
const DecisionSystem = lazy(() => import('./pages/DecisionSystem'));
const Solutions = lazy(() => import('./pages/Solutions'));
const StakeholderSolution = lazy(() => import('./pages/StakeholderSolution'));
const Methodology = lazy(() => import('./pages/Methodology'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Trust = lazy(() => import('./pages/Trust'));
const Partners = lazy(() => import('./pages/Partners'));
const Investors = lazy(() => import('./pages/Investors'));
const Insights = lazy(() => import('./pages/Insights'));
const InsightArticle = lazy(() => import('./pages/InsightArticle'));
const Company = lazy(() => import('./pages/Company'));
const Privacy = lazy(() => import('./pages/Privacy'));
const NotFound = lazy(() => import('./pages/NotFound'));

function ScrollRestoration() {
  useLocation();
  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0);
  }
  return null;
}

function PageFallback() {
  return (
    <div className="min-h-screen bg-art-cream flex items-center justify-center">
      <div className="text-xs font-mono text-art-ink/30">Loading...</div>
    </div>
  );
}

function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}

export default function SiteRouter() {
  return (
    <BrowserRouter>
      <ScrollRestoration />
      <Routes>
        <Route path="/app" element={<Suspense fallback={<PageFallback />}><AppShell /></Suspense>} />
        <Route path="/app/*" element={<Suspense fallback={<PageFallback />}><AppShell /></Suspense>} />
        <Route
          path="/"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Home />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/platform"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Platform />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/decision-system"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <DecisionSystem />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/solutions"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Solutions />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/solutions/:stakeholder"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <StakeholderSolution />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/methodology"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Methodology />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/pricing"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Pricing />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/trust"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Trust />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/partners"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Partners />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/investors"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Investors />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/insights"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Insights />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/insights/:slug"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <InsightArticle />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/company"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Company />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="/privacy"
          element={
            <SiteLayout>
              <Suspense fallback={<PageFallback />}>
                <Privacy />
              </Suspense>
            </SiteLayout>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<PageFallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
