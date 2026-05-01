import React, { useState, useEffect } from 'react';
import { Button, Box, TextField, Stack, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const UpdatePlayer = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [name, setName] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [newName, setNewName] = useState('');
  const [newSponsor, setNewSponsor] = useState('');

  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, 'players'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(data);
      setFilteredPlayers(data);
    };
    fetchPlayers();
  }, []);

  useEffect(() => {
    const filtered = players.filter(player =>
      player.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPlayers(filtered);
  }, [searchTerm, players]);

  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player);
    setName(player.label);
    setSponsor(player.sponsor || '');
  };

  const handleSave = async () => {
    if (selectedPlayer) {
      const playerRef = doc(db, 'players', selectedPlayer.id);
      await updateDoc(playerRef, {
        label: name,
        sponsor: sponsor
      });
      // Update local state
      const updatedPlayers = players.map(p =>
        p.id === selectedPlayer.id ? { ...p, label: name, sponsor: sponsor } : p
      );
      setPlayers(updatedPlayers);
      setFilteredPlayers(updatedPlayers.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase())));
      setSelectedPlayer(null);
      setName('');
      setSponsor('');
      alert('Player updated successfully!');
    }
  };

  const handleDeleteDuplicates = async () => {
    const nameMap = {};
    players.forEach(player => {
      if (!nameMap[player.label]) {
        nameMap[player.label] = [];
      }
      nameMap[player.label].push(player);
    });

    const duplicates = [];
    Object.values(nameMap).forEach(group => {
      if (group.length > 1) {
        // Keep the first one, delete the rest
        for (let i = 1; i < group.length; i++) {
          duplicates.push(group[i]);
        }
      }
    });

    if (duplicates.length === 0) {
      alert('No duplicates found.');
      return;
    }

    const confirmDelete = window.confirm(`Found ${duplicates.length} duplicate(s). Delete them?`);
    if (!confirmDelete) return;

    for (const dup of duplicates) {
      await deleteDoc(doc(db, 'players', dup.id));
    }

    // Update local state
    const remainingPlayers = players.filter(p => !duplicates.some(d => d.id === p.id));
    setPlayers(remainingPlayers);
    setFilteredPlayers(remainingPlayers.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase())));
    alert(`${duplicates.length} duplicate(s) deleted.`);
  };

  const handleAddNew = async () => {
    if (!newName.trim()) {
      alert('Player name is required.');
      return;
    }
    await addDoc(collection(db, 'players'), {
      label: newName.trim(),
      sponsor: newSponsor.trim() || ''
    });
    // Update local state
    const newPlayer = { id: 'temp', label: newName.trim(), sponsor: newSponsor.trim() };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    setFilteredPlayers(updatedPlayers.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase())));
    setNewName('');
    setNewSponsor('');
    alert('New player added successfully!');
  };

  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ p: 2 }}>
      <Box sx={{ width: { xs: '100%', md: '300px' }, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Search Players</Typography>
        <TextField
          fullWidth
          label="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button variant="outlined" fullWidth onClick={handleDeleteDuplicates} sx={{ mb: 2 }}>
          Delete Duplicates
        </Button>
        <Paper sx={{ maxHeight: 400, overflow: 'auto' }}>
          <List>
            {filteredPlayers.map((player) => (
              <ListItem button key={player.id} onClick={() => handleSelectPlayer(player)}>
                <ListItemText primary={player.label} secondary={player.sponsor || 'No sponsor'} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <Box sx={{ flexGrow: 1, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Update Player</Typography>
        {selectedPlayer ? (
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Player Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              label="Sponsor"
              value={sponsor}
              onChange={(e) => setSponsor(e.target.value)}
            />
            <Button variant="contained" onClick={handleSave}>
              Save Changes
            </Button>
          </Stack>
        ) : (
          <Typography>Select a player to update</Typography>
        )}
      </Box>

      <Box sx={{ flexGrow: 1, p: 2, border: '1px solid #ccc', borderRadius: 2, mt: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Add New Player</Typography>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Player Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <TextField
            fullWidth
            label="Sponsor"
            value={newSponsor}
            onChange={(e) => setNewSponsor(e.target.value)}
          />
          <Button variant="contained" onClick={handleAddNew}>
            Add Player
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
};

export default UpdatePlayer;