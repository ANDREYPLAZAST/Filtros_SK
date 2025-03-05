import React, { useState } from 'react';
import { Grid, Typography, Box, TextField, Button, MenuItem, Select, FormControlLabel, Switch, SelectChangeEvent } from '@mui/material';
import '../styles/Filter.css';
import { complex, multiply, divide, add } from 'mathjs';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale
} from 'chart.js';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import circuitImageBasic from '../assets/RECHAZABANDA.png';
import circuitImageWithValues from '../assets/RECHAZABANDA2.png';

// Registrar los componentes necesarios de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale
);

// Definir la función fuera del calculateValues
const calcularFuncionTransferencia = (R: number, C: number, Rf: number, Ra: number) => {
  // Log inicial para verificar las unidades
  console.log('Valores de entrada:', {
    R: `${R} ohms`,
    C: `${C} F`,
    Rf: `${Rf} ohms`,
    Ra: `${Ra} ohms`
  });

  // Calcular numerador
  const ganancia = 1 + Rf/Ra;
  const numerador_final = ganancia;

  // Calcular denominador
  const coef_s = 1/(R*C);
  const termino_independiente = 1/(R*R*C*C);

  // Formatear la función de transferencia
  const numerador = `${numerador_final.toFixed(3)}(s^2 + \\frac{1}{R^2C^2})`;
  const denominador = `s^2 + \\frac{1}{RC}s + \\frac{1}{R^2C^2}`;

  return { 
    numerador, 
    denominador,
    coeficientes: {
      num: numerador_final,
      den_s: coef_s,
      den_ind: termino_independiente
    }
  };
};

