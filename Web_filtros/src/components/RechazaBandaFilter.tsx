import React, { useState } from 'react';
import { Grid, Typography, Box, TextField, Button, MenuItem, Select, FormControlLabel, Switch } from '@mui/material';
import '../styles/Filter.css';

export const RechazaBandaFilter = () => {
  const [inputs, setInputs] = useState({
    fo: '',
    BW: '',
    A: '',
    C: '',
    R: '',
    Ra: '',
    Rf: '',
    f1: '',
    f2: ''
  });

  const [units, setUnits] = useState({
    fo: 'kHz',
    BW: 'kHz',
    C: 'nF',
    R: 'kΩ',
    Ra: 'Ω',
    Rf: 'Ω',
    f1: 'kHz',
    f2: 'kHz'
  });

  const [calculationMode, setCalculationMode] = useState('BW');
  const [capacitorMode, setCapacitorMode] = useState('C');
  const [resistanceMode, setResistanceMode] = useState('Ra');
  const [showResults, setShowResults] = useState(false);

  const [results, setResults] = useState<{
    wo: string;
    Q: string;
    BW: string;
    fo: string;
    f1: string;
    f2: string;
    R: string;
    C: string;
    Rf: string;
    Ra: string;
  } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Validar que A < 2 para el rechaza banda
    if (e.target.name === 'A') {
      const value = parseFloat(e.target.value);
      if (value >= 2) {
        alert('La ganancia (A) debe ser menor que 2 para el filtro rechaza banda');
        return;
      }
    }
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
    try {
      let fo, BW;
      
      if (calculationMode === 'BW') {
        fo = parseFloat(inputs.fo) * (units.fo === 'kHz' ? 1000 : units.fo === 'MHz' ? 1000000 : 1);
        BW = parseFloat(inputs.BW) * (units.BW === 'kHz' ? 1000 : units.BW === 'MHz' ? 1000000 : 1);
      } else {
        const f1 = parseFloat(inputs.f1) * (units.f1 === 'kHz' ? 1000 : units.f1 === 'MHz' ? 1000000 : 1);
        const f2 = parseFloat(inputs.f2) * (units.f2 === 'kHz' ? 1000 : units.f2 === 'MHz' ? 1000000 : 1);
        fo = Math.sqrt(f1 * f2);
        BW = f2 - f1;
      }

      const wo = 2 * Math.PI * fo;
      const Q = fo / BW;

      // Ganancia en dB a lineal
      const A_db = parseFloat(inputs.A);
      const A = Math.pow(10, A_db/20);

      if (A >= 2) {
        throw new Error('La ganancia debe ser menor que 2');
      }

      // Cálculos de C y R
      let C, R;
      if (capacitorMode === 'C') {
        C = parseFloat(inputs.C) * (units.C === 'µF' ? 1e-6 : units.C === 'nF' ? 1e-9 : 1e-12);
        R = 1 / (wo * C);
      } else {
        R = parseFloat(inputs.R) * (units.R === 'kΩ' ? 1000 : 1);
        C = 1 / (wo * R);
      }

      // Cálculos de Ra y Rf
      let Ra, Rf;
      if (resistanceMode === 'Ra') {
        Ra = parseFloat(inputs.Ra) * (units.Ra === 'kΩ' ? 1000 : 1);
        Rf = Ra * (2 - A);  // Fórmula específica para rechaza banda
      } else {
        Rf = parseFloat(inputs.Rf) * (units.Rf === 'kΩ' ? 1000 : 1);
        Ra = Rf / (2 - A);  // Fórmula específica para rechaza banda
      }

      // Calcular frecuencias de corte
      const wc1 = wo * (Math.sqrt(1 + 1/(4*Q*Q)) - 1/(2*Q));
      const wc2 = wo * (Math.sqrt(1 + 1/(4*Q*Q)) + 1/(2*Q));
      const f1 = wc1 / (2 * Math.PI);
      const f2 = wc2 / (2 * Math.PI);

      return {
        wo: (wo/(2*Math.PI)).toFixed(2) + ' Hz',
        Q: Q.toFixed(3),
        BW: (BW/1000).toFixed(2) + ' kHz',
        fo: (fo/1000).toFixed(2) + ' kHz',
        f1: (f1/1000).toFixed(2) + ' kHz',
        f2: (f2/1000).toFixed(2) + ' kHz',
        R: (R/1000).toFixed(2) + ' kΩ',
        C: C < 1e-9 ? 
           (C*1e12).toFixed(2) + ' pF' : 
           C < 1e-6 ? 
           (C*1e9).toFixed(2) + ' nF' : 
           (C*1e6).toFixed(2) + ' µF',
        Rf: (Rf/1000).toFixed(2) + ' kΩ',
        Ra: (Ra/1000).toFixed(2) + ' kΩ'
      };
    } catch (error) {
      console.error('Error en los cálculos:', error);
      throw error;
    }
  };

  const handleCalculate = () => {
    try {
      const calculatedResults = calculateValues();
      setResults(calculatedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error al calcular:', error);
      alert(error instanceof Error ? error.message : 'Error en los cálculos');
    }
  };

  return (
    <div className="filter-container">
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
              <p>Frecuencia donde la atenuación es máxima. Es el punto medio de la banda rechazada.</p>
              
              <h4>Ancho de banda (BW):</h4>
              <p>Diferencia entre frecuencias de corte. Define el rango de frecuencias que serán atenuadas (f2 - f1).</p>
              
              <h4>Ganancia (A):</h4>
              <p>Amplificación en las bandas pasantes, expresada en decibelios (dB). Debe ser menor que 2 (6 dB) para este filtro.</p>
              
              <h4>Capacitor (C):</h4>
              <p>Valor del capacitor de referencia. Se usa el doble de este valor (2C) en la rama superior del circuito.</p>

              <h4>Resistencia Ra:</h4>
              <p>Resistencia de entrada del circuito. Se usa R/2 en la rama inferior del circuito.</p>

              <div className="design-notes">
                <h4>Notas de diseño:</h4>
                <ul>
                  <li>La ganancia A debe ser menor que 2</li>
                  <li>El factor Q = fo/BW determina la selectividad</li>
                  <li>La frecuencia central wo = √(wc1×wc2)</li>
                  <li>El ancho de banda BW = wo/Q</li>
                </ul>
              </div>
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
            
            {/* Switch para cambiar modo de cálculo */}
            <div className="calculation-mode-switch">
              <FormControlLabel
                control={
                  <Switch
                    checked={calculationMode === 'FC'}
                    onChange={(e) => setCalculationMode(e.target.checked ? 'FC' : 'BW')}
                    color="primary"
                  />
                }
                label={calculationMode === 'FC' ? "Usando frecuencias de corte" : "Usando ancho de banda"}
              />
            </div>

            {/* Frecuencia central solo visible en modo BW */}
            {calculationMode === 'BW' ? (
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
            ) : null}

            {calculationMode === 'BW' ? (
              // Modo Ancho de Banda
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
            ) : (
              // Modo Frecuencias de Corte
              <>
                <div className="input-field-container">
                  <TextField
                    className="cyber-input"
                    label="Frecuencia de corte 1 (f₁)"
                    name="f1"
                    value={inputs.f1}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ step: "any" }}
                    fullWidth
                  />
                  <Select
                    value={units.f1}
                    onChange={(e) => handleUnitChange('f1', e.target.value)}
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
                    label="Frecuencia de corte 2 (f₂)"
                    name="f2"
                    value={inputs.f2}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ step: "any" }}
                    fullWidth
                  />
                  <Select
                    value={units.f2}
                    onChange={(e) => handleUnitChange('f2', e.target.value)}
                    className="unit-select"
                  >
                    <MenuItem value="Hz">Hz</MenuItem>
                    <MenuItem value="kHz">kHz</MenuItem>
                    <MenuItem value="MHz">MHz</MenuItem>
                  </Select>
                </div>
              </>
            )}

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

            {/* Switch para Capacitor/Resistencia */}
            <div className="calculation-mode-switch">
              <FormControlLabel
                control={
                  <Switch
                    checked={capacitorMode === 'R'}
                    onChange={(e) => setCapacitorMode(e.target.checked ? 'R' : 'C')}
                    color="primary"
                  />
                }
                label={capacitorMode === 'R' ? "Usando Resistencia R" : "Usando Capacitor C"}
              />
            </div>

            {capacitorMode === 'C' ? (
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
            ) : (
              <div className="input-field-container">
                <TextField
                  className="cyber-input"
                  label="Resistencia R"
                  name="R"
                  value={inputs.R}
                  onChange={handleInputChange}
                  type="number"
                  inputProps={{ step: "any" }}
                  fullWidth
                />
                <Select
                  value={units.R}
                  onChange={(e) => handleUnitChange('R', e.target.value)}
                  className="unit-select"
                >
                  <MenuItem value="Ω">Ω</MenuItem>
                  <MenuItem value="kΩ">kΩ</MenuItem>
                </Select>
              </div>
            )}

            {/* Switch para Ra/Rf */}
            <div className="calculation-mode-switch">
              <FormControlLabel
                control={
                  <Switch
                    checked={resistanceMode === 'Rf'}
                    onChange={(e) => setResistanceMode(e.target.checked ? 'Rf' : 'Ra')}
                    color="primary"
                  />
                }
                label={resistanceMode === 'Rf' ? "Usando Resistencia Rf" : "Usando Resistencia Ra"}
              />
            </div>

            {resistanceMode === 'Ra' ? (
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
            ) : (
              <div className="input-field-container">
                <TextField
                  className="cyber-input"
                  label="Resistencia Rf"
                  name="Rf"
                  value={inputs.Rf}
                  onChange={handleInputChange}
                  type="number"
                  inputProps={{ step: "any" }}
                  fullWidth
                />
                <Select
                  value={units.Rf}
                  onChange={(e) => handleUnitChange('Rf', e.target.value)}
                  className="unit-select"
                >
                  <MenuItem value="Ω">Ω</MenuItem>
                  <MenuItem value="kΩ">kΩ</MenuItem>
                </Select>
              </div>
            )}

            <Button 
              variant="contained" 
              className="calculate-button"
              onClick={handleCalculate}
            >
              CALCULAR
            </Button>
          </Box>
        </Grid>

        {/* Contenedor de resultados */}
        {showResults && results && (
          <div className="results-container">
            <Typography variant="h5" className="section-title">
              Resultados del Filtro
            </Typography>

            {/* Imagen del circuito */}
            <div className="circuit-image">
              <img 
                src="src/assets/RECHAZABANDA.png" 
                alt="Circuito Rechaza Banda"
              />
            </div>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Box className="result-box">
                  <Typography variant="h6" sx={{ mb: 2, color: 'var(--primary-dark)' }}>
                    Valores calculados:
                  </Typography>
                  {calculationMode === 'FC' && (
                    <>
                      <div className="result-item">
                        <span>Frecuencia central (fo):</span>
                        <span>{results.fo}</span>
                      </div>
                      <div className="result-item">
                        <span>Ancho de banda (BW):</span>
                        <span>{results.BW}</span>
                      </div>
                    </>
                  )}
                  <div className="result-item">
                    <span>Factor Q:</span>
                    <span>{results.Q}</span>
                  </div>
                  <div className="result-item">
                    <span>{capacitorMode === 'C' ? 'Resistencia R:' : 'Capacitor C:'}</span>
                    <span>{capacitorMode === 'C' ? results.R : results.C}</span>
                  </div>
                  <div className="result-item">
                    <span>Resistencia {resistanceMode === 'Ra' ? 'Rf' : 'Ra'}:</span>
                    <span>{resistanceMode === 'Ra' ? results.Rf : results.Ra}</span>
                  </div>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box className="result-box">
                  <Typography variant="h6" sx={{ mb: 2, color: 'var(--primary-dark)' }}>
                    Frecuencias de corte:
                  </Typography>
                  <div className="result-item">
                    <span>f₁:</span>
                    <span>{results.f1}</span>
                  </div>
                  <div className="result-item">
                    <span>f₂:</span>
                    <span>{results.f2}</span>
                  </div>
                </Box>
              </Grid>
            </Grid>
          </div>
        )}
      </Grid>
    </div>
  );
}; 