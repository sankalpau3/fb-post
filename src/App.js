import React, { useEffect, useState } from "react";
import "./App.css";
import PlayerSoponser from "./compositions/PlayerSponsort";
import TeamCards from "./compositions/TeamCards";
import PsAd from "./compositions/PsAd";
import UpdatePlayer from "./compositions/UpdatePlayer";
import Fines from "./compositions/Fines";
import CreateMatch from "./compositions/CreateMatch";
import PhotoManager from "./compositions/PhotoManager";
import { addDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import clubLogo from "./CDN/static_content/imgages/logo.jpg";
import {
  Alert,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import packageInfo from "../package.json";

const defaultAdminUser = { username: 'admin', password: 'admin', role: 'Administrator' };

function App() {
  const [activeView, setActiveView] = useState("matches");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentAdminUsername, setCurrentAdminUsername] = useState('admin');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:768px)');

  useEffect(() => {
    const loadAdminUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'adminUsers'));
        if (usersSnap.empty) {
          await addDoc(collection(db, 'adminUsers'), defaultAdminUser);
          setAdminUsers([defaultAdminUser]);
        } else {
          setAdminUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        }
      } catch (error) {
        console.error('Error loading admin users from Firestore', error);
        setLoginError('Unable to load admin credentials from Firebase.');
      } finally {
        setAdminLoading(false);
      }
    };

    loadAdminUsers();

    const storedLogin = localStorage.getItem('adminLoggedIn');
    const storedUsername = localStorage.getItem('adminUsername');
    setIsAdminLoggedIn(storedLogin === 'true');
    if (storedUsername) {
      setCurrentAdminUsername(storedUsername);
    }
  }, []);

  const handleLogin = () => {
    if (adminLoading) {
      setLoginError('Please wait while admin credentials load.');
      return;
    }

    const matchedUser = adminUsers.find(
      (user) => user.username === loginUsername && user.password === loginPassword
    );

    if (matchedUser) {
      setIsAdminLoggedIn(true);
      setCurrentAdminUsername(matchedUser.username);
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminUsername', matchedUser.username);
      setLoginError('');
      setLoginUsername('');
      setLoginPassword('');
      setActiveView('fines');
      return;
    }

    setIsAdminLoggedIn(false);
    setLoginError('Invalid username or password.');
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('adminLoggedIn');
    if (activeView === 'fines') {
      setActiveView('matches');
    }
  };

  const renderLoginContent = () => (
    <Box sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Box
            component="img"
            src={clubLogo}
            alt="Club logo"
            sx={{
              mx: 'auto',
              width: 120,
              height: 120,
              borderRadius: 3,
              objectFit: 'contain',
              boxShadow: 3,
            }}
          />
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Club Admin Login
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
          Secure access for authorized club administrators.
        </Typography>
      </Box>

      {loginError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loginError}
        </Alert>
      )}
      <Stack spacing={2} sx={{ mb: 4 }}>
        <TextField
          label="Username"
          value={loginUsername}
          onChange={(e) => setLoginUsername(e.target.value)}
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          fullWidth
        />
        <Button variant="contained" fullWidth onClick={handleLogin} disabled={adminLoading}>
          {adminLoading ? 'Loading admin credentials…' : 'Log in as Admin'}
        </Button>
      </Stack>
    </Box>
  );

  const renderLoginScreen = () => (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: 'linear-gradient(180deg, #0f5d26 0%, #1f8b4c 45%, #ffffff 100%)',
      }}
    >
      <Paper
        elevation={12}
        sx={{
          width: '100%',
          maxWidth: 500,
          p: 4,
          borderRadius: 4,
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255,255,255,0.92)',
        }}
      >
        {renderLoginContent()}
      </Paper>
    </Box>
  );

  if (!isAdminLoggedIn) {
    return renderLoginScreen();
  }

  const viewItems = [
    { key: "player", label: "Player Sponsors" },
    { key: "team", label: "Team Cards" },
    { key: "matches", label: "Matches" },
    { key: "psad", label: "PS Ad." },
    { key: "updatePlayer", label: "Update Players" },
    { key: "photos", label: "Photo Manager" },
    { key: "fines", label: "Fines" },
  ];

  const viewLabels = {
    player: "Player Sponsors",
    team: "Team Cards",
    matches: "Matches",
    psad: "PS Ad.",
    updatePlayer: "Update Players",
    photos: "Photo Manager",
    fines: "Fines",
  };

  const renderView = () => {
    switch (activeView) {
      case "player":
        return <PlayerSoponser />;
      case "team":
        return <TeamCards />;
      case "matches":
        return <CreateMatch />;
      case "psad":
        return <PsAd />;
      case "updatePlayer":
        return <UpdatePlayer />;
      case "photos":
        return <PhotoManager />;
      case "fines":
        return <Fines currentAdminUsername={currentAdminUsername} />;
      default:
        return <PlayerSoponser />;
    }
  };

  const renderNavigationList = (onSelect) => (
    <List sx={{ width: '100%', p: 1.5 }}>
      {viewItems.map((item) => (
        <ListItemButton
          key={item.key}
          selected={activeView === item.key}
          onClick={() => {
            setActiveView(item.key);
            onSelect?.();
          }}
          sx={{
            mb: 0.8,
            border: '1px solid rgba(16, 88, 48, 0.12)',
            background: activeView === item.key ? 'linear-gradient(135deg, #0f5d26 0%, #1c7d3f 100%)' : '#f5f8f6',
            color: activeView === item.key ? '#ffffff' : '#153824',
            borderRadius: 0,
            fontWeight: 700,
            '&:hover': {
              background: activeView === item.key ? 'linear-gradient(135deg, #0f5d26 0%, #1c7d3f 100%)' : '#edf3ef',
            },
          }}
        >
          <ListItemText primary={item.label} sx={{ '& .MuiTypography-root': { fontWeight: 700 } }} />
        </ListItemButton>
      ))}
      <ListItemButton
        onClick={() => {
          handleLogout();
          onSelect?.();
        }}
        sx={{
          mt: 1,
          borderRadius: 0,
          border: '1px solid rgba(17, 48, 34, 0.08)',
          background: '#f1f5f2',
          color: '#143826',
          fontWeight: 700,
        }}
      >
        <ListItemText primary="Log out" sx={{ '& .MuiTypography-root': { fontWeight: 700 } }} />
      </ListItemButton>
    </List>
  );

  if (isMobile) {
    return (
      <div className="app-shell mobile-shell">
        <header className="mobile-topbar">
          <div className="mobile-brand">
            <img src={clubLogo} alt="Club logo" className="sidebar-logo" />
            <div>
              <div className="sidebar-title">PS Ad.</div>
              <div className="sidebar-subtitle">v{packageInfo.version}</div>
            </div>
          </div>

          <IconButton
            edge="end"
            color="inherit"
            aria-label="open navigation"
            onClick={() => setDrawerOpen(true)}
            sx={{ color: '#153824', borderRadius: 0 }}
          >
            <MenuIcon />
          </IconButton>
        </header>

        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 260, background: '#f5f8f6', minHeight: '100%' }} role="presentation">
            {renderNavigationList(() => setDrawerOpen(false))}
          </Box>
        </Drawer>

        <main className="workspace-panel mobile-panel">
          <header className="workspace-header mobile-header">
            <div>
              <p className="eyebrow">Dashboard</p>
              <h1>{viewLabels[activeView] || 'Fine Management App'}</h1>
            </div>
          </header>

          <div className="content-area">
            {renderView()}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src={clubLogo} alt="Club logo" className="sidebar-logo" />
          <div>
            <div className="sidebar-title">PS Ad.</div>
            <div className="sidebar-subtitle">v{packageInfo.version}</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {viewItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`nav-button ${activeView === item.key ? 'active' : ''}`}
              onClick={() => setActiveView(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="user-dot" />
            {currentAdminUsername}
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="workspace-panel">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>{viewLabels[activeView] || 'Fine Management App'}</h1>
          </div>
        </header>

        <div className="content-area">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App;
