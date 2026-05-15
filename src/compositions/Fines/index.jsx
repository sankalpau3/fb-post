import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Alert,
  Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AutoCompleteTextBox from '../../component/dropdown';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';

const Fines = ({ currentAdminUsername = 'admin' }) => {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [opponents, setOpponents] = useState([]);
  const [fineTypes, setFineTypes] = useState([]);
  const [fines, setFines] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedFineTypeId, setSelectedFineTypeId] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [openCreateMatchDialog, setOpenCreateMatchDialog] = useState(false);
  const [confirmPaidOpen, setConfirmPaidOpen] = useState(false);
  const [pendingPaidFine, setPendingPaidFine] = useState(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiveConfirmTypedYear, setArchiveConfirmTypedYear] = useState('');
  const [amount, setAmount] = useState('');
  const [addFineTypeOpen, setAddFineTypeOpen] = useState(false);
  const [newFineTypeName, setNewFineTypeName] = useState('');
  const [newFineTypeDefaultAmount, setNewFineTypeDefaultAmount] = useState('');
  const [season, setSeason] = useState(new Date().getFullYear().toString());
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [archiveSeasonName, setArchiveSeasonName] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [playersSnap, matchesSnap, fineTypesSnap, teamsSnap, opponentsSnap] = await Promise.all([
          getDocs(collection(db, 'players')),
          getDocs(collection(db, 'matches')),
          getDocs(collection(db, 'fineTypes')),
          getDocs(collection(db, 'teams')),
          getDocs(collection(db, 'opponents')),
        ]);

        setPlayers(
          playersSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (a.label || a.name || a.playerName || '').localeCompare(b.label || b.name || b.playerName || ''))
        );
        setMatches(
          matchesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setFineTypes(
          fineTypesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setTeams(
          teamsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setOpponents(
          opponentsSnap.docs.map((doc) => {
            const data = doc.data();
            return data.value || data.label || data.name || doc.id;
          })
        );
      } catch (error) {
        console.error('Error fetching lookups', error);
      }
    };

    fetchLookups();
  }, []);

  useEffect(() => {
    fetchFines();
  }, []);

  const fetchFines = async () => {
    try {
      setLoading(true);
      const finesQuery = query(
        collection(db, 'fines'),
        where('isArchived', '==', false),
        where('isPaid', '==', false)
      );
      const finesSnap = await getDocs(finesQuery);
      setFines(
        finesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error('Failed to load fines', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedFineType = useMemo(
    () => fineTypes.find((type) => type.id === selectedFineTypeId),
    [fineTypes, selectedFineTypeId]
  );

  useEffect(() => {
    if (selectedFineType) {
      setAmount(selectedFineType.defaultAmount?.toString() ?? '');
    }
  }, [selectedFineType]);

  const filteredFines = useMemo(() => {
    if (!filterDate) return fines;
    const userSelected = new Date(filterDate + 'T23:59:59');
    return fines.filter((fine) => {
      const createdAt = fine.createdAt?.toDate ? fine.createdAt.toDate() : fine.createdAt;
      return createdAt && createdAt <= userSelected;
    });
  }, [filterDate, fines]);

  const finesGrouped = useMemo(() => {
    return filteredFines.reduce((acc, fine) => {
      const playerName = fine.playerName || 'Unknown Player';
      if (!acc[playerName]) {
        acc[playerName] = { playerName, fines: [], total: 0 };
      }
      acc[playerName].fines.push(fine);
      acc[playerName].total += Number(fine.amount) || 0;
      return acc;
    }, {});
  }, [filteredFines]);

  const buildClipboardText = () => {
    if (filteredFines.length === 0) return 'No unpaid fines found.';

    const matchGroups = filteredFines.reduce((acc, fine) => {
      const matchKey = fine.matchId || 'unknown-match';
      if (!acc[matchKey]) {
        const match = matches.find((item) => item.id === fine.matchId);
        acc[matchKey] = { match, players: {} };
      }
      const playerName = fine.playerName || 'Unknown Player';
      if (!acc[matchKey].players[playerName]) {
        acc[matchKey].players[playerName] = [];
      }
      acc[matchKey].players[playerName].push(fine);
      return acc;
    }, {});

    const lines = [];
    Object.values(matchGroups).forEach(({ match, players }) => {
      const title = match
        ? `${new Date(match.date).toLocaleDateString()} vs ${match.opponent || 'Unknown Opponent'}`
        : 'Unknown Match';
      lines.push(`Match: ${title}`);
      Object.entries(players).forEach(([playerName, fines]) => {
        const playerTotal = fines.reduce((sum, fine) => sum + Number(fine.amount || 0), 0);
        lines.push(`  ${playerName} — Total owed: £${playerTotal.toFixed(2)}`);
        fines.forEach((fine) => {
          lines.push(
            `    - ${fine.fineType || 'Fine'}: £${Number(fine.amount).toFixed(2)}${fine.season ? ` (${fine.season})` : ''}`
          );
        });
      });
      lines.push('');
    });
    return lines.join('\n');
  };

  const copyFinesToClipboard = async () => {
    const text = buildClipboardText();
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: 'Fine list copied to clipboard.' });
    } catch (error) {
      console.error('Clipboard copy failed', error);
      setMessage({ type: 'error', text: 'Unable to copy fines to clipboard.' });
    }
  };

  const handleSaveFine = async () => {
    if (!selectedPlayerId || !selectedMatchId || !selectedFineTypeId || !amount) {
      setMessage({ type: 'error', text: 'Please select player, match, fine type and amount.' });
      return;
    }

    const player = players.find((item) => item.id === selectedPlayerId);
    const fineType = fineTypes.find((item) => item.id === selectedFineTypeId);

    try {
      const docRef = await addDoc(collection(db, 'fines'), {
        playerId: selectedPlayerId,
        playerName: player?.label || player?.name || player?.playerName || 'Unknown Player',
        matchId: selectedMatchId,
        amount: Number(amount),
        isPaid: false,
        isArchived: false,
        season: season || new Date().getFullYear().toString(),
        createdAt: serverTimestamp(),
        fineType: fineType?.name ?? '',
        lastUpdatedBy: currentAdminUsername,
      });
      setMessage({ type: 'success', text: `Fine saved (${docRef.id}) and will be displayed after refresh.` });
      setSelectedPlayerId('');
      setSelectedMatchId('');
      setSelectedFineTypeId('');
      setAmount('');
      setSeason(new Date().getFullYear().toString());
      await fetchFines();
    } catch (error) {
      console.error('Error creating fine', error);
      setMessage({ type: 'error', text: 'Unable to create fine. Try again.' });
    }
  };

  const markFineAsPaid = async (fineId) => {
    try {
      await updateDoc(doc(db, 'fines', fineId), {
        isPaid: true,
        lastUpdatedBy: currentAdminUsername,
      });
      fetchFines();
    } catch (error) {
      console.error('Error marking fine paid', error);
      setMessage({ type: 'error', text: 'Unable to mark fine as paid.' });
    }
  };

  const confirmMarkAsPaid = (fine) => {
    setPendingPaidFine(fine);
    setConfirmPaidOpen(true);
  };

  const handleConfirmMarkAsPaid = async () => {
    if (!pendingPaidFine) return;
    setConfirmPaidOpen(false);
    await markFineAsPaid(pendingPaidFine.id);
    setPendingPaidFine(null);
  };

  const handleCreateMatch = async () => {
    if (!selectedTeam || !selectedOpponent || !matchDate) {
      setMessage({ type: 'error', text: 'Please select a club team, opponent and match date.' });
      return;
    }

    try {
      await addDoc(collection(db, 'matches'), {
        team: selectedTeam,
        opponent: selectedOpponent,
        date: matchDate,
      });
      setMessage({ type: 'success', text: 'Match created successfully.' });
      setOpenCreateMatchDialog(false);
      setSelectedTeam('');
      setSelectedOpponent('');
      setMatchDate(new Date().toISOString().slice(0, 10));
      const matchesSnap = await getDocs(collection(db, 'matches'));
      setMatches(matchesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error creating match', error);
      setMessage({ type: 'error', text: 'Unable to create match. Try again.' });
    }
  };

  const handleSaveFineType = async () => {
    if (!newFineTypeName.trim() || !newFineTypeDefaultAmount) {
      setMessage({ type: 'error', text: 'Please enter fine type name and default amount.' });
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'fineTypes'), {
        name: newFineTypeName.trim(),
        defaultAmount: Number(newFineTypeDefaultAmount),
      });

      const newType = { id: docRef.id, name: newFineTypeName.trim(), defaultAmount: Number(newFineTypeDefaultAmount) };
      setFineTypes((prev) => [...prev, newType]);
      setSelectedFineTypeId(docRef.id);
      setAddFineTypeOpen(false);
      setNewFineTypeName('');
      setNewFineTypeDefaultAmount('');
      setMessage({ type: 'success', text: 'Fine type added successfully.' });
    } catch (error) {
      console.error('Error saving fine type', error);
      setMessage({ type: 'error', text: 'Unable to save fine type. Try again.' });
    }
  };

  const archiveSeason = async (seasonName) => {
    try {
      const batch = writeBatch(db);
      const seasonQuery = query(
        collection(db, 'fines'),
        where('season', '==', seasonName)
      );
      const seasonSnap = await getDocs(seasonQuery);
      seasonSnap.docs.forEach((docItem) => {
        batch.update(doc(db, 'fines', docItem.id), {
          isArchived: true,
          lastUpdatedBy: currentAdminUsername,
        });
      });
      await batch.commit();
      setMessage({ type: 'success', text: `Season ${seasonName} archived successfully.` });
      setArchiveConfirmTypedYear('');
      fetchFines();
    } catch (error) {
      console.error('Error archiving season', error);
      setMessage({ type: 'error', text: 'Unable to archive season. Check console.' });
    }
  };

  const openArchiveConfirm = () => {
    setArchiveConfirmTypedYear('');
    setArchiveConfirmOpen(true);
  };

  const handleConfirmArchive = async () => {
    if (archiveConfirmTypedYear !== archiveSeasonName) {
      setMessage({ type: 'error', text: 'Year text does not match. Archive cancelled.' });
      return;
    }

    setArchiveConfirmOpen(false);
    await archiveSeason(archiveSeasonName);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', py: 2 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
        Fine Management
      </Typography>

      <Stack spacing={2} sx={{ mb: 3 }}>
        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" alignItems="center" sx={{ mb: 2, gap: 2 }}>
            <Button variant="contained" onClick={() => setOpenCreateMatchDialog(true)}>
              Open Create Match
            </Button>
            <Button variant="outlined" onClick={() => setAddFineTypeOpen(true)}>
              Add Fine Type
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Use the buttons above to create a match or add a fine type.
          </Typography>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Create New Fine
          </Typography>
          <Stack spacing={2}>
            {message && <Alert severity={message.type}>{message.text}</Alert>}
            <TextField
              select
              fullWidth
              label="Player"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
              <MenuItem value="">Select a player</MenuItem>
              {players.map((player) => (
                <MenuItem key={player.id} value={player.id}>
                  {(player.label || player.name || player.playerName || 'Unknown Player')} {player.team ? `(${player.team})` : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Match"
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
            >
              <MenuItem value="">Select a match</MenuItem>
              {matches.map((match) => (
                <MenuItem key={match.id} value={match.id}>
                  {new Date(match.date).toLocaleDateString()} vs {match.opponent} ({match.team})
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Fine Type"
              value={selectedFineTypeId}
              onChange={(e) => setSelectedFineTypeId(e.target.value)}
            >
              <MenuItem value="">Select a fine type</MenuItem>
              {fineTypes.map((fineType) => (
                <MenuItem key={fineType.id} value={fineType.id}>
                  {fineType.name} – £{fineType.defaultAmount}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Season"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="2026"
            />

            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <Button variant="contained" onClick={handleSaveFine} sx={{ alignSelf: 'flex-start' }}>
              Save Fine
            </Button>
          </Stack>
        </Paper>

      </Stack>

      <Dialog open={addFineTypeOpen} onClose={() => setAddFineTypeOpen(false)}>
        <DialogTitle>Add Fine Type</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
            <TextField
              fullWidth
              label="Fine Type Name"
              value={newFineTypeName}
              onChange={(e) => setNewFineTypeName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Default Amount"
              type="number"
              value={newFineTypeDefaultAmount}
              onChange={(e) => setNewFineTypeDefaultAmount(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddFineTypeOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveFineType}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCreateMatchDialog} onClose={() => setOpenCreateMatchDialog(false)}>
        <DialogTitle>Create Match</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
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
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateMatchDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateMatch}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmPaidOpen} onClose={() => setConfirmPaidOpen(false)}>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to mark this fine as paid?
          </Typography>
          {pendingPaidFine && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Player: {pendingPaidFine.playerName}</Typography>
              <Typography variant="body2">Fine: {pendingPaidFine.fineType || 'Fine'}</Typography>
              <Typography variant="body2">Amount: £{Number(pendingPaidFine.amount).toFixed(2)}</Typography>
              <Typography variant="body2">Match: {matches.find((match) => match.id === pendingPaidFine.matchId)?.opponent || 'Unknown'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmPaidOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleConfirmMarkAsPaid}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={archiveConfirmOpen} onClose={() => setArchiveConfirmOpen(false)}>
        <DialogTitle>Confirm Archive Season</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
            <Typography>
              Type the year <strong>{archiveSeasonName}</strong> to confirm archiving all fines for that season.
            </Typography>
            <TextField
              fullWidth
              label="Type year to confirm"
              value={archiveConfirmTypedYear}
              onChange={(e) => setArchiveConfirmTypedYear(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveConfirmOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmArchive}
          >
            Confirm Archive
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 2, mt: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2, gap: 2 }}>
          <Typography variant="h6">Unpaid Debts</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" sx={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button variant="outlined" onClick={copyFinesToClipboard}>
              Copy fines list
            </Button>
            <TextField
              label="Show fines created on or before"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ maxWidth: 240 }}
            />
          </Stack>
        </Stack>

        {loading ? (
          <Typography>Loading unpaid fines...</Typography>
        ) : Object.values(finesGrouped).length === 0 ? (
          <Typography>No unpaid fines found.</Typography>
        ) : (
          Object.values(finesGrouped).map((group) => (
            <Box key={group.playerName} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, backgroundColor: '#fafafa' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{group.playerName}</Typography>
                <Typography variant="subtitle2">Total owed: £{group.total.toFixed(2)}</Typography>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1}>
                {group.fines.map((fine) => {
                  const createdAt = fine.createdAt?.toDate ? fine.createdAt.toDate() : fine.createdAt;
                  return (
                    <Paper key={fine.id} sx={{ p: 2, borderRadius: 2, backgroundColor: '#fff' }}>
                      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="flex-start" spacing={2}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{fine.fineType || 'Fine'}</Typography>
                          <Typography variant="body2">Match: {matches.find((match) => match.id === fine.matchId)?.opponent || 'Unknown'}</Typography>
                          <Typography variant="body2">Amount: £{Number(fine.amount).toFixed(2)}</Typography>
                          <Typography variant="body2">Created: {createdAt ? new Date(createdAt).toLocaleDateString() : 'Unknown'}</Typography>
                        </Box>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => confirmMarkAsPaid(fine)}
                          sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
                        >
                          Mark as Paid
                        </Button>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          ))
        )}
      </Paper>

      <Accordion sx={{ mt: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Archive Season
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <TextField
              label="Season to archive"
              value={archiveSeasonName}
              onChange={(e) => setArchiveSeasonName(e.target.value)}
              fullWidth
            />
            <Button
              variant="outlined"
              color="secondary"
              onClick={openArchiveConfirm}
            >
              Archive Season
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default Fines;
