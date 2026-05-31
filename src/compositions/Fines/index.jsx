import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  IconButton,
  Menu,
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
// import AutoCompleteTextBox from '../../component/dropdown';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase';

const Fines = ({ currentAdminUsername = 'admin' }) => {
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [teamCards, setTeamCards] = useState([]);
  const [filterPlayersByMatch, setFilterPlayersByMatch] = useState(true);
  const [fineTypes, setFineTypes] = useState([]);
  const [fines, setFines] = useState([]);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuFine, setMenuFine] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFineId, setEditFineId] = useState(null);
  const [editPlayerId, setEditPlayerId] = useState('');
  const [editMatchId, setEditMatchId] = useState('');
  const [editFilterPlayersByMatch, setEditFilterPlayersByMatch] = useState(true);
  const [editFineType, setEditFineType] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSeason, setEditSeason] = useState(new Date().getFullYear().toString());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteFineId, setDeleteFineId] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedFineTypeId, setSelectedFineTypeId] = useState('');
  const [confirmPaidOpen, setConfirmPaidOpen] = useState(false);
  const [pendingPaidFine, setPendingPaidFine] = useState(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [archiveConfirmTypedYear, setArchiveConfirmTypedYear] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [addFineTypeOpen, setAddFineTypeOpen] = useState(false);
  const [newFineTypeName, setNewFineTypeName] = useState('');
  const [newFineTypeDefaultAmount, setNewFineTypeDefaultAmount] = useState('');
  const [editFineTypes, setEditFineTypes] = useState({});
  const [season, setSeason] = useState(new Date().getFullYear().toString());
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [archiveSeasonName, setArchiveSeasonName] = useState(new Date().getFullYear().toString());
  const [expandedMatchKeys, setExpandedMatchKeys] = useState([]);

  const isMatchGroupToday = (match, playersGroup) => {
    const todayKey = new Date().toISOString().slice(0, 10);
    if (match?.date) {
      const matchDateKey = new Date(match.date).toISOString().slice(0, 10);
      if (matchDateKey === todayKey) return true;
    }
    return Object.values(playersGroup).some((playerGroup) =>
      playerGroup.fines.some((fine) => {
        const createdAt = fine.createdAt?.toDate ? fine.createdAt.toDate() : fine.createdAt;
        return createdAt && new Date(createdAt).toISOString().slice(0, 10) === todayKey;
      })
    );
  };

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [playersSnap, matchesSnap, fineTypesSnap] = await Promise.all([
          getDocs(collection(db, 'players')),
          getDocs(collection(db, 'matches')),
          getDocs(collection(db, 'fineTypes')),
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
        // initialize editable map for inline editing
        const fts = fineTypesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const map = {};
        fts.forEach((ft) => { map[ft.id] = { name: ft.name || '', defaultAmount: ft.defaultAmount ?? '' }; });
        setEditFineTypes(map);
        // load team cards to enable filtering players by match
        const teamCardsSnap = await getDocs(collection(db, 'teamCards'));
        setTeamCards(teamCardsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
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

  const playersForSelectedMatch = useMemo(() => {
    if (!selectedMatchId) return players;
    const tc = teamCards.find((t) => t.matchId === selectedMatchId);
    if (!tc || !tc.playerNames || tc.playerNames.length === 0) return players;
    const names = tc.playerNames;
    return players.filter((p) => names.includes(p.label || p.name || p.playerName));
  }, [players, teamCards, selectedMatchId]);

  const playersForEditMatch = useMemo(() => {
    if (!editMatchId) return players;
    const tc = teamCards.find((t) => t.matchId === editMatchId);
    if (!tc || !tc.playerNames || tc.playerNames.length === 0) return players;
    const names = tc.playerNames;
    return players.filter((p) => names.includes(p.label || p.name || p.playerName));
  }, [players, teamCards, editMatchId]);

  // when switching the create-form filter on, ensure selected player is valid
  useEffect(() => {
    if (filterPlayersByMatch && selectedMatchId) {
      const tc = teamCards.find((t) => t.matchId === selectedMatchId);
      const validNames = tc?.playerNames || [];
      const selPlayer = players.find((p) => p.id === selectedPlayerId);
      const selName = selPlayer?.label || selPlayer?.name || selPlayer?.playerName;
      if (selectedPlayerId && selName && !validNames.includes(selName)) {
        setSelectedPlayerId('');
      }
    }
  }, [filterPlayersByMatch, selectedMatchId, teamCards, players, selectedPlayerId]);

  // when switching the edit-dialog filter on, ensure edit player is valid
  useEffect(() => {
    if (editFilterPlayersByMatch && editMatchId) {
      const tc = teamCards.find((t) => t.matchId === editMatchId);
      const validNames = tc?.playerNames || [];
      const selPlayer = players.find((p) => p.id === editPlayerId);
      const selName = selPlayer?.label || selPlayer?.name || selPlayer?.playerName;
      if (editPlayerId && selName && !validNames.includes(selName)) {
        setEditPlayerId('');
      }
    }
  }, [editFilterPlayersByMatch, editMatchId, teamCards, players, editPlayerId]);

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

  const matchGroups = useMemo(() => {
    return filteredFines.reduce((acc, fine) => {
      const matchKey = fine.matchId || 'unknown-match';
      if (!acc[matchKey]) {
        const match = matches.find((item) => item.id === fine.matchId);
        acc[matchKey] = { match, players: {} };
      }
      const playerName = fine.playerName || 'Unknown Player';
      if (!acc[matchKey].players[playerName]) {
        acc[matchKey].players[playerName] = { playerName, fines: [], total: 0 };
      }
      acc[matchKey].players[playerName].fines.push(fine);
      acc[matchKey].players[playerName].total += Number(fine.amount) || 0;
      return acc;
    }, {});
  }, [filteredFines, matches]);

  useEffect(() => {
    const todaysMatchKeys = Object.entries(matchGroups)
      .filter(([_, mg]) => isMatchGroupToday(mg.match, mg.players))
      .map(([matchKey]) => matchKey);
    setExpandedMatchKeys(todaysMatchKeys);
  }, [matchGroups]);

  const handleMatchAccordionChange = (matchKey) => (event, isExpanded) => {
    setExpandedMatchKeys((prev) => {
      if (isExpanded) {
        return Array.from(new Set([...prev, matchKey]));
      }
      return prev.filter((key) => key !== matchKey);
    });
  };

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
          const descriptionText = fine.description ? ` - ${fine.description}` : '';
          lines.push(
            `    - ${fine.fineType || 'Fine'}: £${Number(fine.amount).toFixed(2)}${descriptionText}${fine.season ? ` (${fine.season})` : ''}`
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

  const buildClipboardTextForMatch = (matchId) => {
    const matchFines = filteredFines.filter((f) => (f.matchId || 'unknown-match') === (matchId || 'unknown-match'));
    if (matchFines.length === 0) return 'No unpaid fines for this match.';

    const players = matchFines.reduce((acc, fine) => {
      const playerName = fine.playerName || 'Unknown Player';
      if (!acc[playerName]) acc[playerName] = [];
      acc[playerName].push(fine);
      return acc;
    }, {});

    const match = matches.find((m) => m.id === matchId);
    const title = match ? `${new Date(match.date).toLocaleDateString()} vs ${match.opponent || 'Unknown Opponent'}` : 'Unknown Match';
    const lines = [`Match: ${title}`];
    Object.entries(players).forEach(([playerName, fines]) => {
      const playerTotal = fines.reduce((sum, fine) => sum + Number(fine.amount || 0), 0);
      lines.push(`  ${playerName} — Total owed: £${playerTotal.toFixed(2)}`);
      fines.forEach((fine) => {
        const descriptionText = fine.description ? ` - ${fine.description}` : '';
        lines.push(`    - ${fine.fineType || 'Fine'}: £${Number(fine.amount).toFixed(2)}${descriptionText}${fine.season ? ` (${fine.season})` : ''}`);
      });
    });
    return lines.join('\n');
  };

  const copyMatchFinesToClipboard = async (matchId) => {
    const text = buildClipboardTextForMatch(matchId);
    try {
      await navigator.clipboard.writeText(text);
      setMessage({ type: 'success', text: 'Match fines copied to clipboard.' });
    } catch (error) {
      console.error('Clipboard copy failed', error);
      setMessage({ type: 'error', text: 'Unable to copy match fines to clipboard.' });
    }
  };

  const handleSaveFine = async () => {
    if (!selectedPlayerId || !selectedMatchId || !selectedFineTypeId || !amount || !description) {
      setMessage({ type: 'error', text: 'Please select match, fine type, player, description and amount.' });
      return;
    }

    const player = players.find((item) => item.id === selectedPlayerId);
    const fineType = fineTypes.find((item) => item.id === selectedFineTypeId);
    const playerName = player?.label || player?.name || player?.playerName || 'Unknown Player';
    const effectiveDescription = description.trim();

    try {
      const docRef = await addDoc(collection(db, 'fines'), {
        playerId: selectedPlayerId,
        playerName,
        matchId: selectedMatchId,
        amount: Number(amount),
        description: effectiveDescription,
        isPaid: false,
        isArchived: false,
        season: season || new Date().getFullYear().toString(),
        createdAt: serverTimestamp(),
        fineType: fineType?.name ?? '',
        lastUpdatedBy: currentAdminUsername,
      });
      setMessage({ type: 'success', text: `Fine saved (${docRef.id}) and will be displayed after refresh.` });
      setSelectedPlayerId('');
      setAmount('');
      setDescription('');
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

  const handleMenuOpen = (event, fine) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuFine(fine);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuFine(null);
  };

  const handleMenuMarkAsPaid = () => {
    if (menuFine) confirmMarkAsPaid(menuFine);
    handleMenuClose();
  };

  const handleMenuEdit = () => {
    if (!menuFine) return;
    setEditFineId(menuFine.id);
    setEditPlayerId(menuFine.playerId || '');
    setEditMatchId(menuFine.matchId || '');
    setEditFineType(menuFine.fineType || '');
    setEditAmount(menuFine.amount?.toString() || '');
    setEditDescription(menuFine.description || '');
    setEditSeason(menuFine.season || new Date().getFullYear().toString());
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (!editFineId) return;
    try {
      await updateDoc(doc(db, 'fines', editFineId), {
        playerId: editPlayerId,
        playerName: (players.find(p => p.id === editPlayerId)?.label) || '',
        matchId: editMatchId,
        fineType: editFineType,
        description: editDescription.trim(),
        amount: Number(editAmount),
        season: editSeason,
        lastUpdatedBy: currentAdminUsername,
      });
      setEditDialogOpen(false);
      fetchFines();
      setMessage({ type: 'success', text: 'Fine updated successfully.' });
    } catch (error) {
      console.error('Error updating fine', error);
      setMessage({ type: 'error', text: 'Unable to update fine.' });
    }
  };

  const handleMenuDelete = () => {
    if (!menuFine) return;
    setDeleteFineId(menuFine.id);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  const handleConfirmDelete = async () => {
    if (!deleteFineId) return;
    try {
      await deleteDoc(doc(db, 'fines', deleteFineId));
      setDeleteConfirmOpen(false);
      setMessage({ type: 'success', text: 'Fine deleted successfully.' });
      fetchFines();
    } catch (error) {
      console.error('Error deleting fine', error);
      setMessage({ type: 'error', text: 'Unable to delete fine.' });
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

    const handleFineTypeChange = (id, field, value) => {
      setEditFineTypes((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    };

    const handleUpdateFineType = async (id) => {
      const payload = editFineTypes[id];
      if (!payload) return;
      if (!payload.name || payload.name.trim() === '' || payload.defaultAmount === '') {
        setMessage({ type: 'error', text: 'Fine type name and amount are required.' });
        return;
      }
      try {
        await updateDoc(doc(db, 'fineTypes', id), {
          name: payload.name.trim(),
          defaultAmount: Number(payload.defaultAmount),
        });
        setFineTypes((prev) => prev.map((ft) => (ft.id === id ? { ...ft, name: payload.name.trim(), defaultAmount: Number(payload.defaultAmount) } : ft)));
        setMessage({ type: 'success', text: 'Fine type updated.' });
      } catch (error) {
        console.error('Error updating fine type', error);
        setMessage({ type: 'error', text: 'Unable to update fine type.' });
      }
    };

    const handleDeleteFineTypeInline = async (id) => {
      try {
        await deleteDoc(doc(db, 'fineTypes', id));
        setFineTypes((prev) => prev.filter((ft) => ft.id !== id));
        setEditFineTypes((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        setMessage({ type: 'success', text: 'Fine type deleted.' });
      } catch (error) {
        console.error('Error deleting fine type', error);
        setMessage({ type: 'error', text: 'Unable to delete fine type.' });
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
            <Button variant="outlined" onClick={() => setAddFineTypeOpen(true)}>
              Add Fine Type
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Use the button above to add a fine type.
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
              label="Match"
              value={selectedMatchId}
              onChange={(e) => { setSelectedMatchId(e.target.value); setSelectedPlayerId(''); setDescription(''); }}
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
              <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                <TextField
                  select
                  fullWidth
                  label="Player"
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                >
                  <MenuItem value="">Select a player</MenuItem>
                  {(filterPlayersByMatch ? playersForSelectedMatch : players).map((player) => (
                    <MenuItem key={player.id} value={player.id}>
                      <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(player.label || player.name || player.playerName || 'Unknown Player')} {player.team ? `(${player.team})` : ''}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <FormControlLabel
                control={<Switch checked={filterPlayersByMatch} onChange={(e) => setFilterPlayersByMatch(e.target.checked)} />}
                label={filterPlayersByMatch ? 'Match players: On' : 'Match players: Off'}
                sx={{ whiteSpace: 'nowrap', mt: { xs: 1, sm: 0 }, alignSelf: 'flex-start' }}
              />
            </Stack>

            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              helperText="Enter a short description for the fine."
            />

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

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Fine</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
              <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                <TextField
                  select
                  fullWidth
                  label="Player"
                  value={editPlayerId}
                  onChange={(e) => setEditPlayerId(e.target.value)}
                >
                  <MenuItem value="">Select a player</MenuItem>
                  {(editFilterPlayersByMatch ? playersForEditMatch : players).map((player) => (
                    <MenuItem key={player.id} value={player.id}>
                      <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(player.label || player.name || player.playerName || 'Unknown Player')}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <FormControlLabel
                control={<Switch checked={editFilterPlayersByMatch} onChange={(e) => setEditFilterPlayersByMatch(e.target.checked)} />}
                label={editFilterPlayersByMatch ? 'Match players: On' : 'Match players: Off'}
                sx={{ whiteSpace: 'nowrap', mt: { xs: 1, sm: 0 }, alignSelf: 'flex-start' }}
              />
            </Stack>

            <TextField
              select
              fullWidth
              label="Match"
              value={editMatchId}
              onChange={(e) => setEditMatchId(e.target.value)}
            >
              <MenuItem value="">Select a match</MenuItem>
              {matches.map((match) => (
                <MenuItem key={match.id} value={match.id}>
                  {new Date(match.date).toLocaleDateString()} vs {match.opponent}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              label="Fine Type"
              value={editFineType}
              onChange={(e) => setEditFineType(e.target.value)}
            >
              <MenuItem value="">Select fine type</MenuItem>
              {fineTypes.map((ft) => (
                <MenuItem key={ft.id} value={ft.name}>{ft.name}</MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              helperText="Enter a short description for the fine."
            />

            <TextField fullWidth label="Amount" type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
            <TextField fullWidth label="Season" value={editSeason} onChange={(e) => setEditSeason(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Fine</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this fine? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>Delete</Button>
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
        ) : Object.values(matchGroups).length === 0 ? (
          <Typography>No unpaid fines found.</Typography>
        ) : (
          Object.entries(matchGroups).map(([matchKey, mg]) => {
            const match = mg.match;
            const title = match ? `${new Date(match.date).toLocaleDateString()} vs ${match.opponent || 'Unknown Opponent'}` : 'Unknown Match';
            const matchTotal = Object.values(mg.players).reduce((s, p) => s + (p.total || 0), 0);
            const isExpanded = expandedMatchKeys.includes(matchKey);

            return (
              <Accordion
                key={matchKey}
                expanded={isExpanded}
                onChange={handleMatchAccordionChange(matchKey)}
                sx={{ mb: 2, borderRadius: 2, backgroundColor: '#fafafa', '&:before': { display: 'none' } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ width: '100%', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">Total owed: £{Number(matchTotal).toFixed(2)}</Typography>
                      <Button variant="outlined" size="small" onClick={(e) => { e.stopPropagation(); copyMatchFinesToClipboard(matchKey); }}>
                        Copy match fines
                      </Button>
                    </Stack>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={2}>
                    {Object.values(mg.players).map((playerGroup) => (
                      <Box key={playerGroup.playerName}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{playerGroup.playerName}</Typography>
                          <Typography variant="body2">Total owed: £{(playerGroup.total || 0).toFixed(2)}</Typography>
                        </Stack>
                        <Stack spacing={1}>
                          {playerGroup.fines.map((fine) => {
                            const createdAt = fine.createdAt?.toDate ? fine.createdAt.toDate() : fine.createdAt;
                            return (
                              <Paper key={fine.id} sx={{ p: 2, borderRadius: 2, backgroundColor: '#fff' }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexGrow: 1, textAlign: 'left', flexWrap: 'wrap' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{fine.fineType || 'Fine'}</Typography>
                                    <Typography variant="body2">£{Number(fine.amount).toFixed(2)}</Typography>
                                    {fine.description && (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                        {fine.description}
                                      </Typography>
                                    )}
                                    <Typography variant="body2">{createdAt ? new Date(createdAt).toLocaleDateString() : 'Unknown'}</Typography>
                                    {fine.season && (
                                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>({fine.season})</Typography>
                                    )}
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, fine)}>
                                      <MoreVertIcon />
                                    </IconButton>
                                  </Box>
                                </Stack>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })
        )}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleMenuMarkAsPaid}>Mark as Paid</MenuItem>
          <MenuItem onClick={handleMenuEdit}>Edit</MenuItem>
          <MenuItem onClick={handleMenuDelete}>Delete</MenuItem>
        </Menu>
      </Paper>

      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Edit Fine Types
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            {fineTypes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No fine types defined.</Typography>
            ) : (
              fineTypes.map((ft) => (
                <Stack key={ft.id} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
                  <TextField
                    label="Name"
                    value={editFineTypes[ft.id]?.name ?? ''}
                    onChange={(e) => handleFineTypeChange(ft.id, 'name', e.target.value)}
                    sx={{ flex: 1, minWidth: 0 }}
                  />
                  <TextField
                    label="Default Amount"
                    type="number"
                    value={editFineTypes[ft.id]?.defaultAmount ?? ''}
                    onChange={(e) => handleFineTypeChange(ft.id, 'defaultAmount', e.target.value)}
                    sx={{ width: 140 }}
                  />
                  <Button variant="outlined" onClick={() => handleUpdateFineType(ft.id)}>Save</Button>
                  <Button variant="contained" color="error" onClick={() => handleDeleteFineTypeInline(ft.id)}>Delete</Button>
                </Stack>
              ))
            )}
          </Stack>
        </AccordionDetails>
      </Accordion>

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
