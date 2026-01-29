import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Shell from "./layout/Shell.jsx";
import PageTransition from "./layout/PageTransition.jsx";
import Home from "../pages/Home.jsx";
import CreateRoom from "../pages/CreateRoom.jsx";
import JoinRoom from "../pages/JoinRoom.jsx";
import Lobby from "../pages/Lobby.jsx";
import Game from "../pages/Game.jsx";
import Results from "../pages/Results.jsx";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Shell />}>
          <Route
            path="/"
            element={
              <PageTransition>
                <Home />
              </PageTransition>
            }
          />
          <Route
            path="/create"
            element={
              <PageTransition>
                <CreateRoom />
              </PageTransition>
            }
          />
          <Route
            path="/join"
            element={
              <PageTransition>
                <JoinRoom />
              </PageTransition>
            }
          />
          <Route
            path="/room/:roomId/lobby"
            element={
              <PageTransition>
                <Lobby />
              </PageTransition>
            }
          />
          <Route
            path="/room/:roomId/game"
            element={
              <PageTransition>
                <Game />
              </PageTransition>
            }
          />
          <Route
            path="/room/:roomId/results"
            element={
              <PageTransition>
                <Results />
              </PageTransition>
            }
          />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
