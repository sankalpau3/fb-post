import React, { useState, useRef, useEffect } from 'react';
import { Alert, Button, Box, TextField, Stack, Typography, MenuItem, Radio } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import template from '../../CDN/static_content/imgages/template.png';
import mainSponsors from '../../CDN/static_content/imgages/mainSponsors.png';
import html2canvas from 'html2canvas';
import AutoCompleteTextBox from "../../component/dropdown"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const PlayerSoponser = () => {
    const [overlayImage, setOverlayImage] = useState(mainSponsors); // Default overlay image
    const [team, setTeam] = useState("");
    const [oponent, setoPonents] = useState("");
    const [playerNames, setPlayerNames] = useState(Array(11).fill(""));
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [teamCards, setTeamCards] = useState([]);
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [teamCardEditingId, setTeamCardEditingId] = useState(null);
    const [message, setMessage] = useState(null);

    // States for Captain and Wicket Keeper
    const [captainIndex, setCaptainIndex] = useState(null);
    const [wkIndex, setWkIndex] = useState(null);

    const graphicRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const playersSnapshot = await getDocs(collection(db, 'players'));
            const playersData = playersSnapshot.docs.map(doc => doc.data());
            setPlayers(playersData);

            const teamsSnapshot = await getDocs(collection(db, 'teams'));
            const teamsData = teamsSnapshot.docs.map(doc => doc.data());
            setTeams(teamsData);
            if (teamsData.length > 0) setTeam(teamsData[0].value);

            const opponentsSnapshot = await getDocs(collection(db, 'opponents'));
            const opponentsData = opponentsSnapshot.docs.map(doc => doc.data());
            if (opponentsData.length > 0) setoPonents(opponentsData[0].value);

            const matchesSnapshot = await getDocs(collection(db, 'matches'));
            setMatches(matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

            const teamCardsSnapshot = await getDocs(collection(db, 'teamCards'));
            setTeamCards(teamCardsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchData();
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) setOverlayImage(URL.createObjectURL(file));
    };

    const handleNameChange = (index, value) => {
        const newNames = [...playerNames];
        newNames[index] = value;
        setPlayerNames(newNames);
    };

    const handleMatchChange = (matchId) => {
        setSelectedMatchId(matchId);
        const selectedMatch = matches.find((match) => match.id === matchId);
        if (selectedMatch) {
            setTeam(selectedMatch.team || '');
            setoPonents(selectedMatch.opponent || '');
        } else {
            setTeam('');
            setoPonents('');
        }

        // Auto-populate if a team card already exists for this match
        const existing = teamCards.find((c) => c.matchId === matchId);
        if (existing) {
            setTeamCardEditingId(existing.id);
            setPlayerNames(existing.playerNames || Array(11).fill(''));
            setCaptainIndex(existing.captainIndex ?? null);
            setWkIndex(existing.wkIndex ?? null);
            setMessage({ type: 'info', text: 'Loaded existing team card for this match.' });
        } else {
            // clear form but keep selected match
            setTeamCardEditingId(null);
            setPlayerNames(Array(11).fill(''));
            setCaptainIndex(null);
            setWkIndex(null);
            setMessage(null);
        }
    };

    const refreshTeamCards = async () => {
        const teamCardsSnapshot = await getDocs(collection(db, 'teamCards'));
        setTeamCards(teamCardsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const resetTeamCardForm = () => {
        setTeamCardEditingId(null);
        setSelectedMatchId('');
        setTeam('');
        setoPonents('');
        setPlayerNames(Array(11).fill(''));
        setCaptainIndex(null);
        setWkIndex(null);
        setMessage(null);
    };

    const handleSaveTeamCard = async () => {
        if (!selectedMatchId) {
            setMessage({ type: 'error', text: 'Select a match before saving the team card.' });
            return;
        }

        try {
            const payload = {
                matchId: selectedMatchId,
                team,
                opponent: oponent,
                playerNames,
                captainIndex,
                wkIndex,
                updatedAt: new Date().toISOString(),
            };
            if (teamCardEditingId) {
                await updateDoc(doc(db, 'teamCards', teamCardEditingId), payload);
                setMessage({ type: 'success', text: 'Team card updated successfully.' });
            } else {
                await addDoc(collection(db, 'teamCards'), {
                    ...payload,
                    createdAt: new Date().toISOString(),
                });
                setMessage({ type: 'success', text: 'Team card saved successfully.' });
            }
            refreshTeamCards();
            resetTeamCardForm();
        } catch (error) {
            console.error('Error saving team card', error);
            setMessage({ type: 'error', text: 'Unable to save team card. Try again.' });
        }
    };

    const handleEditTeamCard = (card) => {
        setTeamCardEditingId(card.id);
        setSelectedMatchId(card.matchId || '');
        const selectedMatch = matches.find((match) => match.id === card.matchId);
        if (selectedMatch) {
            setTeam(selectedMatch.team || '');
            setoPonents(selectedMatch.opponent || '');
        } else {
            setTeam(card.team || '');
            setoPonents(card.opponent || '');
        }
        setPlayerNames(card.playerNames || Array(11).fill(''));
        setCaptainIndex(card.captainIndex ?? null);
        setWkIndex(card.wkIndex ?? null);
        setMessage(null);
    };

    const handleDeleteTeamCard = async (cardId) => {
        try {
            await deleteDoc(doc(db, 'teamCards', cardId));
            setMessage({ type: 'success', text: 'Team card deleted.' });
            if (teamCardEditingId === cardId) {
                resetTeamCardForm();
            }
            refreshTeamCards();
        } catch (error) {
            console.error('Error deleting team card', error);
            setMessage({ type: 'error', text: 'Unable to delete team card.' });
        }
    };

    const downloadFrameAsJpg = async () => {
        if (graphicRef.current) {
            const canvas = await html2canvas(graphicRef.current, {
                useCORS: true,
                allowTaint: false,
                scale: 2,
            });
            const image = canvas.toDataURL("image/jpeg", 0.9);
            const link = document.createElement('a');
            link.href = image;
            link.download = `${team}_vs_${oponent}.jpg`;
            link.click();
        }
    };

    return (
        <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ p: { xs: 1, md: 2 }, alignItems: { xs: 'center', md: 'flex-start' }, width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}
        >
            {/* 1. CONTROLS */}
            <Box sx={{ width: { xs: '100%', md: '500px' }, p: 2, border: '1px solid #ccc', borderRadius: 2, boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Team Card Details</Typography>

                {message && (
                    <Alert severity={message.type} sx={{ mb: 2 }}>
                        {message.text}
                    </Alert>
                )}

                <TextField
                    select
                    fullWidth
                    label="Select Match"
                    value={selectedMatchId}
                    onChange={(e) => handleMatchChange(e.target.value)}
                    sx={{ mb: 2 }}
                >
                    <MenuItem value="">Select a match</MenuItem>
                    {matches.map((match) => (
                        <MenuItem key={match.id} value={match.id}>
                            {new Date(match.date).toLocaleDateString()} vs {match.opponent}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField fullWidth select label="Your Team" value={team} onChange={(e) => setTeam(e.target.value)} sx={{ mb: 2 }} disabled>
                    {teams.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    fullWidth
                    label="Opponent"
                    value={oponent}
                    disabled
                    sx={{ mb: 2 }}
                />

                <Button component="label" variant="outlined" fullWidth startIcon={<CloudUploadIcon />} sx={{ mb: 3 }}>
                    Upload Action Photo
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>

                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Button variant="contained" fullWidth onClick={handleSaveTeamCard}>
                        {teamCardEditingId ? 'Update Team Card' : 'Save Team Card'}
                    </Button>
                    <Button variant="outlined" fullWidth onClick={resetTeamCardForm}>
                        Reset
                    </Button>
                </Stack>

                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1, px: 1 }}>
                    <Typography variant="subtitle2">Starting XI</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>C | WK</Typography>
                </Stack>

                {playerNames.map((name, index) => (
                    <Stack key={index} direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
                        <Box sx={{ flexGrow: 1 }}>
                            <AutoCompleteTextBox
                                label={`#${index + 1}`}
                                options={players}
                                value={name}
                                onChange={(val) => handleNameChange(index, val)}
                            />
                        </Box>
                        <Radio
                            size="small"
                            checked={captainIndex === index}
                            onChange={() => setCaptainIndex(index)}
                            sx={{ p: 0.5, '&.Mui-checked': { color: '#1a237e' } }}
                        />
                        <Radio
                            size="small"
                            checked={wkIndex === index}
                            onChange={() => setWkIndex(index)}
                            sx={{ p: 0.5, '&.Mui-checked': { color: '#2e7d32' } }}
                        />
                    </Stack>
                ))}

                <Button variant="contained" fullWidth onClick={downloadFrameAsJpg} sx={{ mt: 2, py: 1.5, backgroundColor: '#1a237e' }}>
                    Generate Graphic
                </Button>

                {/* saved team cards moved below the preview */}
            </Box>
            {/* Saved team cards list was moved inside the preview below the graphic */}

            {/* 2. PREVIEW */}
            <Box sx={{ width: { xs: '100%', md: 'auto' }, overflowX: 'auto', p: { xs: 1, md: 0 }, backgroundColor: '#e0e0e0', borderRadius: 2 }}>
                <Box
                    id="graphic-container"
                    ref={graphicRef}
                    sx={{ position: 'relative', width: '720px', height: '600px', backgroundColor: '#000', flexShrink: 0, overflow: 'hidden' }}
                >
                    <img src={template} alt="Base" style={{ width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />

                    <Box sx={{
                        position: 'absolute', top: '140px', right: '40px', width: '360px', height: '380px', zIndex: 2,
                        backgroundColor: 'rgb(62, 89, 63)',
                    }} />

                    <Box sx={{
                        position: 'absolute', top: '140px', right: '40px', width: '360px', height: '380px', zIndex: 3,
                        backgroundImage: `url(${overlayImage})`, backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />

                    {/* Header Section */}
                    <Box sx={{
                        position: 'absolute',
                        top: '70px',
                        left: '15px',
                        zIndex: 4,
                        display: 'flex',      // Align children horizontally
                        alignItems: 'baseline', // Align text by the bottom of the letters
                        gap: 2                // Space between Team and Opponent
                    }}>
                        <Typography sx={{
                            fontSize: "2.8rem",
                            lineHeight: 1,
                            textTransform: 'uppercase',
                            fontFamily: 'Archivo Black, sans-serif',
                            color: 'white',
                            textShadow: '3px 3px 0px #1a237e'
                        }}>
                            {team}
                        </Typography>

                        <Typography sx={{
                            fontSize: "1.4rem",
                            textTransform: 'uppercase',
                            fontFamily: 'Archivo, sans-serif',
                            color: '#979797',
                            letterSpacing: '2px'
                        }}>
                            VS {oponent}
                        </Typography>
                    </Box>

                    {/* Single Column Player List */}
                    <Box sx={{ position: 'absolute', top: '140px', left: '40px', zIndex: 4, width: '280px', height: '420px', maxHeight: '410px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        {playerNames.map((name, index) => {
                            let displayName = name || `Player ${index + 1}`;

                            // Find sponsor
                            const player = players.find(p => p.label === name);
                            const sponsor = player?.sponsor;

                            // Append tags
                            if (index === captainIndex) displayName += ' (C)';
                            if (index === wkIndex) displayName += ' (WK)';

                            return (
                                <Box key={index} sx={{ mb: '10px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} id="player-name-box">
                                   
                                    <Typography sx={{
                                        fontSize: "1rem",
                                        lineHeight: 1,
                                        textTransform: 'uppercase',
                                        fontFamily: 'Archivo Black, sans-serif',
                                        color: 'white',
                                        textShadow: '1px 1px 3px rgba(0,0,0,0.8)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}>
                                        {displayName}
                                    </Typography>
                                     {sponsor && (
                                        <Typography sx={{
                                            fontSize: "0.7rem",
                                            lineHeight: 1,
                                            fontFamily: 'Archivo, sans-serif',
                                            color: '#d4d4d4',
                                            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                            mb: '2px',
                                            textTransform: 'capitalize',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            sponsored by {sponsor}
                                        </Typography>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                        {/* Saved team cards list - placed under the graphic */}
                        <Box sx={{ mt: 2, p: 1 }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>Saved Team Cards</Typography>
                            {teamCards.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">No saved team cards yet.</Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {teamCards.map((card) => {
                                        const match = matches.find((matchItem) => matchItem.id === card.matchId);
                                        return (
                                            <Box key={card.id} sx={{ p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                    {match ? `${new Date(match.date).toLocaleDateString()} vs ${match.opponent}` : 'Unlinked Match'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    Team: {card.team} • Players: {card.playerNames.filter(Boolean).length || '0'}
                                                </Typography>
                                                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                    <Button size="small" variant="outlined" onClick={() => handleEditTeamCard(card)}>
                                                        Edit
                                                    </Button>
                                                    <Button size="small" variant="contained" color="error" onClick={() => handleDeleteTeamCard(card.id)}>
                                                        Delete
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Box>
                    </Box>
            </Box>
        </Stack>
    );
}

export default PlayerSoponser;