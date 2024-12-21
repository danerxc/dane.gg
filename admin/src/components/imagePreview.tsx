import { Paper, Typography, CircularProgress } from '@mui/material';
import { useState } from 'react';

interface ImagePreviewProps {
  src?: string;
  alt?: string;
  height?: number;
}

export const ImagePreview = ({ src, alt, height = 200 }: ImagePreviewProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <Paper 
      sx={{ 
        width: '100%', 
        height, 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {src ? (
        <>
          {loading && (
            <CircularProgress 
              sx={{ position: 'absolute' }} 
            />
          )}
          <img
            src={src}
            alt={alt ?? 'Preview'}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              display: loading ? 'none' : 'block'
            }}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
          {error && (
            <Typography color="error">
              Failed to load image
            </Typography>
          )}
        </>
      ) : (
        <Typography color="textSecondary">
          No image selected
        </Typography>
      )}
    </Paper>
  );
};