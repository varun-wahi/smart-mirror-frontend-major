import { HashRouter as Router, Routes, Route } from "react-router-dom";
import TouchscreenAppGrid from "./pages/TouchScreenAppGrid.jsx";
import MicControlPage from "./pages/MicControlPage.jsx";

const ControlApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TouchscreenAppGrid />} />
        <Route path="/mic" element={<MicControlPage />} />
      </Routes>
    </Router>
  );
};

export default ControlApp;