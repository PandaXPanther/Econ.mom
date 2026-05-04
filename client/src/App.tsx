import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Home from "@/pages/Home";
import ToolsIndex from "@/pages/ToolsIndex";
import Methodology from "@/pages/Methodology";
import Founder from "@/pages/Founder";

import FRQGrader from "@/pages/tools/FRQGrader";
import TariffLab from "@/pages/tools/TariffLab";
import TextbookAtlas from "@/pages/tools/TextbookAtlas";
import ShockSim from "@/pages/tools/ShockSim";
import ShadowFed from "@/pages/tools/ShadowFed";
import PaperDecoder from "@/pages/tools/PaperDecoder";
import NewsTranslator from "@/pages/tools/NewsTranslator";
import USEcon from "@/pages/tools/USEcon";
import EconLever from "@/pages/tools/EconLever";
import InflationDecomposer from "@/pages/tools/InflationDecomposer";
import NaturalExperiments from "@/pages/tools/NaturalExperiments";
import CounterfactualEngine from "@/pages/tools/CounterfactualEngine";

import { useLocation } from "wouter";

// All canonical routes the app knows about. Used by NormalizeUrl below to
// turn path-style deep links ("/tarifflab", "/shock-sim#/", etc.) into the
// hash-router form ("/#/tarifflab") before the router gets to render anything.
const KNOWN_ROUTES = new Set<string>([
  "/",
  "/tools",
  "/methodology",
  "/founder",
  "/frq-grader",
  "/tarifflab",
  "/textbook-atlas",
  "/shock-sim",
  "/shadow-fed",
  "/paper-decoder",
  "/news-translator",
  "/us-econ",
  "/econlever",
  "/inflation-decomposer",
  "/natural-experiments",
  "/counterfactual-engine",
  "/extemp-engine",
  "/colorado-econ",
  "/lever",
  "/el",
  // Friendly aliases the critique flagged as 404s
  "/econ-dashboard",
  "/dashboard",
  "/tariff-lab",
  "/tariff",
  "/atlas",
  "/shock",
  "/fed",
  "/paper",
  "/news",
  "/inflation",
  "/counterfactual",
  "/natural-experiment",
  "/grader",
  "/frq",
]);

// If the user hits /tarifflab (Netlify SPA fallback served index.html) or
// /tarifflab#/ (path AND empty hash), rewrite the URL to /#/tarifflab so
// the hash router actually picks up the route. Runs synchronously before
// React first paints, so there's no flash of the wrong page.
function normalizeUrl() {
  if (typeof window === "undefined") return;
  const { pathname, hash, search } = window.location;
  if (pathname === "/" || pathname === "") return;
  if (!KNOWN_ROUTES.has(pathname)) return;
  // If a real hash route is already present (and it isn't just "#/"), respect it.
  if (hash && hash.length > 2 && hash !== "#/") return;
  const target = `/#${pathname}${search}`;
  window.history.replaceState(null, "", target);
}

// Run once at module load, before React mounts.
normalizeUrl();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

// Theme bootstrap, picks system preference at first render so we never
// flash the wrong theme. Persists for the session via in-memory state on
// the document element class (no localStorage in this sandbox).
function ThemeInit() {
  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) document.documentElement.classList.add("dark");
  }, []);
  return null;
}

function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/tools" component={ToolsIndex} />
        <Route path="/methodology" component={Methodology} />
        <Route path="/founder" component={Founder} />

        <Route path="/frq-grader" component={FRQGrader} />
        <Route path="/tarifflab" component={TariffLab} />
        <Route path="/textbook-atlas" component={TextbookAtlas} />
        <Route path="/shock-sim" component={ShockSim} />
        <Route path="/shadow-fed" component={ShadowFed} />
        <Route path="/paper-decoder" component={PaperDecoder} />
        <Route path="/news-translator" component={NewsTranslator} />
        <Route path="/us-econ" component={USEcon} />
        <Route path="/econlever" component={EconLever} />
        <Route path="/inflation-decomposer" component={InflationDecomposer} />
        <Route path="/natural-experiments" component={NaturalExperiments} />
        <Route path="/counterfactual-engine" component={CounterfactualEngine} />

        {/* Legacy redirects, old routes now point to their replacements */}
        <Route path="/extemp-engine" component={NewsTranslator} />
        <Route path="/colorado-econ" component={USEcon} />
        <Route path="/lever" component={EconLever} />
        <Route path="/el" component={EconLever} />

        {/* Friendly slug aliases (so /econ-dashboard, /tariff, /grader etc. all work) */}
        <Route path="/econ-dashboard" component={USEcon} />
        <Route path="/dashboard" component={USEcon} />
        <Route path="/tariff-lab" component={TariffLab} />
        <Route path="/tariff" component={TariffLab} />
        <Route path="/atlas" component={TextbookAtlas} />
        <Route path="/shock" component={ShockSim} />
        <Route path="/fed" component={ShadowFed} />
        <Route path="/paper" component={PaperDecoder} />
        <Route path="/news" component={NewsTranslator} />
        <Route path="/inflation" component={InflationDecomposer} />
        <Route path="/counterfactual" component={CounterfactualEngine} />
        <Route path="/natural-experiment" component={NaturalExperiments} />
        <Route path="/grader" component={FRQGrader} />
        <Route path="/frq" component={FRQGrader} />

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeInit />
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
