import { HashRouter as Router, Routes, Route } from "react-router-dom";
import TouchscreenAppGrid from "./pages/TouchScreenAppGrid.jsx";
import MicControlPage from "./pages/MicControlPage.jsx";
import TopicSelectionPage from "./pages/TopicSelectionPage.jsx";
import QuestionNavigatorPage from "./pages/QuestionNavigatorPage.jsx";

const ControlApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TouchscreenAppGrid />} />
        <Route path="/mic" element={<MicControlPage />} />
        <Route path="/select-topic" element={<TopicSelectionPage navigate={window.history.back} />} />
        <Route path="/question-navigator" element={<QuestionNavigatorPage navigate={window.history.back} />} />
      </Routes>
    </Router>
  );
};

export default ControlApp;