import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';

const PhotoManager = () => {
  const [photos, setPhotos] = useState([]);
  const [sponsorPhotos, setSponsorPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sponsorLoading, setSponsorLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sponsorUploading, setSponsorUploading] = useState(false);

  const PHOTOS_COLLECTION = 'actionPhotos';
  const SPONSOR_PHOTOS_COLLECTION = 'sponsorPhotos';
  const MAX_FILE_SIZE = 800000; // 800KB max per image

  // Load photos from Firestore
  useEffect(() => {
    loadPhotos();
    loadSponsorPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, PHOTOS_COLLECTION));
      const photoList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPhotos(photoList);
    } catch (error) {
      console.error('Error loading photos:', error);
      setMessage({ type: 'error', text: 'Unable to load photos. Try again.' });
    } finally {
      setLoading(false);
    }
  };

  const loadSponsorPhotos = async () => {
    try {
      setSponsorLoading(true);
      const querySnapshot = await getDocs(collection(db, SPONSOR_PHOTOS_COLLECTION));
      const photoList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSponsorPhotos(photoList);
    } catch (error) {
      console.error('Error loading sponsor photos:', error);
      setMessage({ type: 'error', text: 'Unable to load sponsor photos. Try again.' });
    } finally {
      setSponsorLoading(false);
    }
  };

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileUpload = async (event, photoType = 'action') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const isActionPhoto = photoType === 'action';
    const collectionName = isActionPhoto ? PHOTOS_COLLECTION : SPONSOR_PHOTOS_COLLECTION;
    
    if (isActionPhoto) {
      setUploading(true);
    } else {
      setSponsorUploading(true);
    }

    const uploadedFiles = [];
    const failedFiles = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          // Check file size (max 800KB to stay within Firestore limits)
          if (file.size > MAX_FILE_SIZE) {
            failedFiles.push(`${file.name}: File too large (max 800KB)`);
            continue;
          }

          // Convert to base64
          const base64Data = await convertFileToBase64(file);

          // Save to Firestore with base64 data
          await addDoc(collection(db, collectionName), {
            fileName: file.name,
            originalFileName: file.name,
            imageData: base64Data, // Store as base64
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
          });

          uploadedFiles.push(file.name);
          console.log(`Successfully uploaded: ${file.name}`);
        } catch (fileError) {
          failedFiles.push(`${file.name}: ${fileError.message}`);
          console.error(`Failed to upload ${file.name}:`, fileError);
        }
      }

      // Show results
      let messageText = '';
      if (uploadedFiles.length > 0) {
        messageText += `Successfully uploaded ${uploadedFiles.length} photo(s). `;
      }
      if (failedFiles.length > 0) {
        messageText += `Failed to upload ${failedFiles.length} photo(s).`;
      }

      setMessage({ 
        type: failedFiles.length > 0 ? 'warning' : 'success', 
        text: messageText 
      });

      // Reload the appropriate collection
      if (isActionPhoto) {
        await loadPhotos();
      } else {
        await loadSponsorPhotos();
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      setMessage({ type: 'error', text: `Error uploading photos: ${error.message}` });
    } finally {
      if (isActionPhoto) {
        setUploading(false);
      } else {
        setSponsorUploading(false);
      }
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeletePhoto = async (photoId, fileName, photoType = 'action') => {
    if (!window.confirm(`Are you sure you want to delete this photo?`)) return;

    const collectionName = photoType === 'action' ? PHOTOS_COLLECTION : SPONSOR_PHOTOS_COLLECTION;

    try {
      // Delete metadata from Firestore
      await deleteDoc(doc(db, collectionName, photoId));

      setMessage({ type: 'success', text: 'Photo removed successfully.' });
      
      // Reload the appropriate collection
      if (photoType === 'action') {
        await loadPhotos();
      } else {
        await loadSponsorPhotos();
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      setMessage({ type: 'error', text: 'Error removing photo. Try again.' });
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: '1200px', mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Photo Manager
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* ACTION PHOTOS SECTION */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Action Photos
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Add New Action Photos'}
            <input
              type="file"
              hidden="hidden"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e, 'action')}
              disabled={uploading}
            />
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : photos.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No action photos available. Upload some photos to get started.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {photos.map((photo) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={photo.imageData}
                    alt={photo.originalFileName}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardActions sx={{ justifyContent: 'flex-end', mt: 'auto' }}>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeletePhoto(photo.id, photo.fileName, 'action')}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* SPONSOR PHOTOS SECTION */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Sponsor Photos
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={sponsorUploading}
          >
            {sponsorUploading ? 'Uploading...' : 'Add New Sponsor Photos'}
            <input
              type="file"
              hidden="hidden"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload(e, 'sponsor')}
              disabled={sponsorUploading}
            />
          </Button>
        </Box>

        {sponsorLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : sponsorPhotos.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No sponsor photos available. Upload some photos to get started.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {sponsorPhotos.map((photo) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={photo.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={photo.imageData}
                    alt={photo.originalFileName}
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardActions sx={{ justifyContent: 'flex-end', mt: 'auto' }}>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDeletePhoto(photo.id, photo.fileName, 'sponsor')}
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default PhotoManager;
