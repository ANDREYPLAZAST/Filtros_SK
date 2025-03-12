import React, { useState } from 'react';
import { Grid, Typography, Box, TextField, Button, MenuItem, Select, FormControlLabel, Switch } from '@mui/material';
import '../styles/Filter.css';
import circuitImageBasic from '../assets/PASABAJOS.png';
import circuitImageWithValues from '../assets/PASABAJOS2.png';
import { Line } from 'react-chartjs-2';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

const bodeOptions = {
  responsive: true,
  scales: {
    x: {
      type: 'logarithmic' as const,
      position: 'bottom' as const,
      title: {
        display: true,
        text: 'Frecuencia (Hz)'
      }
    },
    y: {
      type: 'linear' as const,
      position: 'left' as const,
      title: {
        display: true,
        text: 'Magnitud (dB)'
      }
    }
  }
};

type Results = {
  wo: string;
  n: string;
  Q: string;
  R: string;
  C: string;
  nC: string;
  Rf: string;
  Ra: string;
  bodeData: Array<{x: number, y: number}>;
}

export const PasaBajosFilter = () => {
  const [inputs, setInputs] = useState({
    fo: '',
    A: '',
    C: '',
    R: '',
    Ra: '',
    Rf: ''
  });

  const [units, setUnits] = useState({
    fo: 'kHz',
    C: 'nF',
    R: 'kΩ',
    Ra: 'Ω',
    Rf: 'Ω'
  });

  const [results, setResults] = useState<Results | null>(null);

  const [showResults, setShowResults] = useState(false);
  const [capacitorMode, setCapacitorMode] = useState('C');  // 'C' o 'R'
  const [resistanceMode, setResistanceMode] = useState('Ra'); // 'Ra' o 'Rf'

  const [resultUnits, setResultUnits] = useState({
    wo: 'Hz',
    R: 'kΩ',
    C: 'nF',
    Rf: 'kΩ',
    Ra: 'kΩ'
  });

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
      // Convertir frecuencia a Hz
      const fo = parseFloat(inputs.fo) * (units.fo === 'kHz' ? 1000 : units.fo === 'MHz' ? 1000000 : 1);
      const wo = 2 * Math.PI * fo;
      console.log('Frecuencias:', { fo, wo });

      // Ganancia en dB a lineal
      const A_db = parseFloat(inputs.A);
      const A = Math.pow(10, A_db/20);
      console.log('Ganancia:', { A_db, A });

      // Cálculo de n usando la ecuación n² + (2 - A²)n + 1 = 0
      const a = 1;
      const b = 2 - A * A;
      const c = 1;
      
      const discriminant = b * b - 4 * a * c;
      const n1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const n2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      const n = Math.max(n1, n2);
      console.log('Cálculo de n:', { a, b, c, discriminant, n1, n2, n });

      // Cálculos de C y R
      let C, R;
      if (capacitorMode === 'C') {
        C = parseFloat(inputs.C) * (units.C === 'µF' ? 1e-6 : units.C === 'nF' ? 1e-9 : 1e-12);
        R = 1 / (wo * C * Math.sqrt(n));
        console.log('Modo C:', { C_input: C, R_calculado: R });
      } else {
        R = parseFloat(inputs.R) * (units.R === 'kΩ' ? 1000 : 1);
        C = 1 / (wo * R * Math.sqrt(n));
        console.log('Modo R:', { R_input: R, C_calculado: C });
      }

      // Cálculos de Ra y Rf
      let Ra, Rf;
      if (resistanceMode === 'Ra') {
        Ra = parseFloat(inputs.Ra) * (units.Ra === 'kΩ' ? 1000 : 1);
        Rf = Ra * (2 * n + 1);
        console.log('Modo Ra:', { Ra_input: Ra, Rf_calculado: Rf });
      } else {
        Rf = parseFloat(inputs.Rf) * (units.Rf === 'kΩ' ? 1000 : 1);
        Ra = Rf / (2 * n + 1);
        console.log('Modo Rf:', { Rf_input: Rf, Ra_calculado: Ra });
      }

      // Calcular Q
      const Q = 1/(2 * Math.sqrt(n));

      // Calcular nC (siempre)
      const nC = n * C;

      // Generar datos para el diagrama de Bode
      const bodeData = generateBodeData();

      return {
        wo: (wo/(2*Math.PI)).toFixed(2) + ' Hz',
        n: n.toFixed(3),
        Q: Q.toFixed(3),
        R: (R/1000).toFixed(2) + ' kΩ',
        C: C < 1e-9 ? 
           (C*1e12).toFixed(2) + ' pF' : 
           C < 1e-6 ? 
           (C*1e9).toFixed(2) + ' nF' : 
           (C*1e6).toFixed(2) + ' µF',
        nC: nC < 1e-9 ? 
           (nC*1e12).toFixed(2) + ' pF' : 
           nC < 1e-6 ? 
           (nC*1e9).toFixed(2) + ' nF' : 
           (nC*1e6).toFixed(2) + ' µF',
        Rf: (Rf/1000).toFixed(2) + ' kΩ',
        Ra: (Ra/1000).toFixed(2) + ' kΩ',
        bodeData
      };
    } catch (error) {
      console.error('Error en los cálculos:', error);
      throw error;
    }
  };

  const generateBodeData = () => {
    const data = [];
    // Obtener los valores necesarios para el cálculo
    const wo = 2 * Math.PI * parseFloat(results?.wo || '0');
    const A = Math.pow(10, parseFloat(inputs.A)/20);
    
    for(let f = 0.1; f <= 1000; f *= 1.1) {
      const w = 2 * Math.PI * f;
      // Calcular la magnitud en dB para cada frecuencia
      const magnitude = 20 * Math.log10(A / Math.sqrt(1 + Math.pow(w/wo, 4)));
      data.push({x: f, y: magnitude});
    }
    return data;
  };

  const handleCalculate = () => {
    try {
      const calculatedResults = calculateValues();
      setResults(calculatedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error al calcular:', error);
    }
  };

  const formatValue = (value: number, type: string, unit: string) => {
    switch(type) {
      case 'frequency':
        return unit === 'Hz' ? value : value * 2 * Math.PI;
      case 'resistance':
        switch(unit) {
          case 'Ω': return value * 1000;
          case 'kΩ': return value;
          case 'MΩ': return value / 1000;
          default: return value;
        }
      case 'capacitance':
        switch(unit) {
          case 'pF': return value * 1000000;
          case 'nF': return value * 1000;
          case 'µF': return value;
          default: return value;
        }
      default:
        return value;
    }
  };

  const handleResultUnitChange = (param: string, newUnit: string) => {
    setResultUnits({
      ...resultUnits,
      [param]: newUnit
    });
  };

  return (
    <MathJaxContext>
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
                <h4>Frecuencia de corte (fo):</h4>
                <p>Frecuencia a la cual la ganancia cae 3dB respecto a la banda de paso. Define el límite superior de la banda pasante.</p>
                
                <h4>Ganancia (A):</h4>
                <p>Amplificación en la banda de paso, expresada en decibelios (dB). Determina la amplificación de las señales en la banda pasante.</p>
                
                <h4>Capacitor (C):</h4>
                <p>Valor del capacitor de referencia para el diseño. Se recomienda usar valores comerciales entre 100pF y 100nF para frecuencias altas, y entre 100nF y 10µF para frecuencias bajas.</p>

                <h4>Resistencia Ra:</h4>
                <p>Resistencia de entrada del circuito. Afecta la impedancia de entrada y la ganancia total. Se recomienda usar valores entre 1kΩ y 100kΩ.</p>

                <div className="design-notes">
                  <h4>Notas de diseño:</h4>
                  <ul>
                    <li>La frecuencia angular ωo = 2πfo</li>
                    <li>La pendiente de caída es de -40 dB/década después de fo</li>
                    <li>El factor n determina la respuesta del filtro</li>
                  </ul>
                </div>

                <div className="circuit-preview basic-circuit">
                  <img 
                    src={circuitImageBasic}
                    alt="Circuito Pasa Bajos Básico"
                    className="circuit-diagram-preview"
                  />
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

              <div className="input-field-container">
                <TextField
                  className="cyber-input"
                  label="Frecuencia de corte"
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

        {/* Contenedor de resultados */}
        {showResults && results && (
          <div className="results-container">
            <Typography variant="h5" className="section-title">
              Resultados del Filtro
            </Typography>

            <Grid container spacing={4}>
              {/* Circuito con valores - Izquierda */}
              <Grid item xs={12} md={6}>
                <div className="circuit-preview circuit-with-values">
                  <img 
                    src={circuitImageWithValues}
                    alt="Circuito Pasa Bajos con Valores"
                    className="circuit-diagram-preview"
                  />
                  {/* Valores superpuestos */}
                  <div className="circuit-values">
                    <span className="value nC-value">
                      {formatValue(parseFloat(results.nC), 'capacitance', resultUnits.C)}
                    </span>
                    <span className="value C-value">
                      {formatValue(parseFloat(results.C), 'capacitance', resultUnits.C)}
                    </span>
                    <span className="value R-value">
                      {formatValue(parseFloat(results.R) * 1000, 'resistance', resultUnits.R)}
                    </span>
                    <span className="value Rf-value">
                      {formatValue(parseFloat(results.Rf) * 1000, 'resistance', resultUnits.Rf)}
                    </span>
                    <span className="value Ra-value">
                      {formatValue(parseFloat(results.Ra) * 1000, 'resistance', resultUnits.Ra)}
                    </span>
                  </div>
                </div>
              </Grid>

              {/* Diagrama de Bode - Derecha */}
              <Grid item xs={12} md={6}>
                <div className="bode-plot">
                  <Line
                    data={{
                      datasets: [{
                        data: results.bodeData,
                        borderColor: '#00ff9d',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4
                      }]
                    }}
                    options={bodeOptions}
                  />
                </div>
              </Grid>

              {/* Valores calculados - Izquierda */}
              <Grid item xs={12} md={6}>
                <Box className="result-box">
                  <Typography variant="h6" sx={{ mb: 2, color: 'var(--primary-dark)' }}>
                    Valores calculados:
                  </Typography>
                  {/* Frecuencia de corte */}
                  <div className="result-item">
                    <span>Frecuencia de corte (fo):</span>
                    <div className="result-value-with-unit">
                      <span>{parseFloat(results.wo).toFixed(2)}</span>
                      <Select
                        value={resultUnits.wo}
                        onChange={(e) => handleResultUnitChange('wo', e.target.value)}
                        className="unit-select-small"
                      >
                        <MenuItem value="Hz">Hz</MenuItem>
                        <MenuItem value="rad/s">rad/s</MenuItem>
                      </Select>
                    </div>
                  </div>

                  {/* Factor n - sin unidades */}
                  <div className="result-item">
                    <span>Factor n:</span>
                    <span>{results.n}</span>
                  </div>

                  {/* Factor Q - sin unidades */}
                  <div className="result-item">
                    <span>Factor Q:</span>
                    <span>{results.Q}</span>
                  </div>

                  {/* Mostrar C y nC */}
                  <div className="result-item">
                    <span>Capacitor C:</span>
                    <div className="result-value-with-unit">
                      <span>{parseFloat(results.C)}</span>
                      <Select
                        value={resultUnits.C}
                        onChange={(e) => handleResultUnitChange('C', e.target.value)}
                        className="unit-select-small"
                      >
                        <MenuItem value="pF">pF</MenuItem>
                        <MenuItem value="nF">nF</MenuItem>
                        <MenuItem value="µF">µF</MenuItem>
                      </Select>
                    </div>
                  </div>
                  <div className="result-item">
                    <span>Capacitor nC:</span>
                    <div className="result-value-with-unit">
                      <span>{parseFloat(results.nC)}</span>
                      <Select
                        value={resultUnits.C}
                        onChange={(e) => handleResultUnitChange('C', e.target.value)}
                        className="unit-select-small"
                      >
                        <MenuItem value="pF">pF</MenuItem>
                        <MenuItem value="nF">nF</MenuItem>
                        <MenuItem value="µF">µF</MenuItem>
                      </Select>
                    </div>
                  </div>

                  {/* Mostrar R y Rf */}
                  <div className="result-item">
                    <span>Resistencia R:</span>
                    <div className="result-value-with-unit">
                      <span>{parseFloat(results.R)}</span>
                      <Select
                        value={resultUnits.R}
                        onChange={(e) => handleResultUnitChange('R', e.target.value)}
                        className="unit-select-small"
                      >
                        <MenuItem value="Ω">Ω</MenuItem>
                        <MenuItem value="kΩ">kΩ</MenuItem>
                        <MenuItem value="MΩ">MΩ</MenuItem>
                      </Select>
                    </div>
                  </div>
                  <div className="result-item">
                    <span>Resistencia Rf:</span>
                    <div className="result-value-with-unit">
                      <span>{parseFloat(results.Rf)}</span>
                      <Select
                        value={resultUnits.Rf}
                        onChange={(e) => handleResultUnitChange('Rf', e.target.value)}
                        className="unit-select-small"
                      >
                        <MenuItem value="Ω">Ω</MenuItem>
                        <MenuItem value="kΩ">kΩ</MenuItem>
                        <MenuItem value="MΩ">MΩ</MenuItem>
                      </Select>
                    </div>
                  </div>
                </Box>
              </Grid>

              {/* Función de transferencia - Derecha */}
              <Grid item xs={12} md={6}>
                <Box className="result-box">
                  <Typography variant="h6" sx={{ mb: 2, color: 'var(--primary-dark)' }}>
                    Función de Transferencia:
                  </Typography>
                  <div className="transfer-function">
                    <MathJax>
                      {"\\[H(s) = \\frac{\\frac{1}{nR^2C^2}\\left(1 + \\frac{R_f}{R_a}\\right)}{s^2 + \\frac{1}{nRC}\\left(2n-\\frac{R_f}{R_a}\\right)s + \\frac{1}{nR^2C^2}}\\]"}
                    </MathJax>
                  </div>

                  <Typography variant="h6" sx={{ mt: 4, mb: 2, color: 'var(--primary-dark)' }}>
                    Función de Transferencia (Valores calculados):
                  </Typography>
                  <div className="transfer-function calculated">
                    <MathJax>
                      {``}
                    </MathJax>
                  </div>
                </Box>
              </Grid>
            </Grid>
          </div>
        )}
      </div>
    </MathJaxContext>
  );
}; 