import React, { useState, useRef } from 'react';
import { Button, Box, TextField, Stack, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import template from '../../CDN/static_content/imgages/template.png';
import sample from '../../CDN/static_content/imgages/sample_headshot.jpg';
import sampleAd from '../../CDN/static_content/imgages/sample_ad.jpg';
import html2canvas from 'html2canvas';
import packageInfo from '../../../package.json';
import AutoCompleteTextBox from "../../component/dropdown"
import players from "../../json/players.json"
import calcFontSize from "../../utils/calculateFontSize"

const PlayerSoponser = () => {
    const [overlayImage, setOverlayImage] = useState(null);
    const [scoreText, setScoreText] = useState("99");
    const [activityType, setActivityType] = useState("Runs");
    const [stats, setStats] = useState("99(40) | 4x10 | 6X5 | SR: 247.5");
    const [name, setName] = useState("");
    const [team1, setTeam1] = useState("Ratby Town CC 2nd XI");
    const [team2, setTeam2] = useState("ABC CC 1st XI");
    const [overlayImageAd, setOverlayImageAd] = useState(null);
    const graphicRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) setOverlayImage(URL.createObjectURL(file));
    };

    const handleFileChangeAd = (event) => {
        const file = event.target.files[0];
        if (file) setOverlayImageAd(URL.createObjectURL(file));
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
            link.download = `${name.replace(/\s+/g, '_') || 'player'}_stats.jpg`;
            link.click();
        }
    };

    const dynamicNameSize = calcFontSize(name);

    return (
        <Stack 
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ 
                p: { xs: 1, md: 2 }, 
                alignItems: { xs: 'center', md: 'flex-start' },
                width: '100%',
                maxWidth: '100vw',
                overflowX: 'hidden' // Prevents the whole page from wobbling
            }}
        >
            {/* 1. CONTROLS - Width adjusts to screen on mobile */}
            <Box sx={{ 
                width: { xs: '100%', sm: '100%', md: '500px' }, 
                p: 2, 
                border: '1px solid #ccc', 
                borderRadius: 2,
                boxSizing: 'border-box'
            }} id="controls">
                <Button
                    component="label"
                    variant="contained"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                >
                    Upload Player Photo
                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>

                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <TextField fullWidth label="Score" variant="outlined" value={scoreText} onChange={(e) => setScoreText(e.target.value)} />
                    <TextField fullWidth label="Type" variant="outlined" value={activityType} onChange={(e) => setActivityType(e.target.value)} />
                </Stack>
                
                <TextField
                    fullWidth
                    label="Stats"
                    variant="outlined"
                    value={stats}
                    onChange={(e) => setStats(e.target.value)}
                    sx={{ mb: 1 }}
                />

                <Box sx={{ mb: 1 }}>
                    <AutoCompleteTextBox label="Player" options={players} value={name} onChange={(val) => setName(val)} />
                </Box>

                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                    <TextField fullWidth label="Team 1" variant="outlined" value={team1} onChange={(e) => setTeam1(e.target.value)} />
                    <TextField fullWidth label="Team 2" variant="outlined" value={team2} onChange={(e) => setTeam2(e.target.value)} />
                </Stack>

                <Button
                    component="label"
                    variant="contained"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                    sx={{ mb: 2 }}
                >
                    Upload Ad Banner
                    <input type="file" hidden accept="image/*" onChange={handleFileChangeAd} />
                </Button>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={downloadFrameAsJpg}
                    sx={{ backgroundColor: '#2e7d32', '&:hover': { backgroundColor: '#1b5e20' } }}
                >
                    Download Graphic
                </Button>
            </Box>

            {/* 2. PREVIEW WRAPPER - Horizontal Scroll for Mobile */}
            <Box sx={{ 
                width: { xs: '100%', md: 'auto' }, 
                overflowX: 'auto', // This allows the full 720px image to be "swiped" on small screens
                p: { xs: 1, md: 0 },
                backgroundColor: '#f5f5f5',
                borderRadius: 2,
                display: 'block'
            }}>
                <Box
                    id="graphic-container"
                    ref={graphicRef}
                    sx={{
                        position: 'relative',
                        width: '720px',  // STRICT FIXED SIZE
                        height: '600px', // STRICT FIXED SIZE
                        backgroundColor: '#000',
                        boxShadow: 10,
                        flexShrink: 0,   // Prevents layout from squeezing the graphic
                    }}
                >
                    <img src={template} alt="Base" style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />

                    <Box sx={{
                        position: 'absolute', top: '100px', left: '20px', width: '210px', height: '280px', zIndex: 2,
                        backgroundImage: `url(${overlayImage || sample})`, backgroundSize: 'cover', backgroundPosition: 'center'
                    }} />

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
                        position: 'absolute', top: '400px', left: '20px', width: '675px', height: '140px', zIndex: 2,
                        backgroundImage: `url(${overlayImageAd || sampleAd})`, backgroundSize: 'cover', backgroundPosition: 'center'
                    }} />
                </Box>
            </Box>
        </Stack>
    );
}

export default PlayerSoponser;