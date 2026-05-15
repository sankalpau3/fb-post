import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import AutoCompleteTextBox from '../../component/dropdown';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase';

const CreateMatch = () => {
  const [teams, setTeams] = useState([]);
  const [opponents, setOpponents] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [teamsSnap, opponentsSnap, matchesSnap] = await Promise.all([
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'opponents')),
          getDocs(collection(db, 'matches')),
        ]);

        const teamOptions = teamsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTeams(teamOptions);

        const opponentOptions = opponentsSnap.docs.map((doc) => {
          const data = doc.data();
          return data.value || data.label || data.name || doc.id;
        });
        setOpponents(opponentOptions);

        setMatches(matchesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error loading match data', error);
        setMessage({ type: 'error', text: 'Unable to load match settings.' });
      }
    };

    loadData();
  }, []);

  const refreshMatches = async () => {
    const matchesSnap = await getDocs(collection(db, 'matches'));
    setMatches(matchesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const resetForm = () => {
    setSelectedMatchId('');
    setSelectedTeam('');
    setSelectedOpponent('');
    setMatchDate(new Date().toISOString().slice(0, 10));
  };

  const handleSaveMatch = async () => {
    if (!selectedTeam || !selectedOpponent || !matchDate) {
      setMessage({ type: 'error', text: 'Choose a club team, opponent and date.' });
      return;
    }

    try {
      if (selectedMatchId) {
        await updateDoc(doc(db, 'matches', selectedMatchId), {
          team: selectedTeam,
          opponent: selectedOpponent,
          date: matchDate,
        });
        setMessage({ type: 'success', text: 'Match updated successfully.' });
      } else {
        await addDoc(collection(db, 'matches'), {
          team: selectedTeam,
          opponent: selectedOpponent,
          date: matchDate,
        });
        setMessage({ type: 'success', text: 'Match created successfully.' });
      }
      resetForm();
      refreshMatches();
    } catch (error) {
      console.error('Error saving match', error);
      setMessage({ type: 'error', text: 'Unable to save match. Try again.' });
    }
  };

  const handleEditMatch = (match) => {
    setSelectedMatchId(match.id);
    setSelectedTeam(match.team || '');
    setSelectedOpponent(match.opponent || '');
    setMatchDate(match.date ? match.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setMessage(null);
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      await deleteDoc(doc(db, 'matches', matchId));
      setMessage({ type: 'success', text: 'Match deleted successfully.' });
      if (selectedMatchId === matchId) {
        resetForm();
      }
      refreshMatches();
    } catch (error) {
      console.error('Error deleting match', error);
      setMessage({ type: 'error', text: 'Unable to delete match.' });
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', py: 2 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        Match Management
      </Typography>

      <Stack spacing={3}>
        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {selectedMatchId ? 'Edit Match' : 'Create Match'}
          </Typography>

          {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

          <Stack spacing={2}>
            <TextField
              select
              fullWidth
              label="Club Team"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
            >
              <MenuItem value="">Select a club team</MenuItem>
              {teams.map((team) => (
                <MenuItem key={team.id} value={team.value ?? team.label ?? team.name}>
                  {team.label ?? team.value ?? team.name}
                </MenuItem>
              ))}
            </TextField>

            <AutoCompleteTextBox
              label="Opponent"
              options={opponents}
              value={selectedOpponent}
              onChange={(val) => setSelectedOpponent(val)}
            />

            <TextField
              fullWidth
              label="Match Date"
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={handleSaveMatch}>
                Save Match
              </Button>
              <Button variant="outlined" onClick={resetForm}>
                Reset
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Existing Matches
          </Typography>
          {matches.length === 0 ? (
            <Typography>No matches created yet.</Typography>
          ) : (
            <Stack spacing={2}>
              {matches.map((match) => (
                <Paper key={match.id} sx={{ p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {new Date(match.date).toLocaleDateString()} vs {match.opponent}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Team: {match.team}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => handleEditMatch(match)}>
                      Edit
                    </Button>
                    <Button size="small" variant="contained" color="error" onClick={() => handleDeleteMatch(match.id)}>
                      Delete
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      </Stack>
    </Box>
  );
};

export default CreateMatch;
