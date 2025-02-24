import React, { useState } from 'react';
import { Grid, Typography, Box, TextField, Button, MenuItem, Select, FormControlLabel, Switch } from '@mui/material';
import '../styles/Filter.css';

export const PasaBandaFilter = () => {
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

  const [results, setResults] = useState<{
    n: string;
    Q: string;
    R: string;
    C: string;
    Rf: string;
    Ra: string;
    fo: string;
    BW: string;
    f1: string;
    f2: string;
    nR: string;
  } | null>(null);

  const [showResults, setShowResults] = useState(false);

  const [calculationMode, setCalculationMode] = useState('BW'); // 'BW' o 'FC'
  const [capacitorMode, setCapacitorMode] = useState('C');  // 'C' o 'R'
  const [resistanceMode, setResistanceMode] = useState('Ra'); // 'Ra' o 'Rf'

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
    try {
      let fo, BW;
      
      if (calculationMode === 'BW') {
        fo = parseFloat(inputs.fo) * (units.fo === 'kHz' ? 1000 : units.fo === 'MHz' ? 1000000 : 1);
        BW = parseFloat(inputs.BW) * (units.BW === 'kHz' ? 1000 : units.BW === 'MHz' ? 1000000 : 1);
        console.log('Modo BW - Valores iniciales:', { fo, BW });
      } else {
        const f1 = parseFloat(inputs.f1) * (units.f1 === 'kHz' ? 1000 : units.f1 === 'MHz' ? 1000000 : 1);
        const f2 = parseFloat(inputs.f2) * (units.f2 === 'kHz' ? 1000 : units.f2 === 'MHz' ? 1000000 : 1);
        fo = Math.sqrt(f1 * f2);
        BW = Math.abs(f2 - f1);
        console.log('Modo FC - Valores calculados:', { f1, f2, fo, BW });
      }

      const A_db = parseFloat(inputs.A);
      const wo = 2 * Math.PI * fo;
      const Q = fo / BW;
      console.log('Parámetros básicos:', { A_db, wo, Q });

      // Cálculo de n
      const A = Math.pow(10, A_db/20);
      const A_plus_1_squared = Math.pow(A + 1, 2);
      const term_with_Q = A_plus_1_squared / (2 * Q * Q);
      console.log('Cálculo de n - Paso 1:', { A, A_plus_1_squared, term_with_Q });

      const a = 1;
      const b = 2 - term_with_Q;
      const c = 1;
      console.log('Ecuación cuadrática:', { a, b, c });

      const discriminant = b * b - 4 * a * c;
      const n1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const n2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      const n = Math.max(n1, n2);
      console.log('Soluciones de n:', { discriminant, n1, n2, n_seleccionado: n });

      // Cálculos de C y R
      let C, R;
      if (capacitorMode === 'C') {
        C = parseFloat(inputs.C) * (units.C === 'µF' ? 1e-6 : units.C === 'nF' ? 1e-9 : 1e-12);
        R = Math.sqrt(2/n) / (wo * C);
        console.log('Modo C - Cálculos:', { C_input: C, R_calculado: R });
      } else {
        R = parseFloat(inputs.R) * (units.R === 'kΩ' ? 1000 : 1);
        C = Math.sqrt(2/n) / (wo * R);
        console.log('Modo R - Cálculos:', { R_input: R, C_calculado: C });
      }

      // Cálculos de Ra y Rf
      let Ra, Rf;
      if (resistanceMode === 'Ra') {
        Ra = parseFloat(inputs.Ra) * (units.Ra === 'kΩ' ? 1000 : 1);
        Rf = Ra + (2 * n + 1)-((Math.sqrt(2 * n)/Q));
        console.log('Modo Ra - Cálculos:', { Ra_input: Ra, Rf_calculado: Rf });
      } else {
        Rf = parseFloat(inputs.Rf) * (units.Rf === 'kΩ' ? 1000 : 1);
        Ra = Rf /((2 * n + 1) -((Math.sqrt(2 * n)/Q)));
        console.log('Modo Rf - Cálculos:', { Rf_input: Rf, Ra_calculado: Ra });
      }

      const f1 = fo * (Math.sqrt(1 + 1/(4*Q*Q)) - 1/(2*Q));
      const f2 = fo * (Math.sqrt(1 + 1/(4*Q*Q)) + 1/(2*Q));
      console.log('Frecuencias de corte calculadas:', { f1, f2 });

      const results = {
        n: n.toFixed(3),
        Q: Q.toFixed(3),
        R: (R/1000).toFixed(2) + ' kΩ',
        C: C < 1e-9 ? 
           (C*1e12).toFixed(2) + ' pF' : 
           C < 1e-6 ? 
           (C*1e9).toFixed(2) + ' nF' : 
           (C*1e6).toFixed(2) + ' µF',
        Rf: (Rf/1000).toFixed(2) + ' kΩ',
        Ra: (Ra/1000).toFixed(2) + ' kΩ',
        fo: (fo/1000).toFixed(2) + ' kHz',
        BW: (BW/1000).toFixed(2) + ' kHz',
        f1: (f1/1000).toFixed(2) + ' kHz',
        f2: (f2/1000).toFixed(2) + ' kHz',
        nR: ((n * R)/1000).toFixed(2) + ' kΩ'
      };
      console.log('Resultados finales:', results);
      return results;
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
              <p>Frecuencia donde la ganancia es máxima. Es el punto medio del ancho de banda y determina la frecuencia de operación principal del filtro.</p>
              
              <h4>Ancho de banda (BW):</h4>
              <p>Diferencia entre frecuencias de corte superior e inferior. Define el rango de frecuencias donde el filtro opera efectivamente (f2 - f1). A menor BW, más selectivo es el filtro.</p>
              
              <h4>Ganancia (A):</h4>
              <p>Amplificación máxima en la frecuencia central, expresada en decibelios (dB). Determina cuánto se amplifica la señal en la banda de paso. Un valor típico es entre 1 y 100 dB.</p>
              
              <h4>Capacitor (C):</h4>
              <p>Valor del capacitor de referencia para el diseño. Se recomienda usar valores comerciales entre 100pF y 100nF para frecuencias altas, y entre 100nF y 10µF para frecuencias bajas.</p>

              <h4>Resistencia Ra:</h4>
              <p>Resistencia de entrada del circuito. Afecta la impedancia de entrada y la ganancia total. Se recomienda usar valores entre 1kΩ y 100kΩ.</p>

              <div className="design-notes">
                <h4>Notas de diseño:</h4>
                <ul>
                  <li>El factor de calidad Q = f₀/BW determina la selectividad del filtro</li>
                  <li>Las frecuencias de corte f₁ y f₂ se definen a -3dB de la ganancia máxima</li>
                  <li>Para un mejor diseño, se recomienda que BW sea menor que f₀</li>
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
                  <span>Factor n:</span>
                  <span>{results.n}</span>
                </div>
                <div className="result-item">
                  <span>Resistencia nR:</span>
                  <span>{results.nR}</span>
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
    </div>
  );
}; 