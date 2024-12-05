import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import TouchscreenAppGrid from './components/TouchScreenAppGrid.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Controller (Touchscreen Menu) */}
        <Route path="/" element={<TouchscreenAppGrid />} />
      </Routes>
    </Router>
  );
}

export default App;