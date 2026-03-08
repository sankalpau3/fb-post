import React, { useState, useRef } from 'react';
import { Button, Box, TextField, Stack, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import template from './CDN/static_content/imgages/template.png';
import sample from './CDN/static_content/imgages/sample_headshot.jpg';
import sampleAd from './CDN/static_content/imgages/sample_ad.jpg';
import html2canvas from 'html2canvas';
import packageInfo from '../package.json';
import AutoCompleteTextBox from "./component/dropdown"
import players from "./json/players.json"
import calcFontSize from "./utils/calculateFontSize"

const ImageOverlays = () => {
    const [overlayImage, setOverlayImage] = useState(null);
    const [scoreText, setScoreText] = useState("99"); // Default value for preview
    const [activityType, setActivityType] = useState("Runs");
    const [stats, setStats] = useState("99(40) | 4x10 | 6X5 | SR: 247.5");
    const [name, setName] = useState("");
    const [team1, setTeam1] = useState("Ratby Town CC 2nd XI");
    const [team2, setTeam2] = useState("ABC CC 1st XI");
    const [overlayImageAd, setOverlayImageAd] = useState(null);
    const graphicRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setOverlayImage(URL.createObjectURL(file));
        }
    };

    const handleFileChangeAd = (event) => {
        const file = event.target.files[0];
        if (file) {
            setOverlayImageAd(URL.createObjectURL(file));
        }
    };

    const downloadFrameAsJpg = async (event) => {
        // I want to download the content of the #graphic-container as a JPG image when this function is called

        if (graphicRef.current) {
            // 4. Capture the element
            const canvas = await html2canvas(graphicRef.current, {
                useCORS: true,      // Essential for loading external images
                allowTaint: false,
                scale: 2,           // Higher quality/resolution
            });

            // 5. Convert to JPG and download
            const image = canvas.toDataURL("image/jpeg", 0.9);
            const link = document.createElement('a');
            link.href = image;
            link.download = `${name.replace(/\s+/g, '_')}_stats.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    const dynamicNameSize = calcFontSize(name);
    return (
        <Stack direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ p: { xs: 1, md: 2 }, alignItems: { xs: 'center', md: 'flex-start' } }}>
            <Box sx={{ width: '600px', p: 2, border: '1px solid #ccc', borderRadius: 2 }} spacing={2} id="controls">
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

                <Stack direction="row" spacing={2}>
                    <TextField
                        fullWidth
                        label="Performance (Score)"
                        variant="outlined"
                        onChange={(e) => setScoreText(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label="Type (Runs/Wickets)"
                        variant="outlined"
                        onChange={(e) => setActivityType(e.target.value)}
                    />
                </Stack>
                <TextField
                    fullWidth
                    label="Stats"
                    variant="outlined"
                    onChange={(e) => setStats(e.target.value)}
                    style={{ paddingTop: "0.5rem"  }}
                />
                <div style={{ paddingTop: "0.5rem" }}>
                    <AutoCompleteTextBox   label="Player"  options={players} value={name} onChange={(val) => setName(val)} />
                </div>

                <Stack direction="row" spacing={2} style={{ paddingTop: "0.5rem"  }}>
                    <TextField
                        fullWidth
                        label="Team 1"
                        variant="outlined"
                        onChange={(e) => setTeam1(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        label="Team 2"
                        variant="outlined"
                        onChange={(e) => setTeam2(e.target.value)}
                    />
                </Stack>
                <Button
                    style={{ margin: "0.25rem" }}
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
                    sx={{
                        m: "0.25rem",
                        backgroundColor: '#2e7d32', // Optional: Green for "Success/Download"
                        '&:hover': { backgroundColor: '#1b5e20' }
                    }}
                >
                    Download Graphic
                </Button>
                <Box sx={{ mt: 2, textAlign: 'center', opacity: 0.5 }}>
                    <Typography variant="caption">
                        v{packageInfo.version}
                    </Typography>
                </Box>
            </Box>

            <Box
                id="graphic-container"
                ref={graphicRef}
                sx={{
                    position: 'relative',
                    width: '720px',  // FIXED WIDTH
                    height: '600px', // FIXED HEIGHT
                    overflow: 'hidden',
                    backgroundColor: '#000',
                    boxShadow: 10
                }}
            >
                <img
                    src={template}
                    alt="Base"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }}
                />

                <Box
                    sx={{
                        position: 'absolute',
                        top: '100px',
                        left: '20px',
                        width: '210px',
                        height: '280px',
                        zIndex: 2,
                        backgroundImage: `url(${overlayImage || sample})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        border: '1px solid rgba(255,255,255,0.2)' // Optional clean edge
                    }}
                />
                <Box sx={{
                    position: 'absolute',
                    top: '85px',
                    left: '250px',
                    color: 'white',
                    textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    zIndex: 3
                }}>
                    <div style={{
                        fontFamily: 'Kanit, sans-serif',
                        fontSize: '7rem',
                        fontWeight: 'bold',
                        lineHeight: 1,
                        marginLeft: '10px',
                    }}>
                        {scoreText}
                    </div>
                    <div style={{
                        fontSize: '3.5rem',
                        textTransform: 'uppercase',
                        marginLeft: '10px',
                        fontFamily: 'Archivo Black, sans-serif',
                        fontWeight: '600',
                        paddingTop: '1.25rem',
                        paddingLeft: '0.25rem'
                    }}>
                        {activityType}
                    </div>
                </Box>
                <Box sx={{
                    position: 'absolute',
                    top: '175px',
                    left: '250px',
                    color: 'white',
                    textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)',
                    display: 'block',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    zIndex: 3,
                    paddingLeft: '0.25rem',

                }}>
                    <div style={{
                        fontSize: '1.25rem',
                        textTransform: 'uppercase',
                        marginLeft: '10px',
                        fontFamily: 'Archivo Black, sans-serif',
                        fontWeight: '500',
                        paddingTop: '1.25rem',
                        paddingLeft: '0.25rem',
                        textAlign: 'left'
                    }}>
                        {stats}
                    </div>
                    <div style={{
                       fontSize: dynamicNameSize,
                        textTransform: 'uppercase',
                        marginLeft: '10px',
                        fontFamily: 'Archivo Black, sans-serif',
                        fontWeight: '400',
                        paddingTop: '0.5rem',
                        textAlign: 'left'
                    }}>
                        {name || "Player Name"}
                    </div>
                </Box>

                <Box sx={{
                    position: 'absolute',
                    top: '280px',
                    left: '180px',
                    color: 'white',
                    textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)',
                    display: 'block',
                    alignItems: 'flex-end',
                    justifyContent: 'flex-end',
                    zIndex: 3,
                    paddingLeft: '0.25rem',
                    fontSize: '1.15em',
                    textTransform: 'uppercase',
                    marginLeft: '10px',
                    fontFamily: 'Archivo Black, sans-serif',
                    fontWeight: '500',
                    paddingTop: '1.25rem',
                    textAlign: 'right',
                    width: '500px'

                }}>
                    <div style={{ width: '100%', textAlign: 'right' }}>
                        {team1}
                    </div>
                    <div style={{ fontFamily: 'Archivo, sans-serif' }}>vs</div>
                    <div style={{ width: '100%', textAlign: 'right' }}>
                        {team2}
                    </div>
                </Box>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '400px',
                        left: '20px',
                        width: '675px',
                        height: '140px',
                        zIndex: 2,
                        // The Fix: Use backgroundImage
                        backgroundImage: `url(${overlayImageAd || sampleAd})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat'
                    }}
                />
            </Box>

        </Stack>
    );
}

export default ImageOverlays;