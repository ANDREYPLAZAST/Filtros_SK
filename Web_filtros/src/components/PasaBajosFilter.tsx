import React, { useState } from 'react';
import { Grid, Typography, Box, TextField, Button, MenuItem, Select, FormControlLabel, Switch } from '@mui/material';
import '../styles/Filter.css';
import circuitImageBasic from '../assets/PASABAJOS.png';
import circuitImageWithValues from '../assets/PASABAJOS2.png';
import { Line } from 'react-chartjs-2';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

const bodeOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false
    }
  },
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
  Rf: string;
  Ra: string;
  bodeData: Array<{x: number, y: number}>;
  numerador: string;
  denominador: string;
  displayed: {
    wo: string;
    R: string;
    Rf: string;
    Ra: string;
    C: string;
  };
}

export const PasaBajosFilter = () => {
  const [inputs, setInputs] = useState({
    fo: '',
    Q: '',
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
    R: 'Ω',
    C: 'nF',
    Rf: 'Ω',
    Ra: 'Ω'
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

  const convertResistanceUnit = (value: number, fromUnit: string, toUnit: string): number => {
    // Convertir a ohms primero
    let valueInOhms = value;
    if (fromUnit === 'kΩ') {
      valueInOhms = value * 1000;
    } else if (fromUnit === 'MΩ') {
      valueInOhms = value * 1000000;
    }

    // Convertir de ohms a la unidad deseada
    if (toUnit === 'kΩ') {
      return valueInOhms / 1000;
    } else if (toUnit === 'MΩ') {
      return valueInOhms / 1000000;
    }
    return valueInOhms; // Para Ω
  };

  const convertCapacitanceUnit = (value: number, fromUnit: string, toUnit: string): number => {
    // Convertir a faradios primero
    let valueInFarads = value;
    if (fromUnit === 'µF') {
      valueInFarads = value * 1e-6;
    } else if (fromUnit === 'nF') {
      valueInFarads = value * 1e-9;
    } else if (fromUnit === 'pF') {
      valueInFarads = value * 1e-12;
    }

    // Convertir de faradios a la unidad deseada
    if (toUnit === 'µF') {
      return valueInFarads * 1e6;
    } else if (toUnit === 'nF') {
      return valueInFarads * 1e9;
    } else if (toUnit === 'pF') {
      return valueInFarads * 1e12;
    }
    return valueInFarads;
  };

  const formatNumber = (num: number): string => {
    return Number(num).toFixed(2);
  };

  const handleResultUnitChange = (param: keyof Results['displayed'], newUnit: string) => {
    if (!results) return;

    // Obtener el valor base
    let baseValue = parseFloat(results[param]);
    let currentUnit = resultUnits[param];
    let convertedValue: number;

    // Convertir según el tipo de parámetro
    if (param === 'C') {
      convertedValue = convertCapacitanceUnit(baseValue, 'F', newUnit);
    } else if (param === 'wo') {
      convertedValue = newUnit === 'Hz' ? baseValue : baseValue * 2 * Math.PI;
    } else {
      // Para R, Rf, Ra
      convertedValue = convertResistanceUnit(baseValue, 'Ω', newUnit);
    }

    // Actualizar las unidades
    setResultUnits(prev => ({
      ...prev,
      [param]: newUnit
    }));

    // Actualizar los valores mostrados
    setResults(prev => {
      if (!prev) return null;
      return {
        ...prev,
        displayed: {
          ...prev.displayed,
          [param]: formatNumber(convertedValue)
        }
      };
    });
  };

  // Añadir función para calcular la función de transferencia
  const calcularFuncionTransferencia = (n: number, R: number, C: number, Rf: number, Ra: number) => {
    // Log inicial para verificar las unidades
    console.log('Valores de entrada:', {
      n,
      R: `${R} ohms`,
      C: `${C} F`,
      Rf: `${Rf} ohms`,
      Ra: `${Ra} ohms`
    });

    // Calcular coeficientes
    const num_coef = (1/(n * R * R * C * C)) * (1 + Rf/Ra);
    const den_s_coef = (1/(n * R * C)) * (2 * n - Rf/Ra);
    const den_ind = 1/(n * R * R * C * C);

    // Formatear la función de transferencia sin el signo +
    const numerador = num_coef.toExponential(3).replace('+', '');
    const denominador = `s^2 + ${den_s_coef.toExponential(3).replace('+', '')}s + ${den_ind.toExponential(3).replace('+', '')}`;

    return { 
      numerador: numerador,
      denominador: denominador,
      coeficientes: {
        num: num_coef,
        den_s: den_s_coef,
        den_ind: den_ind
      }
    };
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

      // Factor de calidad Q
      const Q = parseFloat(inputs.Q);

      // Cálculo de n usando la ecuación cuadrática del MATLAB
      const a = 4;
      const b = 4 - 4*A - 1/(Q*Q);
      const c = 1 - 2*A + A*A;
      
      const discriminant = b * b - 4 * a * c;
      const n1 = (-b + Math.sqrt(discriminant)) / (2 * a);
      const n2 = (-b - Math.sqrt(discriminant)) / (2 * a);
      const n = Math.max(n1, n2);
      console.log('Cálculo de n:', { a, b, c, discriminant, n1, n2, n });

      // Cálculos de C y R
      let C, R;
      if (capacitorMode === 'C') {
        C = parseFloat(inputs.C) * (units.C === 'µF' ? 1e-6 : units.C === 'nF' ? 1e-9 : 1e-12);
        R = 1 / (wo *wo*n * C);
        console.log('Modo C:', { C_input: C, R_calculado: R });
      } else {
        R = parseFloat(inputs.R) * (units.R === 'kΩ' ? 1000 : 1);
        C = 1 / (wo * wo * n * R);
        console.log('Modo R:', { R_input: R, C_calculado: C });
      }

      // Cálculos de Ra y Rf
      let Ra, Rf;
      if (resistanceMode === 'Ra') {
        Ra = parseFloat(inputs.Ra) * (units.Ra === 'kΩ' ? 1000 : 1);
        Rf = Ra * (A - 1);
        console.log('Modo Ra:', { Ra_input: Ra, Rf_calculado: Rf });
      } else {
        Rf = parseFloat(inputs.Rf) * (units.Rf === 'kΩ' ? 1000 : 1);
        Ra = Rf / (A - 1);
        console.log('Modo Rf:', { Rf_input: Rf, Ra_calculado: Ra });
      }

      // Calcular la función de transferencia
      const { numerador, denominador, coeficientes } = calcularFuncionTransferencia(
        n,
        R,
        C,
        Rf,
        Ra
      );

      // Generar datos para el diagrama de Bode usando los coeficientes calculados
      const bodeData = generateBodeData(coeficientes.num, coeficientes.den_s, coeficientes.den_ind);

      return {
        wo: (wo/(2*Math.PI)).toFixed(2),
        n: n.toFixed(3),
        Q: Q.toFixed(3),
        R: R.toString(),
        C: C.toString(),
        Rf: Rf.toString(),
        Ra: Ra.toString(),
        bodeData,
        numerador,
        denominador,
        displayed: {
          wo: (wo/(2*Math.PI)).toFixed(2),
          R: formatNumber(R),
          Rf: formatNumber(Rf),
          Ra: formatNumber(Ra),
          C: formatNumber(C < 1e-9 ? C*1e12 : C < 1e-6 ? C*1e9 : C*1e6)
        }
      };
    } catch (error) {
      console.error('Error en los cálculos:', error);
      throw error;
    }
  };

  const generateBodeData = (num_coef: number, den_s_coef: number, den_ind_coef: number) => {
    const data = [];
    
    // Generar puntos para el diagrama de Bode
    for(let f = 0.1; f <= 1000000; f *= 1.1) {
      const w = 2 * Math.PI * f;
      // Calcular magnitud usando la función de transferencia
      const s_squared = -(w * w);
      const s_term = den_s_coef * w;
      const numerator = num_coef;
      const denominator = Math.sqrt(
        Math.pow(s_squared - den_ind_coef, 2) + 
        Math.pow(s_term, 2)
      );
      const magnitude = 20 * Math.log10(numerator/denominator);
      data.push({x: f, y: magnitude});
    }
    return data;
  };

  // Añadir función para reiniciar las unidades
  const resetToDefaultUnits = () => {
    setResultUnits({
      wo: 'Hz',
      R: 'Ω',
      C: 'nF',
      Rf: 'Ω',
      Ra: 'Ω'
    });
  };

  const handleCalculate = () => {
    try {
      // Reiniciar las unidades a sus valores por defecto
      resetToDefaultUnits();
      
      // Reiniciar los resultados anteriores
      setResults(null);
      setShowResults(false);
      
      // Calcular nuevos resultados
      const calculatedResults = calculateValues();
      
      // Actualizar resultados con los nuevos valores
      setResults(calculatedResults);
      setShowResults(true);
    } catch (error) {
      console.error('Error al calcular:', error);
    }
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
                  label="Factor de calidad Q"
                  name="Q"
                  value={inputs.Q}
                  onChange={handleInputChange}
                  type="number"
                  inputProps={{ step: "any" }}
                  fullWidth
                />
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
                <div className="gain-unit">
                  dB
                </div>
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
                    <span className="value R-value">
                      {`${results.displayed.R} ${resultUnits.R}`}
                    </span>
                    <span className="value C-value">
                      {`${results.displayed.C} ${resultUnits.C}`}
                    </span>
                    <span className="value Rf-value">
                      {`${results.displayed.Rf} ${resultUnits.Rf}`}
                    </span>
                    <span className="value Ra-value">
                      {`${results.displayed.Ra} ${resultUnits.Ra}`}
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

              {/* Valores calculados */}
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
                      <span>{results.displayed.wo}</span>
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

                  {/* Factor n */}
                  <div className="result-item">
                    <span>Factor n:</span>
                    <span>{results.n}</span>
                  </div>

                  {/* Factor Q */}
                  <div className="result-item">
                    <span>Factor Q:</span>
                    <span>{results.Q}</span>
                  </div>

                  {/* Mostrar R */}
                  <div className="result-item">
                    <span>Resistencia R:</span>
                    <div className="result-value-with-unit">
                      <span>{results.displayed.R}</span>
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

                  {/* Mostrar C */}
                  <div className="result-item">
                    <span>Capacitor C:</span>
                    <div className="result-value-with-unit">
                      <span>{results.displayed.C}</span>
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

                  {/* Mostrar Ra */}
                  <div className="result-item">
                    <span>Resistencia Ra:</span>
                    <div className="result-value-with-unit">
                      <span>{results.displayed.Ra}</span>
                      <Select
                        value={resultUnits.Ra}
                        onChange={(e) => handleResultUnitChange('Ra', e.target.value)}
                        className="unit-select-small"
                      >
                        <MenuItem value="Ω">Ω</MenuItem>
                        <MenuItem value="kΩ">kΩ</MenuItem>
                        <MenuItem value="MΩ">MΩ</MenuItem>
                      </Select>
                    </div>
                  </div>

                  {/* Mostrar Rf */}
                  <div className="result-item">
                    <span>Resistencia Rf:</span>
                    <div className="result-value-with-unit">
                      <span>{results.displayed.Rf}</span>
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
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Función de Transferencia:
                  </Typography>
                  <div className="transfer-function">
                    <MathJax>
                      {"\\[H(s) = \\frac{\\frac{1}{nR^2C^2}\\left(1 + \\frac{R_f}{R_a}\\right)}{s^2 + \\frac{1}{nRC}\\left(2n - \\frac{R_f}{R_a}\\right)s + \\frac{1}{nR^2C^2}}\\]"}
                    </MathJax>
                  </div>

                  <Typography variant="h6" sx={{ mt: 4, mb: 2, color: 'var(--primary-dark)' }}>
                    Función de Transferencia (Valores calculados):
                  </Typography>
                  <div className="transfer-function calculated">
                    <MathJax>
                      {`\\[H(s) = \\frac{\\displaystyle ${results.numerador}}{\\displaystyle ${results.denominador}}\\]`}
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