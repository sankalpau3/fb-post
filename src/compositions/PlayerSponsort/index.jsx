import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Box, TextField, Stack, FormControlLabel, Switch, MenuItem } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import template from '../../CDN/static_content/imgages/template.png';
import sample from '../../CDN/static_content/imgages/sample_headshot.jpg';
import sampleAd from '../../CDN/static_content/imgages/sample_ad.jpg';
import html2canvas from 'html2canvas';
import AutoCompleteTextBox from "../../component/dropdown"
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import calcFontSize from "../../utils/calculateFontSize"

const PlayerSoponser = () => {
    const [overlayImage, setOverlayImage] = useState(null);
    const [performanceType, setPerformanceType] = useState('batting');
    const [scoreText, setScoreText] = useState("99");
    const [activityType, setActivityType] = useState("Runs");
    const [stats, setStats] = useState("99(40) | 4x10 | 6x5 | SR: 247.5");
    const [name, setName] = useState("");
    const [team1, setTeam1] = useState("Ratby Town CC 2nd XI");
    const [team2, setTeam2] = useState("ABC CC 1st XI");
    const [overlayImageAd, setOverlayImageAd] = useState(null);
    const [players, setPlayers] = useState([]);
    const [runs, setRuns] = useState(99);
    const [ballsFaced, setBallsFaced] = useState(40);
    const [fours, setFours] = useState(10);
    const [sixes, setSixes] = useState(5);
    const [wickets, setWickets] = useState(2);
    const [overs, setOvers] = useState('4.2');
    const [maidens, setMaidens] = useState(1);
    const [matches, setMatches] = useState([]);
    const [teamCards, setTeamCards] = useState([]);
    const [selectedMatchId, setSelectedMatchId] = useState('');
    const [useAllPlayers, setUseAllPlayers] = useState(false);
    const [showAllMatches, setShowAllMatches] = useState(false);
    const [sponsorPhotos, setSponsorPhotos] = useState([]);
    const [isCaptain, setIsCaptain] = useState(false);
    const [isWicketKeeper, setIsWicketKeeper] = useState(false);
    const [specialNotes, setSpecialNotes] = useState('');
    const [generatedText, setGeneratedText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const graphicRef = useRef(null);

    useEffect(() => {
        const fetchPlayers = async () => {
            const querySnapshot = await getDocs(collection(db, 'players'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPlayers(data);
        };
        const fetchMatches = async () => {
            const querySnapshot = await getDocs(collection(db, 'matches'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMatches(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
        };
        const fetchTeamCards = async () => {
            const querySnapshot = await getDocs(collection(db, 'teamCards'));
            const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTeamCards(data);
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
        fetchMatches();
        fetchTeamCards();
        fetchSponsorPhotos();
    }, []);

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

    const visibleMatches = useMemo(() => {
        if (showAllMatches) return [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
        const currentWeekIds = new Set(getCurrentWeekMatchIds(matches));
        return matches.filter((match) => currentWeekIds.has(match.id));
    }, [matches, showAllMatches]);

    const selectedMatch = useMemo(
        () => matches.find((match) => match.id === selectedMatchId) || null,
        [matches, selectedMatchId]
    );

    useEffect(() => {
        if (!matches.length || selectedMatchId) return;

        const currentWeekMatches = getCurrentWeekMatchIds(matches);
        const fallbackMatch = currentWeekMatches[0] || matches[0]?.id;
        if (fallbackMatch) {
            setSelectedMatchId(fallbackMatch);
        }
    }, [matches, selectedMatchId]);

    const filteredPlayers = useMemo(() => {
        if (!selectedMatchId || useAllPlayers) {
            return players;
        }

        const teamCard = teamCards.find((card) => card.matchId === selectedMatchId);
        if (!teamCard || !Array.isArray(teamCard.playerNames) || teamCard.playerNames.length === 0) {
            return players;
        }

        const teamPlayerNames = teamCard.playerNames
            .map((value) => value?.trim())
            .filter(Boolean);

        return players.filter((player) => {
            const playerName = player.label || player.name || player.playerName || '';
            return teamPlayerNames.includes(playerName);
        });
    }, [players, selectedMatchId, teamCards, useAllPlayers]);

    useEffect(() => {
        if (!selectedMatchId) {
            return;
        }

        if (selectedMatch) {
            setTeam1(`Ratby Town CC ${selectedMatch.team || ''}`);
            setTeam2(selectedMatch.opponent || '');
        }

        if (name && !filteredPlayers.some((player) => (player.label || player.name || player.playerName) === name)) {
            setName('');
        }
    }, [selectedMatchId, selectedMatch, filteredPlayers, name]);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) setOverlayImage(URL.createObjectURL(file));
    };

    const handleFileChangeAd = (event) => {
        const file = event.target.files[0];
        if (file) setOverlayImageAd(URL.createObjectURL(file));
    };

    const handlePlayerSelect = (playerName) => {
        setName(playerName);
        // Find the player in the players array and load their photo
        const selectedPlayer = players.find(p => p.label === playerName);
        if (selectedPlayer) {
            // Load player photo
            if (selectedPlayer.photoData) {
                setOverlayImage(selectedPlayer.photoData);
            }
            // Load sponsor photo if linked
            if (selectedPlayer.sponsorPhotoId) {
                const sponsorPhoto = sponsorPhotos.find(p => p.id === selectedPlayer.sponsorPhotoId);
                if (sponsorPhoto) {
                    setOverlayImageAd(sponsorPhoto.imageData);
                }
            }
        }
    };

    const downloadFrameAsJpg = async () => {
        if (graphicRef.current) {
            const scaleFactor = Math.max(3, Math.round((window.devicePixelRatio || 1) * 2));
            const canvas = await html2canvas(graphicRef.current, {
                useCORS: true,
                allowTaint: false,
                scale: scaleFactor,
                imageTimeout: 15000,
                backgroundColor: null,
            });
            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `${name.replace(/\s+/g, '_') || 'player'}_stats.png`;
            link.click();
        }
    };

    const formatToTwoDecimals = (value) => {
        if (!Number.isFinite(Number(value))) return '0';
        return Number(Number(value).toFixed(2)).toString();
    };

    const getLegalBallsFromOvers = (oversValue) => {
        if (oversValue === '' || oversValue === null || oversValue === undefined) return 0;
        const trimmed = String(oversValue).trim();
        if (!trimmed) return 0;

        const [oversPart, ballsPart = '0'] = trimmed.split('.');
        const oversNumber = Number(oversPart || 0);
        const ballsNumber = Number(ballsPart || 0);

        return (oversNumber * 6) + ballsNumber;
    };

    const buildBattingStats = (runsValue, ballsValue, foursValue, sixesValue) => {
        const safeRuns = Number(runsValue) || 0;
        const safeBalls = Number(ballsValue) || 0;
        const safeFours = Number(foursValue) || 0;
        const safeSixes = Number(sixesValue) || 0;

        let output = `${safeRuns}(${safeBalls})`;
        if (safeFours > 0) output += ` | 4x${safeFours}`;
        if (safeSixes > 0) output += ` | 6x${safeSixes}`;

        if (safeBalls > 0) {
            const strikeRate = (safeRuns / safeBalls) * 100;
            output += ` | SR: ${formatToTwoDecimals(strikeRate)}`;
        } else {
            output += ' | SR: 0';
        }

        return output;
    };

    const buildBowlingStats = (wicketsValue, oversValue, maidensValue) => {
        const safeWickets = Number(wicketsValue) || 0;
        const safeMaidens = Number(maidensValue) || 0;
        const legalBalls = getLegalBallsFromOvers(oversValue);
        let output = `${safeWickets}w`;

        const oversDisplay = String(oversValue || '0');
        output += ` | ${oversDisplay} ov`;

        if (safeMaidens > 0) {
            output += ` | ${safeMaidens}m`;
        }

        if (safeWickets > 0) {
            const economy = legalBalls / safeWickets;
            output += ` | Econ: ${formatToTwoDecimals(economy)}`;
        } else {
            output += ' | Econ: 0';
        }

        return output;
    };

    useEffect(() => {
        if (performanceType === 'batting') {
            setActivityType('Runs');
            setScoreText(String(Number(runs) || 0));
            setStats(buildBattingStats(runs, ballsFaced, fours, sixes));
            return;
        }

        setActivityType('Wickets');
        setScoreText(String(Number(wickets) || 0));
        setStats(buildBowlingStats(wickets, overs, maidens));
    }, [performanceType, runs, ballsFaced, fours, sixes, wickets, overs, maidens]);

    const generatedPrompt = useMemo(() => {
        const playerName = name || 'Player name';
        const matchLabel = selectedMatch ? `${selectedMatch.team || team1} vs ${selectedMatch.opponent || team2}` : `${team1} vs ${team2}`;
        const battingSummary = `${Number(runs) || 0} runs from ${Number(ballsFaced) || 0} balls${Number(fours) > 0 ? `, ${Number(fours)} fours` : ''}${Number(sixes) > 0 ? `, ${Number(sixes)} sixes` : ''}; SR ${formatToTwoDecimals((Number(runs) || 0) / (Number(ballsFaced) || 1) * 100)}`;
        const bowlingSummary = `${Number(wickets) || 0} wickets, ${String(overs || '0')} overs${Number(maidens) > 0 ? `, ${Number(maidens)} maidens` : ''}; Econ ${formatToTwoDecimals((getLegalBallsFromOvers(overs) || 0) / (Number(wickets) || 1))}`;
        const roleText = `${isCaptain ? 'captain' : 'player'}${isWicketKeeper ? ' and wicket keeper' : ''}`;
        const notesText = specialNotes ? `Additional notes: ${specialNotes}` : 'Additional notes: None provided.';

        return `Create an enthusiastic club cricket social media post based on the following match performance assuming you are a professional cricket commentator.\n\nPlayer: ${playerName}\nRole: ${roleText}\nMatch: ${matchLabel}\nPerformance: ${performanceType === 'batting' ? 'Batting' : 'Bowling'}\n${performanceType === 'batting' ? `Batting stats: ${battingSummary}` : `Bowling stats: ${bowlingSummary}`}\n${notesText}\n\nWrite in a warm, professional, match-day style for a club Facebook/Instagram post. The post MUST be approximately 400 words long. Include the player's name, mention they're ${roleText}, their performance highlights, and add engaging commentary about the match. Make it engaging and celebratory, and do not invent any facts beyond the supplied details.`;
    }, [name, selectedMatch, team1, team2, performanceType, runs, ballsFaced, fours, sixes, wickets, overs, maidens, isCaptain, isWicketKeeper, specialNotes]);

    const generatePostFromAi = async () => {
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        if (!apiKey) {
            setGeneratedText('Missing API key: add REACT_APP_GEMINI_API_KEY to your .env file to generate the post.\n\nGet a free Gemini API key at: https://aistudio.google.com/app/apikey');
            return;
        }

        setIsGenerating(true);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: generatedPrompt,
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.8,
                            maxOutputTokens: 2048,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error?.message || 'Failed to generate post.');
            }

            const data = await response.json();
            console.log('Full Gemini response:', data);
            
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('Extracted text:', text);
            console.log('Text length:', text?.length);

            if (!text) {
                throw new Error('No post was returned by the AI.');
            }

            console.log('Setting generated text with:', text);
            setGeneratedText(text);
        } catch (error) {
            console.error('Gemini generation failed:', error);
            setGeneratedText(`Generation failed: ${error.message || 'Please try again.'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyPromptToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generatedText || generatedPrompt);
        } catch (error) {
            console.error('Could not copy text to clipboard', error);
        }
    };

    const dynamicNameSize = calcFontSize(name);

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
                    width: { xs: '100%', sm: '100%', md: '500px' },
                    p: 2,
                    border: '1px solid #d9e1dc',
                    borderRadius: 0,
                    boxSizing: 'border-box',
                    background: '#f7faf8',
                    boxShadow: '0 6px 18px rgba(17, 48, 34, 0.03)',
                }}
                id="controls"
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showAllMatches}
                                onChange={(event) => setShowAllMatches(event.target.checked)}
                            />
                        }
                        label="View all matches"
                        sx={{ ml: 0, color: '#183027', fontWeight: 600 }}
                    />

                    <TextField
                        select
                        fullWidth
                        label="Match"
                        value={selectedMatchId}
                        onChange={(event) => setSelectedMatchId(event.target.value)}
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

                <FormControlLabel
                    control={
                        <Switch
                            checked={useAllPlayers}
                            onChange={(event) => setUseAllPlayers(event.target.checked)}
                        />
                    }
                    label="Use all club players"
                    sx={{ mb: 1, ml: 0, color: '#183027', fontWeight: 600 }}
                />

                <Box sx={{ mb: 1 }}>
                    <AutoCompleteTextBox label="Player" options={filteredPlayers} value={name} onChange={handlePlayerSelect} />
                </Box>

                <TextField
                    select
                    fullWidth
                    label="Performance"
                    value={performanceType}
                    onChange={(event) => setPerformanceType(event.target.value)}
                    size="small"
                    sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                >
                    <MenuItem value="batting">Batting</MenuItem>
                    <MenuItem value="bowling">Bowling</MenuItem>
                </TextField>

                {performanceType === 'batting' ? (
                    <>
                        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                            <TextField
                                fullWidth
                                label="Runs"
                                variant="outlined"
                                value={runs}
                                onChange={(e) => setRuns(e.target.value)}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                            />
                            <TextField
                                fullWidth
                                label="Balls faced"
                                variant="outlined"
                                value={ballsFaced}
                                onChange={(e) => setBallsFaced(e.target.value)}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                            />
                        </Stack>

                        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                            <TextField
                                fullWidth
                                label="4s"
                                variant="outlined"
                                value={fours}
                                onChange={(e) => setFours(e.target.value)}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                            />
                            <TextField
                                fullWidth
                                label="6s"
                                variant="outlined"
                                value={sixes}
                                onChange={(e) => setSixes(e.target.value)}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                            />
                        </Stack>
                    </>
                ) : (
                    <>
                        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                            <TextField
                                fullWidth
                                label="Wickets"
                                variant="outlined"
                                value={wickets}
                                onChange={(e) => setWickets(e.target.value)}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                            />
                            <TextField
                                fullWidth
                                label="Overs"
                                variant="outlined"
                                value={overs}
                                onChange={(e) => setOvers(e.target.value)}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                            />
                        </Stack>

                        <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                            <TextField
                                fullWidth
                                label="Maidens"
                                variant="outlined"
                                value={maidens}
                                onChange={(e) => setMaidens(e.target.value)}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                            />
                            <TextField
                                fullWidth
                                label="Econ"
                                variant="outlined"
                                value={
                                    Number(wickets) > 0
                                        ? formatToTwoDecimals(getLegalBallsFromOvers(overs) / Number(wickets))
                                        : '0'
                                }
                                InputProps={{ readOnly: true }}
                                size="small"
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                            />
                        </Stack>
                    </>
                )}

                <TextField
                    fullWidth
                    label="Stats"
                    variant="outlined"
                    value={stats}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                    size="small"
                />

                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isCaptain}
                                onChange={(event) => setIsCaptain(event.target.checked)}
                            />
                        }
                        label="Captain"
                        sx={{ ml: 0, color: '#183027', fontWeight: 600 }}
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={isWicketKeeper}
                                onChange={(event) => setIsWicketKeeper(event.target.checked)}
                            />
                        }
                        label="Wicket keeper"
                        sx={{ ml: 0, color: '#183027', fontWeight: 600 }}
                    />
                </Stack>

                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <TextField fullWidth label="Team 1" variant="outlined" value={`Ratby Town CC ${team1}`} onChange={(e) => setTeam1(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }} />
                    <TextField fullWidth label="Team 2" variant="outlined" value={team2} onChange={(e) => setTeam2(e.target.value)} size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }} />
                </Stack>

                <Button
                    component="label"
                    variant="contained"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{
                        mb: 2,
                        borderRadius: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 700,
                    }}
                >
                    Upload Player Photo
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>

                <Button
                    component="label"
                    variant="contained"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{
                        mb: 2,
                        borderRadius: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 700,
                    }}
                >
                    Upload Ad Banner
                    <input type="file" hidden accept="image/*" onChange={handleFileChangeAd} />
                </Button>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={downloadFrameAsJpg}
                    sx={{
                        backgroundColor: '#0f5d26',
                        borderRadius: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 700,
                        '&:hover': { backgroundColor: '#0d4d21' }
                    }}
                >
                    Download Graphic
                </Button>

                <Box style={{ paddingTop: '20px' }}>

                    <TextField
                        fullWidth
                        label="Special notes"
                        variant="outlined"
                        value={specialNotes}
                        onChange={(e) => setSpecialNotes(e.target.value)}
                        multiline
                        minRows={3}
                        sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={generatePostFromAi}
                        disabled={isGenerating}
                        sx={{
                            mb: 2,
                            backgroundColor: '#1b5e20',
                            borderRadius: 0,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            fontWeight: 700,
                            '&:hover': { backgroundColor: '#144a1a' }
                        }}
                    >
                        {isGenerating ? 'Generating...' : 'Generate social post'}
                    </Button>

                    <TextField
                        fullWidth
                        label="Generated post"
                        variant="outlined"
                        value={generatedText || 'Click “Generate social post” to create the text.'}
                        InputProps={{ readOnly: true }}
                        multiline
                        minRows={12}
                        sx={{ mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 0, background: '#fff' } }}
                    />

                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={copyPromptToClipboard}
                            sx={{
                                backgroundColor: '#1b5e20',
                                borderRadius: 0,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                fontWeight: 700,
                                '&:hover': { backgroundColor: '#144a1a' }
                            }}
                        >
                            Copy post
                        </Button>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={async () => {
                                try {
                                    await navigator.clipboard.writeText(generatedPrompt);
                                } catch (error) {
                                    console.error('Could not copy prompt to clipboard', error);
                                }
                            }}
                            sx={{
                                backgroundColor: '#0f5d26',
                                borderRadius: 0,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                fontWeight: 700,
                                '&:hover': { backgroundColor: '#0d4d21' }
                            }}
                        >
                            Copy prompt
                        </Button>
                    </Stack>
                </Box>
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
                    sx={{
                        position: 'relative',
                        width: '720px',
                        height: '600px',
                        backgroundColor: '#000',
                        boxShadow: 10,
                        flexShrink: 0,
                    }}
                >
                    <img src={template} alt="Base" style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />

                    <Box sx={{
                        position: 'absolute',
                        top: '100px',
                        left: '20px',
                        width: '210px',
                        height: '280px',
                        zIndex: 2,
                        overflow: 'hidden',
                        borderRadius: 1,
                        backgroundColor: '#000',
                        boxShadow: '0 12px 20px rgba(0,0,0,0.35)'
                    }}>
                        <img
                            src={overlayImage || sample}
                            alt="Player"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    </Box>

                    <Box sx={{ position: 'absolute', top: '85px', left: '250px', color: 'white', textShadow: '3px 3px 6px rgba(0,0,0,0.8)', display: 'flex', zIndex: 3 }}>
                        <div style={{ fontFamily: 'Kanit, sans-serif', fontSize: '7rem', fontWeight: 'bold', lineHeight: 1, marginLeft: '10px' }}>{scoreText}</div>
                        <div style={{ fontSize: '3.5rem', textTransform: 'uppercase', marginLeft: '10px', fontFamily: 'Archivo Black, sans-serif', fontWeight: '600', paddingTop: '1.25rem' }}>{activityType}</div>
                    </Box>

                    <Box sx={{ position: 'absolute', top: '175px', left: '250px', color: 'white', textShadow: '3px 3px 6px rgba(0,0,0,0.8)', zIndex: 3 }}>
                        <div style={{ fontSize: '1.25rem', textTransform: 'uppercase', marginLeft: '10px', fontFamily: 'Archivo Black, sans-serif', fontWeight: '500', paddingTop: '1.25rem' }}>{stats}</div>
                        <div style={{ fontSize: dynamicNameSize, textTransform: 'uppercase', marginLeft: '10px', fontFamily: 'Archivo Black, sans-serif', fontWeight: '400', paddingTop: '0.5rem' }}>{name || "Player Name"}</div>
                    </Box>

                    <Box sx={{ position: 'absolute', top: '280px', left: '180px', color: 'white', textShadow: '3px 3px 6px rgba(0,0,0,0.8)', zIndex: 3, width: '500px', textAlign: 'right', fontFamily: 'Archivo Black, sans-serif' }}>
                        <div style={{ fontSize: '1.15em', textTransform: 'uppercase' }}>{team1}</div>
                        <div style={{ fontSize: '0.8em' }}>vs</div>
                        <div style={{ fontSize: '1.15em', textTransform: 'uppercase' }}>{team2}</div>
                    </Box>

                    <Box sx={{
                        position: 'absolute',
                        top: '400px',
                        left: '20px',
                        width: '675px',
                        height: '140px',
                        zIndex: 2,
                        overflow: 'hidden',
                        borderRadius: 1,
                        backgroundColor: '#000',
                    }}>
                        <img
                            src={overlayImageAd || sampleAd}
                            alt="Ad banner"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    </Box>
                </Box>
            </Box>
        </Stack>
    );
}

export default PlayerSoponser;