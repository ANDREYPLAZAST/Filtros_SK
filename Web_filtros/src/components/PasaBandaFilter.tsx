import React, { useState } from 'react';
import { Grid, Typography, Box, TextField, Button, MenuItem, Select } from '@mui/material';
import '../styles/Filter.css';

export const PasaBandaFilter = () => {
  const [inputs, setInputs] = useState({
    fo: '',
    BW: '',
    A: '',
    C: '',
    Ra: ''
  });

  const [units, setUnits] = useState({
    fo: 'kHz',
    BW: 'kHz',
    C: 'nF',
    Ra: 'Ω'
  });

  const [results, setResults] = useState<{
    n: string;
    R: string;
    Rf: string;
    Ra: string;
    f1: string;
    f2: string;
  } | null>(null);

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

  const calculateValues = () => {
    const fo = parseFloat(inputs.fo) * (units.fo === 'kHz' ? 1000 : units.fo === 'MHz' ? 1000000 : 1);
    const BW = parseFloat(inputs.BW) * (units.BW === 'kHz' ? 1000 : units.BW === 'MHz' ? 1000000 : 1);
    const A_db = parseFloat(inputs.A); // Ganancia en dB
    const C = parseFloat(inputs.C) * (units.C === 'µF' ? 1e-6 : units.C === 'nF' ? 1e-9 : 1e-12);
    const Ra = parseFloat(inputs.Ra) * (units.Ra === 'kΩ' ? 1000 : 1);
    
    // Convertir ganancia de dB a magnitud
    const A = Math.pow(10, A_db/20);
    
    console.log('Valores de entrada:', { fo, BW, A_db, A, C, Ra });
    
    const Q = fo / BW;
    console.log('Q:', Q);
    
    // Ecuación: n² + (2 - (A+1)²/2Q)n + 1 = 0
    const A_plus_1_squared = Math.pow(A + 1, 2);
    const term_with_Q = A_plus_1_squared / (2 * Q*Q);
    
    // Coeficientes de la ecuación cuadrática an² + bn + c
    const a = 1;  // coeficiente de n²
    const b = 2 - term_with_Q;  // coeficiente de n
    const c = 1;  // término independiente
    
    console.log('Coeficientes ecuación:', { a, b, c });

    // Fórmula cuadrática: (-b ± √(b² - 4ac)) / 2a
    const discriminant = b * b - 4 * a * c;
    console.log('Discriminante:', discriminant);

    // Calcular ambas soluciones
    const n1 = (-b + Math.sqrt(discriminant)) / (2 * a);
    const n2 = (-b - Math.sqrt(discriminant)) / (2 * a);
    
    console.log('Valores de n:', { n1, n2 });

    // Seleccionar el valor de n mayor que 1
    const n = Math.max(n1, n2);
    console.log('n seleccionado:', n);

    // Resto de cálculos...
    const wo = 2 * Math.PI * fo;
    const R = Math.sqrt(2 * n) / (wo * C);
    const Rf = Ra * (2 * n + 1 - Math.sqrt(2 * n) / Q);

    const f1 = fo * (Math.sqrt(1 + 1/(4*Q*Q)) - 1/(2*Q));
    const f2 = fo * (Math.sqrt(1 + 1/(4*Q*Q)) + 1/(2*Q));

    return {
      n: n.toFixed(3),
      R: (R/1000).toFixed(2) + ' kΩ',
      Rf: (Rf/1000).toFixed(2) + ' kΩ',
      Ra: (Ra/1000).toFixed(2) + ' kΩ',
      f1: (f1/1000).toFixed(2) + ' kHz',
      f2: (f2/1000).toFixed(2) + ' kHz'
    };
  };

  const handleCalculate = () => {
    try {
      const calculatedResults = calculateValues();
      setResults(calculatedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error al calcular:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    }
  };

  return (
    <div className="filter-container">
      {/* Grid para descripción y parámetros de entrada */}
      <Grid container spacing={4}>
        {/* Columna izquierda - Descripción */}
        <Grid item xs={12} md={6}>
          <Box className="description-box">
            <Typography 
              variant="h5" 
              sx={{ 
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '2.5rem',
                textAlign: 'center',
                color: '#00ff9d',
                '&.MuiTypography-root': {
                  color: '#00ff9d !important'
                }
              }}
            >
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
            <Typography 
              variant="h5" 
              sx={{ 
                fontSize: '1.5rem',
                fontWeight: 600,
                marginBottom: '2.5rem',
                textAlign: 'center',
                color: '#00ff9d',
                '&.MuiTypography-root': {
                  color: '#00ff9d !important'
                }
              }}
            >
              Parámetros de entrada
            </Typography>
            
            <div className="input-field-container">
              <TextField
                className="cyber-input"
                label="Frecuencia central"
                name="fo"
                value={inputs.fo}
                onChange={handleInputChange}
                type="number"
                inputProps={{ step: "any" }}
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
                type="number"
                inputProps={{ step: "any" }}
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
                type="number"
                inputProps={{ step: "any" }}
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
                type="number"
                inputProps={{ step: "any" }}
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

            <div className="input-field-container">
              <TextField
                className="cyber-input"
                label="Resistencia Ra"
                name="Ra"
                value={inputs.Ra}
                onChange={handleInputChange}
                type="number"
                inputProps={{ step: "any" }}
                fullWidth
              />
              <Select
                value={units.Ra}
                onChange={(e) => handleUnitChange('Ra', e.target.value)}
                className="unit-select"
              >
                <MenuItem value="Ω">Ω</MenuItem>
                <MenuItem value="kΩ">kΩ</MenuItem>
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

      {/* Contenedor de resultados separado */}
      {showResults && results && (
        <div className="results-container">
          <Typography variant="h5" className="section-title">
            Resultados del Filtro
          </Typography>

          {/* Imagen del circuito */}
          <div className="circuit-image">
            <img 
              src="./assets/PASABANDA.png" 
              alt="Circuito Pasa Banda"
            />
          </div>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box className="result-box">
                <Typography variant="h6" sx={{ mb: 2, color: 'var(--primary-dark)' }}>
                  Valores calculados:
                </Typography>
                <div className="result-item">
                  <span>Factor n:</span>
                  <span>{results.n}</span>
                </div>
                <div className="result-item">
                  <span>Resistencia R:</span>
                  <span>{results.R}</span>
                </div>
                <div className="result-item">
                  <span>Resistencia Rf:</span>
                  <span>{results.Rf}</span>
                </div>
                <div className="result-item">
                  <span>Resistencia Ra:</span>
                  <span>{results.Ra}</span>
                </div>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box className="result-box">
                <Typography variant="h6" sx={{ mb: 2, color: 'var(--primary-dark)' }}>
                  Frecuencias de corte:
                </Typography>
                <div className="result-item">
                  <span>f1:</span>
                  <span>{results.f1}</span>
                </div>
                <div className="result-item">
                  <span>f2:</span>
                  <span>{results.f2}</span>
                </div>
              </Box>
            </Grid>
          </Grid>
        </div>
      )}
    </div>
  );
}; 