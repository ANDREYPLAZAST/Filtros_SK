import React from 'react';
import { AppBar, Toolbar, IconButton, Typography } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

interface HeaderProps {
  darkMode: boolean;
  onThemeChange: () => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, onThemeChange }) => {
  return (
    <AppBar position="static" className="header-container">
      <Toolbar>
        <Typography variant="h1" className="header-title" sx={{ flexGrow: 1 }}>
          FILTROS SALLEN-KEY
        </Typography>
        <IconButton 
          onClick={onThemeChange} 
          color="inherit"
          sx={{ color: darkMode ? 'var(--primary-dark)' : 'var(--primary-light)' }}
        >
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}; 