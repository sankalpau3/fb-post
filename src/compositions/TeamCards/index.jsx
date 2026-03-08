import React, { useState, useRef } from 'react';
import { Button, Box, TextField, Stack, Typography, MenuItem, Radio } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import template from '../../CDN/static_content/imgages/template.png';
import html2canvas from 'html2canvas';
import AutoCompleteTextBox from "../../component/dropdown"
import players from "../../json/players.json"
import teams from "../../json/teams.json"
import oponentTeams from "../../json/oponents.json"

const PlayerSoponser = () => {
    const [overlayImage, setOverlayImage] = useState(null);
    const [team, setTeam] = useState(teams[0].value);
    const [oponent, setoPonents] = useState(oponentTeams[0].value);
    const [playerNames, setPlayerNames] = useState(Array(11).fill(""));

    // States for Captain and Wicket Keeper
    const [captainIndex, setCaptainIndex] = useState(null);
    const [wkIndex, setWkIndex] = useState(null);

    const graphicRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) setOverlayImage(URL.createObjectURL(file));
    };

    const handleNameChange = (index, value) => {
        const newNames = [...playerNames];
        newNames[index] = value;
        setPlayerNames(newNames);
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
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Match Details</Typography>

                <TextField fullWidth select label="Your Team" value={team} onChange={(e) => setTeam(e.target.value)} sx={{ mb: 2 }}>
                    {teams.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </TextField>

                <TextField fullWidth select label="Opponent" value={oponent} onChange={(e) => setoPonents(e.target.value)} sx={{ mb: 2 }}>
                    {oponentTeams.map((option) => (
                        <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                </TextField>

                <Button component="label" variant="outlined" fullWidth startIcon={<CloudUploadIcon />} sx={{ mb: 3 }}>
                    Upload Action Photo
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>

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
            </Box>

            {/* 2. PREVIEW */}
            <Box sx={{ width: { xs: '100%', md: 'auto' }, overflowX: 'auto', p: { xs: 1, md: 0 }, backgroundColor: '#e0e0e0', borderRadius: 2 }}>
                <Box
                    id="graphic-container"
                    ref={graphicRef}
                    sx={{ position: 'relative', width: '720px', height: '600px', backgroundColor: '#000', flexShrink: 0, overflow: 'hidden' }}
                >
                    <img src={template} alt="Base" style={{ width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />

                    <Box sx={{
                        position: 'absolute', top: '140px', right: '40px', width: '280px', height: '380px', zIndex: 2,
                        backgroundImage: `url(${overlayImage})`, backgroundSize: 'cover', backgroundPosition: 'center',
                    }} />

                    {/* Header Section */}
                    <Box sx={{
                        position: 'absolute',
                        top: '70px',
                        left: '15px',
                        zIndex: 3,
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
                    <Box sx={{ position: 'absolute', top: '165px', left: '40px', zIndex: 3 }}>
                        {playerNames.map((name, index) => {
                            let displayName = name || `Player ${index + 1}`;

                            // Append tags
                            if (index === captainIndex) displayName += ' (C)';
                            if (index === wkIndex) displayName = displayName += ' (WK)';

                            return (
                                <Typography key={index} sx={{
                                    fontSize: "1.05rem", // Slightly larger for single column
                                    textTransform: 'uppercase',
                                    fontFamily: 'Archivo Black, sans-serif',
                                    color: 'white',
                                    mb: '8px', // Reduced spacing to fit all 11
                                    display: 'flex',
                                    alignItems: 'center',
                                    textShadow: '1px 1px 3px rgba(0,0,0,0.8)'
                                }}>
                                    {displayName}
                                </Typography>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        </Stack>
    );
}

export default PlayerSoponser;