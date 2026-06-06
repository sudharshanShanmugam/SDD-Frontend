import React from 'react'
import { Box, Button, Container, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { HomeIcon } from 'lucide-react'

export default function NotFoundPage(): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 3,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h1"
          sx={{ fontSize: '7rem', fontWeight: 900, color: 'primary.main', lineHeight: 1 }}
        >
          404
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={360}>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<HomeIcon size={18} />}
          onClick={() => navigate('/dashboard')}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Container>
  )
}
