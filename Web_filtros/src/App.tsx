import { useState } from 'react';
import { Box, Container, Tab, Tabs } from '@mui/material';
import { Header } from './components/Header';
import { PasaBandaFilter } from './components/PasaBandaFilter';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [currentFilter, setCurrentFilter] = useState(0);

  const handleThemeChange = () => {
    setDarkMode(!darkMode);
  };

  const handleFilterChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentFilter(newValue);
  };

  return (
    <div className={`main-container ${darkMode ? 'dark' : 'light'}`}>
      <Header darkMode={darkMode} onThemeChange={handleThemeChange} />
      
      <div className="app-container">
        <Box className="tabs-container">
          <Tabs 
            value={currentFilter} 
            onChange={handleFilterChange}
            centered
            className="cyber-tabs"
          >
            <Tab label="PASA BANDA" />
            <Tab label="PASA BAJOS" />
            <Tab label="PASA ALTOS" />
            <Tab label="RECHAZA BANDA" />
          </Tabs>
        </Box>

        <Box className="filter-container">
          {currentFilter === 0 && <PasaBandaFilter />}
        </Box>
      </div>
    </div>
  );
}

export default App;