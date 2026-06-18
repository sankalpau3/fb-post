import React, { useState, useEffect } from 'react';
import { Button, Box, TextField, Stack, Typography, List, ListItem, ListItemText, Paper, Card, CardMedia, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Grid } from '@mui/material';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const UpdatePlayer = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [name, setName] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [photoData, setPhotoData] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [newName, setNewName] = useState('');
  const [newSponsor, setNewSponsor] = useState('');
  const [newPhotoData, setNewPhotoData] = useState(null);
  const [sponsorPhotos, setSponsorPhotos] = useState([]);
  const [sponsorPhotoId, setSponsorPhotoId] = useState(null);
  const [showSponsorDialog, setShowSponsorDialog] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const querySnapshot = await getDocs(collection(db, 'players'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPlayers(data);
      setFilteredPlayers(data);
    };
    const fetchSponsorPhotos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'sponsorPhotos'));
        const photos = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSponsorPhotos(photos);
      } catch (error) {
        console.error('Error loading sponsor photos:', error);
      }
    };
    fetchPlayers();
    fetchSponsorPhotos();
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
    setPhotoData(player.photoData || null);
    setSponsorPhotoId(player.sponsorPhotoId || null);
    setPhotoError('');
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e, isNewPlayer = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 800 * 1024; // 800KB
    if (file.size > maxSize) {
      setPhotoError('Photo size must be less than 800KB');
      return;
    }

    try {
      const base64 = await convertFileToBase64(file);
      setPhotoError('');
      if (isNewPlayer) {
        setNewPhotoData(base64);
      } else {
        setPhotoData(base64);
      }
    } catch (error) {
      setPhotoError('Error uploading photo. Try again.');
    }
  };

  const handleSelectSponsorPhoto = async (photoId) => {
    setSponsorPhotoId(photoId);
    setShowSponsorDialog(false);
    
    // Update player with sponsor photo reference
    if (selectedPlayer) {
      try {
        const playerRef = doc(db, 'players', selectedPlayer.id);
        await updateDoc(playerRef, {
          sponsorPhotoId: photoId
        });
        
        // Update local state
        const updatedPlayers = players.map(p =>
          p.id === selectedPlayer.id ? { ...p, sponsorPhotoId: photoId } : p
        );
        setPlayers(updatedPlayers);
        setFilteredPlayers(updatedPlayers.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase())));
        
        alert('Sponsor photo linked successfully!');
      } catch (error) {
        console.error('Error linking sponsor photo:', error);
        alert('Error linking sponsor photo. Try again.');
      }
    }
  };

  const getCurrentSponsorPhoto = () => {
    if (!sponsorPhotoId) return null;
    return sponsorPhotos.find(p => p.id === sponsorPhotoId);
  };

  const handleSave = async () => {
    if (selectedPlayer) {
      const playerRef = doc(db, 'players', selectedPlayer.id);
      const updatePayload = {
        label: name,
        sponsor: sponsor
      };
      if (photoData) {
        updatePayload.photoData = photoData;
      }
      if (sponsorPhotoId) {
        updatePayload.sponsorPhotoId = sponsorPhotoId;
      }
      await updateDoc(playerRef, updatePayload);
      // Update local state
      const updatedPlayers = players.map(p =>
        p.id === selectedPlayer.id ? { ...p, label: name, sponsor: sponsor, photoData: photoData, sponsorPhotoId: sponsorPhotoId } : p
      );
      setPlayers(updatedPlayers);
      setFilteredPlayers(updatedPlayers.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase())));
      setSelectedPlayer(null);
      setName('');
      setSponsor('');
      setPhotoData(null);
      setSponsorPhotoId(null);
      setPhotoError('');
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
    const newPlayerPayload = {
      label: newName.trim(),
      sponsor: newSponsor.trim() || ''
    };
    if (newPhotoData) {
      newPlayerPayload.photoData = newPhotoData;
    }
    await addDoc(collection(db, 'players'), newPlayerPayload);
    // Update local state
    const newPlayer = { id: 'temp', label: newName.trim(), sponsor: newSponsor.trim(), photoData: newPhotoData };
    const updatedPlayers = [...players, newPlayer];
    setPlayers(updatedPlayers);
    setFilteredPlayers(updatedPlayers.filter(p => p.label.toLowerCase().includes(searchTerm.toLowerCase())));
    setNewName('');
    setNewSponsor('');
    setNewPhotoData(null);
    alert('New player added successfully!');
  };

  return (
    <>
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
            
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Player Photo</Typography>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, false)}
                style={{ marginBottom: '10px' }}
              />
              {photoError && <Alert severity="error" sx={{ mb: 1 }}>{photoError}</Alert>}
              {photoData && (
                <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Card sx={{ flex: '0 0 auto' }}>
                    <CardMedia component="img" height="80" width="80" image={photoData} alt={name} />
                  </Card>
                  <Button variant="outlined" color="error" size="small" onClick={() => setPhotoData(null)}>
                    Delete
                  </Button>
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Sponsor Photo</Typography>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={() => setShowSponsorDialog(true)}
                sx={{ mb: 1 }}
              >
                Select Sponsor Photo
              </Button>
              {sponsorPhotoId && (
                <Box>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1, color: '#666' }}>
                    Current sponsor photo linked
                  </Typography>
                  {getCurrentSponsorPhoto() && (
                    <Card sx={{ display: 'inline-block' }}>
                      <CardMedia 
                        component="img" 
                        height="80" 
                        width="80" 
                        image={getCurrentSponsorPhoto().imageData} 
                        alt="Sponsor" 
                      />
                    </Card>
                  )}
                </Box>
              )}
            </Box>
            
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
          
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Player Photo (Optional)</Typography>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload(e, true)}
              style={{ marginBottom: '10px' }}
            />
            {photoError && <Alert severity="error" sx={{ mb: 1 }}>{photoError}</Alert>}
            {newPhotoData && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Card sx={{ flex: '0 0 auto' }}>
                  <CardMedia component="img" height="80" width="80" image={newPhotoData} alt={newName} />
                </Card>
                <Button variant="outlined" color="error" size="small" onClick={() => setNewPhotoData(null)}>
                  Delete
                </Button>
              </Box>
            )}
          </Box>
          
          <Button variant="contained" onClick={handleAddNew}>
            Add Player
          </Button>
        </Stack>
      </Box>
    </Stack>

    <Dialog 
      open={showSponsorDialog} 
      onClose={() => setShowSponsorDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Select Sponsor Photo</DialogTitle>
      <DialogContent>
        {sponsorPhotos.length === 0 ? (
          <Typography sx={{ py: 3, textAlign: 'center' }}>
            No sponsor photos available. Upload photos in Photo Manager first.
          </Typography>
        ) : (
          <Grid container spacing={1} sx={{ mt: 1 }}>
            {sponsorPhotos.map((photo) => (
              <Grid item xs={6} sm={4} md={3} key={photo.id}>
                <Card 
                  onClick={() => handleSelectSponsorPhoto(photo.id)}
                  sx={{
                    cursor: 'pointer',
                    border: sponsorPhotoId === photo.id ? '3px solid #1a237e' : '1px solid #ccc',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: 2
                    }
                  }}
                >
                  <CardMedia 
                    component="img" 
                    height="100" 
                    image={photo.imageData} 
                    alt={photo.originalFileName}
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowSponsorDialog(false)}>Close</Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default UpdatePlayer;