import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Alert, Button, Box, TextField, Stack, Typography, MenuItem, Radio, Card, CardMedia, Grid } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import template from '../../CDN/static_content/imgages/template.png';
import mainSponsors from '../../CDN/static_content/imgages/mainSponsors.png';
import html2canvas from 'html2canvas';
import AutoCompleteTextBox from "../../component/dropdown"
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const PlayerSoponser = () => {
    const [overlayImage, setOverlayImage] = useState(mainSponsors); // Default overlay image
    const [selectedPhotoId, setSelectedPhotoId] = useState(null);
    const [actionPhotos, setActionPhotos] = useState([]);
    const [team, setTeam] = useState("");
    const [oponent, setoPonents] = useState("");
    const [playerNames, setPlayerNames] = useState(Array(11).fill(""));
    const [players, setPlayers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [teamCards, setTeamCards] = useState([]);
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [showAllMatches, setShowAllMatches] = useState(false);
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

            // Load action photos
            const photosSnapshot = await getDocs(collection(db, 'actionPhotos'));
            setActionPhotos(photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchData();
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setOverlayImage(URL.createObjectURL(file));
            setSelectedPhotoId(null); // Clear selected photo if uploading new one
        }
    };

    const handleSelectPhoto = (photo) => {
        setOverlayImage(photo.imageData); // Use base64 data
        setSelectedPhotoId(photo.id);
    };

    const handleNameChange = (index, value) => {
        const newNames = [...playerNames];
        newNames[index] = value;
        setPlayerNames(newNames);
    };

    const getCurrentWeekMatchIds = (matchList = []) => {
        const now = new Date();
        const weekStart = new Date(now);
        const currentDay = (now.getDay() + 6) % 7;
        weekStart.setDate(now.getDate() - currentDay);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        return matchList
            .filter((match) => {
                if (!match.date) return false;
                const matchDate = new Date(`${match.date}T00:00:00`);
                return matchDate >= weekStart && matchDate <= weekEnd;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((match) => match.id);
    };

    const visibleMatches = React.useMemo(() => {
        if (showAllMatches) return [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
        const currentWeekIds = new Set(getCurrentWeekMatchIds(matches));
        return matches.filter((match) => currentWeekIds.has(match.id));
    }, [matches, showAllMatches]);

    useEffect(() => {
        if (!matches.length || selectedMatchId) return;

        const currentWeekMatches = getCurrentWeekMatchIds(matches);
        const fallbackMatch = currentWeekMatches[0] || matches[0]?.id;
        if (fallbackMatch) {
            setSelectedMatchId(fallbackMatch);
            handleMatchChange(fallbackMatch);
        }
    }, [matches, selectedMatchId, handleMatchChange]);

    const handleMatchChange = useCallback((matchId) => {
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

            // Restore selected photo if available
            if (existing.selectedPhotoId) {
                const selectedPhoto = actionPhotos.find(p => p.id === existing.selectedPhotoId);
                if (selectedPhoto) {
                    setOverlayImage(selectedPhoto.imageData);
                    setSelectedPhotoId(existing.selectedPhotoId);
                } else {
                    setOverlayImage(mainSponsors);
                    setSelectedPhotoId(null);
                }
            } else {
                setOverlayImage(mainSponsors);
                setSelectedPhotoId(null);
            }

            setMessage({ type: 'info', text: 'Loaded existing team card for this match.' });
        } else {
            // clear form but keep selected match
            setTeamCardEditingId(null);
            setPlayerNames(Array(11).fill(''));
            setCaptainIndex(null);
            setWkIndex(null);
            setSelectedPhotoId(null);
            setOverlayImage(mainSponsors);
            setMessage(null);
        }
    }, [matches, teamCards]);

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
        setSelectedPhotoId(null);
        setOverlayImage(mainSponsors);
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
                selectedPhotoId,
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
        } catch (error) {
            console.error('Error saving team card', error);
            setMessage({ type: 'error', text: 'Unable to save team card. Try again.' });
        }
    };

    const downloadFrameAsJpg = async () => {
        if (graphicRef.current) {
            const scaleFactor = Math.max(2, window.devicePixelRatio || 1);
            const canvas = await html2canvas(graphicRef.current, {
                useCORS: true,
                allowTaint: false,
                scale: scaleFactor,
                imageTimeout: 15000,
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `${team}_vs_${oponent}.png`;
            link.click();
        }
    };

    const handleGenerateAndSaveGraphic = async () => {
        try {
            // First save the team card
            await handleSaveTeamCard();
            // Then download the graphic
            await downloadFrameAsJpg();
        } catch (error) {
            console.error('Error generating graphic:', error);
        }
    };

    return (
        <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{
                p: { xs: 1, md: 2 },
                alignItems: { xs: 'stretch', md: 'flex-start' },
                width: '100%',
                maxWidth: '100vw',
                overflowX: 'hidden',
                background: '#edf2ee',
            }}
        >
            <Box
                sx={{
                    width: { xs: '100%', md: '500px' },
                    p: 2,
                    border: '1px solid #d9e1dc',
                    borderRadius: 0,
                    boxSizing: 'border-box',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background: '#f7faf8',
                    boxShadow: '0 6px 18px rgba(17, 48, 34, 0.03)',
                }}
            >
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#183027' }}>
                    Team Card Details
                </Typography>

                {message && (
                    <Alert severity={message.type} sx={{ mb: 2, borderRadius: 0 }}>
                        {message.text}
                    </Alert>
                )}

                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <TextField
                        select
                        fullWidth
                        label="View all matches"
                        value={showAllMatches ? 'all' : 'week'}
                        onChange={(e) => setShowAllMatches(e.target.value === 'all')}
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                    >
                        <MenuItem value="week">Current week</MenuItem>
                        <MenuItem value="all">All matches</MenuItem>
                    </TextField>

                    <TextField
                        select
                        fullWidth
                        label="Select Match"
                        value={selectedMatchId}
                        onChange={(e) => handleMatchChange(e.target.value)}
                        size="small"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                    >
                        <MenuItem value="">Select a match</MenuItem>
                        {visibleMatches.map((match) => (
                            <MenuItem key={match.id} value={match.id}>
                                {new Date(match.date).toLocaleDateString()} vs {match.opponent}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>

                <TextField fullWidth select label="Your Team" value={team} onChange={(e) => setTeam(e.target.value)} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }} disabled>
                    {teams.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </TextField>

                <TextField
                    fullWidth
                    label="Opponent"
                    value={oponent}
                    disabled
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                />

                <Button
                    component="label"
                    variant="outlined"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{
                        mb: 3,
                        borderRadius: 0,
                        background: '#ffffff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 700,
                    }}
                >
                    Upload Action Photo
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>

                {actionPhotos.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#213c31' }}>Select from Available Photos</Typography>
                        <Grid container spacing={1}>
                            {actionPhotos.map((photo) => (
                                <Grid item xs={6} sm={4} key={photo.id}>
                                    <Card
                                        onClick={() => handleSelectPhoto(photo)}
                                        sx={{
                                            cursor: 'pointer',
                                            border: selectedPhotoId === photo.id ? '2px solid #1b6b43' : '1px solid #d8e0db',
                                            borderRadius: 0,
                                            overflow: 'hidden',
                                            transition: 'all 0.2s',
                                            boxShadow: 'none',
                                            '&:hover': {
                                                boxShadow: '0 8px 18px rgba(17, 48, 34, 0.08)',
                                                borderColor: '#1b6b43',
                                            }
                                        }}
                                    >
                                        <CardMedia
                                            component="img"
                                            height="80"
                                            image={photo.imageData}
                                            alt={photo.originalFileName}
                                            sx={{ objectFit: 'cover' }}
                                        />
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                )}

                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSaveTeamCard}
                        sx={{ borderRadius: 0, background: '#0f5d26', '&:hover': { background: '#0d4d21' } }}
                    >
                        {teamCardEditingId ? 'Update Team Card' : 'Save Team Card'}
                    </Button>
                    <Button variant="outlined" fullWidth onClick={resetTeamCardForm} sx={{ borderRadius: 0 }}>
                        Reset
                    </Button>
                </Stack>

                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1, px: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#213c31' }}>Starting XI</Typography>
                    <Typography variant="caption" sx={{ color: '#5c6f66' }}>C | WK</Typography>
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

                {/* saved team cards moved below the preview */}
            </Box>

            <Box sx={{
                width: { xs: '100%', md: 'auto' },
                overflowX: 'auto',
                p: { xs: 1, md: 0 },
                background: '#dfe7e2',
                border: '1px solid #d4ddd8',
                borderRadius: 0,
                boxShadow: '0 8px 22px rgba(17, 48, 34, 0.04)',
            }}>
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
                </Box>

                {/* Generate Graphic Button - moved out of scrollable area and placed under the image */}
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleGenerateAndSaveGraphic}
                    sx={{ mt: 2, py: 1.5, backgroundColor: '#1a237e' }}
                >
                    Generate Graphic
                </Button>
            </Box>
        </Stack>
    );
}

export default PlayerSoponser;