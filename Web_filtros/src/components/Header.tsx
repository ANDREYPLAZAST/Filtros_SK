import { Box, Typography } from '@mui/material';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';

interface HeaderProps {
  darkMode: boolean;
  onThemeChange: () => void;
}

export const Header = ({ darkMode, onThemeChange }: HeaderProps) => {
  return (
    <Box sx={{ 
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '1rem',
      position: 'relative'
    }}>
      <Typography variant="h3" className="title-glow">
        CALCULADORA DE FILTROS SALLEN-KEY
      </Typography>
      
      <Box 
        className="theme-switch-container"
        onClick={onThemeChange}
        sx={{ 
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer'
        }}
      >
        <WbSunnyOutlinedIcon sx={{ color: '#00ff9d', fontSize: '1.2rem' }} />
        <Typography sx={{ 
          color: 'white', 
          fontSize: '0.9rem',
          opacity: 0.9 
        }}>
          Modo {darkMode ? 'Oscuro' : 'Claro'}
        </Typography>
      </Box>
    </Box>
  );
}; 