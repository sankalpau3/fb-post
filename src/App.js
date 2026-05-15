import React, { useEffect, useState } from "react";
import "./App.css";
import PlayerSoponser from "./compositions/PlayerSponsort";
import TeamCards from "./compositions/TeamCards";
import PsAd from "./compositions/PsAd";
import UpdatePlayer from "./compositions/UpdatePlayer";
import Fines from "./compositions/Fines";
import CreateMatch from "./compositions/CreateMatch";
import {
  addDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import clubLogo from "./CDN/static_content/imgages/logo.jpg";
import {
  AppBar,
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
  Toolbar,
  Typography,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import packageInfo from "../package.json";

const defaultAdminUser = { username: 'admin', password: 'admin', role: 'Administrator' };

function App() {
  const [activeView, setActiveView] = useState("psad");
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
      setActiveView('psad');
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
    { key: "fines", label: "Fines" },
  ];

  const viewLabels = {
    player: "Player Sponsors",
    team: "Team Cards",
    matches: "Matches",
    psad: "PS Ad.",
    updatePlayer: "Update Players",
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
      case "fines":
        return <Fines currentAdminUsername={currentAdminUsername} />;
      default:
        return <PlayerSoponser />;
    }
  };

  return (
    <div
      className="App"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {viewLabels[activeView] || "Fine Management App"}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              v{packageInfo.version}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile ? (
              <IconButton
                edge="end"
                color="inherit"
                aria-label="open navigation"
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <Stack direction="row" spacing={1}>
                {viewItems.map((item) => (
                  <Button
                    key={item.key}
                    variant={activeView === item.key ? "contained" : "outlined"}
                    color={activeView === item.key ? "primary" : "inherit"}
                    onClick={() => setActiveView(item.key)}
                  >
                    {item.label}
                  </Button>
                ))}
              </Stack>
            )}

            {isAdminLoggedIn && !isMobile && (
              <Button variant="outlined" color="secondary" onClick={handleLogout}>
                Log out
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 240 }} role="presentation">
          <List>
            {viewItems.map((item) => (
              <ListItemButton
                key={item.key}
                selected={activeView === item.key}
                onClick={() => {
                  setActiveView(item.key);
                  setDrawerOpen(false);
                }}
              >
                <ListItemText primary={item.label} />
              </ListItemButton>
            ))}
            {isAdminLoggedIn && isMobile && (
              <ListItemButton onClick={() => { handleLogout(); setDrawerOpen(false); }}>
                <ListItemText primary="Log out" />
              </ListItemButton>
            )}
          </List>
        </Box>
      </Drawer>

      <div className="content-area" style={{ flexGrow: 1, padding: "20px" }}>
        {renderView()}
      </div>
    </div>
  );
}

export default App;
