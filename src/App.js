import React, { useState } from "react";
import "./App.css";
import PlayerSoponser from "./compositions/PlayerSponsort";
import TeamCards from "./compositions/TeamCards";
import PsAd from "./compositions/PsAd";
import { Button, Box, TextField, Stack, Typography } from "@mui/material";
import packageInfo from "../package.json";

function App() {
  const [activeView, setActiveView] = useState("psad");

  const renderView = () => {
    switch (activeView) {
      case "player":
        return <PlayerSoponser />;
      case "team":
        return <TeamCards />;
      case "psad":
        return <PsAd />;
      default:
        return <PlayerSoponser />;
    }
  };

  return (
    // display: flex with flexDirection: column ensures children stack vertically
    <div
      className="App"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {/* 1. Navigation Header - Always at the top */}
      <Box
        component="nav"
        sx={{
          padding: "20px",
          backgroundColor: "#f0f0f0",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "center", // Centers buttons horizontally
          gap: 2, // MUI spacing between buttons
          position: "sticky", // Keeps it at the top when scrolling
          top: 0,
          zIndex: 1100, // Stays above the graphic content
        }}
      >
        <button
          onClick={() => setActiveView("player")}
          style={{
            fontWeight: activeView === "player" ? "bold" : "normal",
            backgroundColor: activeView === "player" ? "#1976d2" : "#fff",
            color: activeView === "player" ? "#fff" : "#000",
            padding: "10px 20px",
            border: "1px solid #1976d2",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "0.3s",
          }}
        >
          Player Sponsors
        </button>

        <button
          onClick={() => setActiveView("team")}
          style={{
            fontWeight: activeView === "team" ? "bold" : "normal",
            backgroundColor: activeView === "team" ? "#1976d2" : "#fff",
            color: activeView === "team" ? "#fff" : "#000",
            padding: "10px 20px",
            border: "1px solid #1976d2",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "0.3s",
          }}
        >
          Team Cards
        </button>

        <button
          onClick={() => setActiveView("psad")}
          style={{
            fontWeight: activeView === "psad" ? "bold" : "normal",
            backgroundColor: activeView === "psad" ? "#1976d2" : "#fff",
            color: activeView === "psad" ? "#fff" : "#000",
            padding: "10px 20px",
            border: "1px solid #1976d2",
            borderRadius: "4px",
            cursor: "pointer",
            transition: "0.3s",
          }}
        >
          PS Ad.
        </button>

        <Box sx={{ mt: 2, textAlign: "center", opacity: 0.5 }}>
          <Typography variant="caption">v{packageInfo.version}</Typography>
        </Box>
      </Box>

      {/* 2. Content Area - Stacks underneath */}
      <div className="content-area" style={{ flexGrow: 1, padding: "20px" }}>
        {renderView()}
      </div>
    </div>
  );
}

export default App;
