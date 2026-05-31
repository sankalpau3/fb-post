import React, { useState, useRef, useEffect } from 'react';
import { Button, Box, TextField, Stack, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import template from '../../CDN/static_content/imgages/template.png';
import sample from '../../CDN/static_content/imgages/sample_headshot.jpg';
import sampleAd from '../../CDN/static_content/imgages/sample_ad.jpg';
import html2canvas from 'html2canvas';
import packageInfo from '../../../package.json';
import AutoCompleteTextBox from "../../component/dropdown"
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import calcFontSize from "../../utils/calculateFontSize"

const PlayerSoponser = () => {
    const [overlayImage, setOverlayImage] = useState(null);
    const [name, setName] = useState("");
    const [overlayImageAd, setOverlayImageAd] = useState(null);
    const [players, setPlayers] = useState([]);
    const graphicRef = useRef(null);

    useEffect(() => {
        const fetchPlayers = async () => {
            const querySnapshot = await getDocs(collection(db, 'players'));
            const data = querySnapshot.docs.map(doc => doc.data());
            setPlayers(data);
        };
        fetchPlayers();
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) setOverlayImage(URL.createObjectURL(file));
    };

    const handleFileChangeAd = (event) => {
        const file = event.target.files[0];
        if (file) setOverlayImageAd(URL.createObjectURL(file));
    };

    const nameParts = name.trim().split(' ').filter(Boolean);
    const displayName = nameParts.length > 1
        ? `${nameParts.slice(0, -1).join(' ')}\n${nameParts.slice(-1)}`
        : name || 'PLAYER NAME';

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
            link.download = `${name.replace(/\s+/g, '_') || 'player'}_stats.png`;
            link.click();
        }
    };

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
                <Box sx={{ mb: 1 }}>
                    <AutoCompleteTextBox label="Player" options={players} value={name} onChange={(val) => setName(val)} />
                </Box>

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
                overflowX: 'auto',
                p: { xs: 1, md: 0 },
                backgroundColor: '#f5f5f5',
                display: 'flex',
                justifyContent: 'center'
            }}>
                <Box
                    id="graphic-container"
                    ref={graphicRef}
                    sx={{
                        position: 'relative',
                        width: '940px',
                        height: '788px',
                        backgroundColor: '#000',
                        boxShadow: 10,
                        flexShrink: 0
                    }}
                >
                    <img src={template} alt="Base" style={{ width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                    <Box id="main-context" sx={{ position: 'absolute', top: '160px', left: '20px', display: 'flex', gap: '24px', zIndex: 2 }}>
                        <Box sx={{
                            width: '380px',
                            height: '530px',
                            overflow: 'hidden',
                            boxShadow: '0 18px 40px rgba(0,0,0,0.5)',
                            backgroundImage: `url(${overlayImage || sample})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }} />

                        <Box sx={{
                            width: '460px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            color: 'white',
                            pt: '16px'
                        }}>
                            <Box>
                                <Typography sx={{
                                    fontSize: { xs: '36px', md: '80px' },
                                    fontWeight: 900,
                                    lineHeight: 1,
                                    letterSpacing: '-1px',
                                    textTransform: 'uppercase',
                                    textShadow: '4px 4px 12px rgba(0,0,0,0.8)',
                                    whiteSpace: 'pre-line',
                                    textAlign: 'left',
                                    fontFamily: 'Archivo Black, sans-serif',
                                }}>
                                    {displayName}
                                </Typography>
                                <Typography sx={{
                                    fontSize: { xs: '14px', md: '24px' },
                                    fontWeight: 900,
                                    mt: 2,
                                    letterSpacing: '1px',
                                    textShadow: '3px 3px 10px rgba(0,0,0,0.75)',
                                    paddingTop: '100px',
                                    textAlign: 'left',
                                    fontFamily: 'Archivo Black, sans-serif',
                                }}>
                                    PLAYER SPONSOR FOR 2026
                                </Typography>
                            </Box>

                            <Box sx={{
                                width: '420px',
                                height: '180px',
                                overflow: 'hidden',
                                backgroundImage: `url(${overlayImageAd || sampleAd})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                boxShadow: '0 12px 30px rgba(0,0,0,0.45)'
                            }} />
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Stack>
    );
}

export default PlayerSoponser;