// Corregir la interfaz SwitchEvent
interface SwitchEvent {
  target: {
    checked: boolean;
    name?: string;
    value?: string;
  };
}

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

  interface Results {
    Q: string;
    R: string;
    C: string;
    Rf: string;
    Ra: string;
    fo: string;
    BW: string;
    f1: string;
    f2: string;
    bodeData: Array<{x: number, y: number}>;
    numerador: string;
    denominador: string;
    coeficientes: {
      num: number;
      den_s: number;
      den_ind: number;
    };
  }

  const [results, setResults] = useState<Results | null>(null);

  const [showResults, setShowResults] = useState(false);

  const [calculationMode, setCalculationMode] = useState('BW'); // 'BW' o 'FC'
  const [capacitorMode, setCapacitorMode] = useState('C');  // 'C' o 'R'
  const [resistanceMode, setResistanceMode] = useState('Ra'); // 'Ra' o 'Rf'

  const [resultUnits, setResultUnits] = useState({
    R: 'kΩ',
    Ra: 'kΩ',
    Rf: 'kΩ',
    C: 'nF'
  });

  const [darkMode] = useState(false);

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
      // Convertir frecuencia a Hz y calcular BW
      const fo = parseFloat(inputs.fo) * (units.fo === 'kHz' ? 1000 : units.fo === 'MHz' ? 1000000 : 1);
      let BW, f1, f2;  // Declarar f1 y f2 aquí
      
      if (calculationMode === 'BW') {
        BW = parseFloat(inputs.BW) * (units.BW === 'kHz' ? 1000 : units.BW === 'MHz' ? 1000000 : 1);
        // Calcular f1 y f2 a partir de fo y BW
        const Q = fo / BW;
        f1 = fo * (Math.sqrt(1 + 1/(4*Q*Q)) - 1/(2*Q));
        f2 = fo * (Math.sqrt(1 + 1/(4*Q*Q)) + 1/(2*Q));
      } else {
        f1 = parseFloat(inputs.f1) * (units.f1 === 'kHz' ? 1000 : units.f1 === 'MHz' ? 1000000 : 1);
        f2 = parseFloat(inputs.f2) * (units.f2 === 'kHz' ? 1000 : units.f2 === 'MHz' ? 1000000 : 1);
        BW = Math.abs(f2 - f1);
      }

      const wo = 2 * Math.PI * fo;
      const Q = fo / BW;

      // Ganancia en dB a lineal
      const A_db = parseFloat(inputs.A);
      const A = Math.pow(10, A_db/20);

      // Cálculo de n
      const A_plus_1_squared = Math.pow(A + 1, 2);
      const term_with_Q = A_plus_1_squared / (2 * Q * Q);


      let C, R;
      if (capacitorMode === 'C') {
        C = parseFloat(inputs.C) * (units.C === 'µF' ? 1e-6 : units.C === 'nF' ? 1e-9 : 1e-12);
        R = 1/ (wo * C);
        console.log('Modo C - Cálculos:', { C_input: C, R_calculado: R });
      } else {
        R = parseFloat(inputs.R) * (units.R === 'kΩ' ? 1000 : 1);
        C = 1/ (wo * R);
        console.log('Modo R - Cálculos:', { R_input: R, C_calculado: C });
      }

      // Cálculos de Ra y Rf
      let Ra, Rf;
      if (resistanceMode === 'Ra') {
        Ra = parseFloat(inputs.Ra) * (units.Ra === 'kΩ' ? 1000 : 1);
        const relation = 1-(1/2*Q);
        Rf = Ra * relation;

      } else {
        Rf = parseFloat(inputs.Rf) * (units.Rf === 'kΩ' ? 1000 : 1);
        const relation = 1-(1/2*Q);
        Ra = Rf / relation;

      }
      // Calcular nR

      // Convertir todas las resistencias a ohms y capacitor a faradios
      const R_ohms = R;  // Ya está en ohms
      const Rf_ohms = Rf;  // Ya está en ohms
      const Ra_ohms = Ra;  // Ya está en ohms
      const C_farads = C;  // Ya está en faradios

      console.log('Valores antes de calcular H(s):', {

        R_ohms,
        C_farads,
        Rf_ohms,
        Ra_ohms
      });

      const { numerador, denominador, coeficientes } = calcularFuncionTransferencia(
     
        R_ohms,
        C_farads,
        Rf_ohms,
        Ra_ohms
      );

      // Actualizar results con los nuevos valores
      const results = {
        Q: Q.toFixed(3),
        R: (R/1000).toFixed(2),
        C: C < 1e-9 ? 
           (C*1e12).toFixed(2) : 
           C < 1e-6 ? 
           (C*1e9).toFixed(2) : 
           (C*1e6).toFixed(2),
        Rf: (Rf/1000).toFixed(2),
        Ra: (Ra/1000).toFixed(2),
        fo: (fo/1000).toFixed(2) + ' kHz',
        BW: (BW/1000).toFixed(2) + ' kHz',
        f1: (f1/1000).toFixed(2) + ' kHz',
        f2: (f2/1000).toFixed(2) + ' kHz',
        bodeData: [],
        numerador,
        denominador,
        coeficientes
      };

      // Log final para verificar los valores
      console.log('Relación final Rf/Ra:', {
        Rf: Rf,
        Ra: Ra,
        relation: Rf/Ra,
        mode: resistanceMode
      });

      return results;
    } catch (error) {
      console.error('Error en cálculos:', error);
      throw error;
    }
  };

  // Función para generar los datos del diagrama de Bode
  const generateBodeData = (num_coef: number, den_s_coef: number, den_ind_coef: number) => {
    const bodeData = [];
    
    // Generar puntos para el diagrama de Bode
    for (let freq = 1; freq <= 1000000; freq *= 1.1) {
      const w = 2 * Math.PI * freq;
      const s = complex(0, w);
      
      // Calcular numerador: num_coef * s
      const num = multiply(num_coef, s);
      
      // Calcular denominador: s² + den_s_coef*s + den_ind_coef
      const s_squared = multiply(s, s);
      const s_term = multiply(den_s_coef, s);
      const den = add(add(s_squared, s_term), den_ind_coef);
      
      // Calcular H(s)
      const H = divide(num, den) as { re: number; im: number };
      
      // Calcular magnitud en dB
      const magnitude_db = 20 * Math.log10(Math.sqrt(H.re * H.re + H.im * H.im));
      
      bodeData.push({
        x: freq,
        y: magnitude_db
      });
    }

    return bodeData;
  };

  const handleCalculate = () => {
    try {
      const calculatedResults = calculateValues();
      
      // Generar datos de Bode usando los coeficientes
      const bodeData = generateBodeData(
        calculatedResults.coeficientes.num,
        calculatedResults.coeficientes.den_s,
        calculatedResults.coeficientes.den_ind
      );
      
      setResults({...calculatedResults, bodeData});
      setShowResults(true);
    } catch (error) {
      console.error('Error al calcular:', error);
    }
  };

  // Actualiza la configuración del gráfico de Bode
  const bodeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'logarithmic' as const,
        position: 'bottom' as const,
        title: {
          display: true,
          text: 'Frecuencia (Hz)',
          color: darkMode ? '#ffffff' : '#0a5344'
        },
        ticks: {
          color: darkMode ? '#ffffff' : '#0a5344'
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(10, 83, 68, 0.1)'
        }
      },
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Magnitud (dB)',
          color: darkMode ? '#ffffff' : '#0a5344'
        },
        ticks: {
          color: darkMode ? '#ffffff' : '#0a5344'
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(10, 83, 68, 0.1)'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Magnitud: ${context.parsed.y.toFixed(2)} dB @ ${context.parsed.x.toFixed(2)} Hz`;
          }
        }
      },
      legend: {
        display: false
      }
    }
  } as const;

  // Corregir la función formatValueWithUnit
  const formatValueWithUnit = (value: number, fromUnit: string, toUnit: string): string => {
    if (fromUnit.includes('F')) {  // Si es un capacitor
      let valueInPf = value;
      if (fromUnit === 'µF') valueInPf = value * 1000000;
      if (fromUnit === 'nF') valueInPf = value * 1000;

      let convertedValue = valueInPf;
      if (toUnit === 'pF') convertedValue = valueInPf;
      if (toUnit === 'nF') convertedValue = valueInPf / 1000;
      if (toUnit === 'µF') convertedValue = valueInPf / 1000000;

      return convertedValue < 10 ? 
        convertedValue.toFixed(2) : 
        convertedValue.toFixed(1);
    } else {  // Si es una resistencia
      let valueInOhms = value;
      if (fromUnit === 'kΩ') valueInOhms = value * 1000;
      if (fromUnit === 'MΩ') valueInOhms = value * 1000000;

      let convertedValue = valueInOhms;
      if (toUnit === 'Ω') convertedValue = valueInOhms;
      if (toUnit === 'kΩ') convertedValue = valueInOhms / 1000;
      if (toUnit === 'MΩ') convertedValue = valueInOhms / 1000000;

      // Formatear con 2 decimales si es menor que 10, si no con 1 decimal
      return convertedValue < 10 ? 
        convertedValue.toFixed(2) : 
        convertedValue.toFixed(1);
    }
  };

  // Actualizar handleResultUnitChange
  const handleResultUnitChange = (param: string, newUnit: string) => {
    if (!results) return;

    const currentUnit = resultUnits[param as keyof typeof resultUnits];
    const currentValue = parseFloat(results[param as keyof typeof results] as string);
    
    const newValue = formatValueWithUnit(currentValue, currentUnit, newUnit);

    // Actualizar tanto los resultados como el diagrama
    setResults(prev => ({
      ...prev!,
      [param]: newValue
    }));

    setResultUnits(prev => ({
      ...prev,
      [param]: newUnit
    }));

    // Actualizar valores en el diagrama del circuito
    updateCircuitValues(param, newValue, newUnit);
  };

  // Función para actualizar los valores en el diagrama
  const updateCircuitValues = (param: string, value: string, unit: string) => {
    const circuitValues = document.querySelectorAll('.circuit-values .value');
    circuitValues.forEach(element => {
      if (element.classList.contains(`${param.toLowerCase()}-value`)) {
        // Si es un capacitor, asegurarse de mostrar solo el valor numérico + unidad
        if (param === 'C') {
          const numericValue = value.split(' ')[0];  // Obtener solo el valor numérico
          element.textContent = `${numericValue} ${unit}`;
        } else {
          element.textContent = `${value} ${unit}`;
        }
      }
    });
  };

  // Actualizar los manejadores de eventos para los switches
  const handleCalculationModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCalculationMode(e.target.checked ? 'FC' : 'BW');
  };

  const handleCapacitorModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCapacitorMode(e.target.checked ? 'R' : 'C');
  };

  const handleResistanceModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResistanceMode(e.target.checked ? 'Rf' : 'Ra');
  };

  // Función para convertir valores entre unidades sin redondeo
  const convertValue = (value: number, fromUnit: string, toUnit: string) => {
    // Primero convertir a ohms
    let valueInOhms = value;
    if (fromUnit === 'kΩ') valueInOhms = value * 1000;
    if (fromUnit === 'MΩ') valueInOhms = value * 1000000;

    // Luego convertir a la unidad deseada
    if (toUnit === 'Ω') return valueInOhms;
    if (toUnit === 'kΩ') return valueInOhms / 1000;
    if (toUnit === 'MΩ') return valueInOhms / 1000000;
    return value;
  };

  return (
    <MathJaxContext>
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

                <div className="circuit-preview basic-circuit">
                  <img 
                    src={circuitImageBasic}
                    alt="Circuito Pasa Banda Básico"
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
              
              {/* Switch para cambiar modo de cálculo */}
              <div className="calculation-mode-switch">
                <FormControlLabel
                  control={
                    <Switch
                      checked={calculationMode === 'FC'}
                      onChange={handleCalculationModeChange}
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
                <div className={`gain-unit ${darkMode ? 'dark' : 'light'}`}>
                  dB
                </div>
              </div>

              {/* Switch para Capacitor/Resistencia */}
              <div className="calculation-mode-switch">
                <FormControlLabel
                  control={
                    <Switch
                      checked={capacitorMode === 'R'}
                      onChange={handleCapacitorModeChange}
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
                      onChange={handleResistanceModeChange}
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
                    alt="Circuito Pasa Banda con Valores"
                    className="circuit-diagram-preview"
                  />
                  {/* Valores superpuestos */}
                  <div className="circuit-values">
                    <span className="value C-left-value">
                      {`${results.C.split(' ')[0]} ${resultUnits.C}`}
                    </span>
                    <span className="value C-center-value">
                      {`${results.C.split(' ')[0]} ${resultUnits.C}`}
                    </span>
                    <span className="value R-value">
                      {`${results.R} ${resultUnits.R}`}
                    </span>
                    <span className="value Rf-value">
                      {`${results.Rf} ${resultUnits.Rf}`}
                    </span>
                    <span className="value Ra-value">
                      {`${results.Ra} ${resultUnits.Ra}`}
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
                        borderColor: darkMode ? '#00ff9d' : '#0a5344',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4
                      }]
                    }}
                    options={bodeOptions}
                  />
                </div>
              </Grid>
            </Grid>
            
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
                    <span>Resistencia R:</span>
                    <div className="result-value-with-unit">
                      <span>{results.R}</span>
                      <Select
                        value={resultUnits.R}
                        onChange={(e) => handleResultUnitChange('R', e.target.value)}
                        size="small"
                        className="unit-select-small"
                      >
                        <MenuItem value="Ω">Ω</MenuItem>
                        <MenuItem value="kΩ">kΩ</MenuItem>
                        <MenuItem value="MΩ">MΩ</MenuItem>
                      </Select>
                    </div>
                  </div>
                  {capacitorMode === 'C' ? (
                    <div className="result-item">
                      <span>Capacitor C:</span>
                      <div className="result-value-with-unit">
                        <span>{results.C}</span>
                        <Select
                          value={resultUnits.C}
                          onChange={(e) => handleResultUnitChange('C', e.target.value)}
                          size="small"
                          className="unit-select-small"
                        >
                          <MenuItem value="pF">pF</MenuItem>
                          <MenuItem value="nF">nF</MenuItem>
                          <MenuItem value="µF">µF</MenuItem>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="result-item">
                      <span>Resistencia R:</span>
                      <div className="result-value-with-unit">
                        <span>{results.R}</span>
                        <Select
                          value={resultUnits.R}
                          onChange={(e) => handleResultUnitChange('R', e.target.value)}
                          size="small"
                          className="unit-select-small"
                        >
                          <MenuItem value="Ω">Ω</MenuItem>
                          <MenuItem value="kΩ">kΩ</MenuItem>
                          <MenuItem value="MΩ">MΩ</MenuItem>
                        </Select>
                      </div>
                    </div>
                  )}
                  {resistanceMode === 'Ra' ? (
                    <div className="result-item">
                      <span>Resistencia Rf:</span>
                      <div className="result-value-with-unit">
                        <span>{results.Rf}</span>
                        <Select
                          value={resultUnits.Rf}
                          onChange={(e) => handleResultUnitChange('Rf', e.target.value)}
                          size="small"
                          className="unit-select-small"
                        >
                          <MenuItem value="Ω">Ω</MenuItem>
                          <MenuItem value="kΩ">kΩ</MenuItem>
                          <MenuItem value="MΩ">MΩ</MenuItem>
                        </Select>
                      </div>
                    </div>
                  ) : (
                    <div className="result-item">
                      <span>Resistencia Ra:</span>
                      <div className="result-value-with-unit">
                        <span>{results.Ra}</span>
                        <Select
                          value={resultUnits.Ra}
                          onChange={(e) => handleResultUnitChange('Ra', e.target.value)}
                          size="small"
                          className="unit-select-small"
                        >
                          <MenuItem value="Ω">Ω</MenuItem>
                          <MenuItem value="kΩ">kΩ</MenuItem>
                          <MenuItem value="MΩ">MΩ</MenuItem>
                        </Select>
                      </div>
                    </div>
                  )}
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

            <Grid item xs={12}>
              <Box className="transfer-function-box">
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Función de Transferencia:
                </Typography>
                <div className="transfer-function">
                  <MathJax>
                    {"\\[H(s) = \\frac{\\frac{1}{nRC}\\left(1 + \\frac{R_f}{R_a}\\right)s}{s^2 + \\frac{1}{RC}\\left(2 + \\frac{1}{n}\\left(1-\\frac{R_f}{R_a}\\right)\\right)s + \\frac{2}{nR^2C^2}}\\]"}
                  </MathJax>
                </div>

                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Función de Transferencia (Valores calculados):
                </Typography>
                <div className="transfer-function calculated">
                  <MathJax>
                    {`\\[H(s) = \\frac{${results.numerador}}{${results.denominador}}\\]`}
                  </MathJax>
                </div>
              </Box>
            </Grid>
          </div>
        )}
      </div>
    </MathJaxContext>
  );
}; 