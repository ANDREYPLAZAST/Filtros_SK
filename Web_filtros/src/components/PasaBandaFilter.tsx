import React, { useState } from 'react';
import { Grid, Typography, Box, TextField, Button, MenuItem, Select } from '@mui/material';
import '../styles/Filter.css';

export const PasaBandaFilter = () => {
  const [inputs, setInputs] = useState({
    fo: '',
    BW: '',
    A: '',
    C: ''
  });

  const [units, setUnits] = useState({
    fo: 'kHz',
    BW: 'kHz',
    C: 'nF'
  });

  const [showResults, setShowResults] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value
    });
  };

  const handleUnitChange = (param: string, newUnit: string) => {
    setUnits({
      ...units,
      [param]: newUnit
    });
  };

  const handleCalculate = () => {
    setShowResults(true);
  };

  return (
    <div className="filter-container">
      <Grid container spacing={4}>
        {/* Columna izquierda - Descripción */}
        <Grid item xs={12} md={6}>
          <Box className="description-box">
            <Typography variant="h5" className="section-title">
              Descripción de los parámetros de entrada
            </Typography>
            <div className="parameter-info">
              <h4>Frecuencia central (fo):</h4>
              <p>Frecuencia donde la ganancia es máxima</p>
              
              <h4>Ancho de banda (BW):</h4>
              <p>Diferencia entre frecuencias de corte superior e inferior</p>
              
              <h4>Ganancia (A):</h4>
              <p>Amplificación máxima en la frecuencia central</p>
              
              <h4>Capacitor (C):</h4>
              <p>Valor del capacitor de referencia para el diseño</p>
            </div>
          </Box>
        </Grid>

        {/* Columna derecha - Parámetros de entrada */}
        <Grid item xs={12} md={6}>
          <Box className="parameters-box">
            <Typography variant="h5" className="section-title">
              Parámetros de entrada
            </Typography>
            
            <div className="input-field-container">
              <TextField
                className="cyber-input"
                label="Frecuencia central"
                name="fo"
                value={inputs.fo}
                onChange={handleInputChange}
                fullWidth
              />
              <Select
                value={units.fo}
                onChange={(e) => handleUnitChange('fo', e.target.value)}
                className="unit-select"
              >
                <MenuItem value="Hz">Hz</MenuItem>
                <MenuItem value="kHz">kHz</MenuItem>
                <MenuItem value="MHz">MHz</MenuItem>
              </Select>
            </div>

            <div className="input-field-container">
              <TextField
                className="cyber-input"
                label="Ancho de banda"
                name="BW"
                value={inputs.BW}
                onChange={handleInputChange}
                fullWidth
              />
              <Select
                value={units.BW}
                onChange={(e) => handleUnitChange('BW', e.target.value)}
                className="unit-select"
              >
                <MenuItem value="Hz">Hz</MenuItem>
                <MenuItem value="kHz">kHz</MenuItem>
                <MenuItem value="MHz">MHz</MenuItem>
              </Select>
            </div>

            <div className="input-field-container">
              <TextField
                className="cyber-input"
                label="Ganancia"
                name="A"
                value={inputs.A}
                onChange={handleInputChange}
                fullWidth
              />
            </div>

            <div className="input-field-container">
              <TextField
                className="cyber-input"
                label="Capacitor"
                name="C"
                value={inputs.C}
                onChange={handleInputChange}
                fullWidth
              />
              <Select
                value={units.C}
                onChange={(e) => handleUnitChange('C', e.target.value)}
                className="unit-select"
              >
                <MenuItem value="pF">pF</MenuItem>
                <MenuItem value="nF">nF</MenuItem>
                <MenuItem value="µF">µF</MenuItem>
              </Select>
            </div>

            <Button 
              variant="contained" 
              className="calculate-button"
              onClick={handleCalculate}
            >
              CALCULAR
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Sección de resultados */}
      {showResults && (
        <Box className="results-section">
          <Typography variant="h5" className="section-title">
            Resultados
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box className="result-box">
                <Typography variant="h6">Valores calculados:</Typography>
                <div className="result-item">
                  <span>Factor n:</span>
                  <span>2.5</span>
                </div>
                <div className="result-item">
                  <span>Resistencia R:</span>
                  <span>10 kΩ</span>
                </div>
                <div className="result-item">
                  <span>Resistencia Rf:</span>
                  <span>20 kΩ</span>
                </div>
                <div className="result-item">
                  <span>Resistencia Ra:</span>
                  <span>10 kΩ</span>
                </div>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box className="result-box">
                <Typography variant="h6">Frecuencias de corte:</Typography>
                <div className="result-item">
                  <span>f1:</span>
                  <span>800 Hz</span>
                </div>
                <div className="result-item">
                  <span>f2:</span>
                  <span>1.2 kHz</span>
                </div>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </div>
  );
}; 