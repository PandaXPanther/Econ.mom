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

import { useLocation } from "wouter";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

// Theme bootstrap — picks system preference at first render so we never
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

        {/* Legacy redirects — old routes now point to their replacements */}
        <Route path="/extemp-engine" component={NewsTranslator} />
        <Route path="/colorado-econ" component={USEcon} />
        <Route path="/lever" component={EconLever} />
        <Route path="/el" component={EconLever} />

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
