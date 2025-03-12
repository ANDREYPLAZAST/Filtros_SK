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
  // Asegurarse de que R esté en ohms y C en faradios
  console.log('Valores de entrada (unidades base):', {
    R: `${R} ohms`,
    C: `${C} F`,
    Rf: `${Rf} ohms`,
    Ra: `${Ra} ohms`
  });

  // Calcular ganancia
  const ganancia = 1 + Rf/Ra;
  
  // Calcular término independiente (1/R²C²)
  const termino_independiente = 1/(R*R*C*C);
  
  // Calcular coeficiente de s en el denominador (2/RC)
  const coef_s = 2/(R*C);

  // Formatear la función de transferencia usando notación científica para valores muy grandes/pequeños
  const numerador = `${ganancia.toFixed(3)}(s^2 + ${termino_independiente.toExponential(3).replace('+', '')})`;
  const denominador = `s^2 + ${coef_s.toExponential(3).replace('+', '')}s + ${termino_independiente.toExponential(3).replace('+', '')}`;

  return { 
    numerador, 
    denominador,
    coeficientes: {
      num: ganancia,
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

interface ResultUnits {
  R: string;
  Ra: string;
  Rf: string;
  C: string;
  C_double: string;
  R_half: string;
}

const formatDisplayValue = (valor: number): string => {
  if (valor === 0) return "0.00";
  return valor.toFixed(2);
};

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
    R_half: string;
    C: string;
    C_double: string;
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
    displayed: {
      R: string;
      R_half: string;
      C: string;
      C_double: string;
      Rf: string;
      Ra: string;
    };
  }

  const [results, setResults] = useState<Results | null>(null);

  const [showResults, setShowResults] = useState(false);

  const [calculationMode, setCalculationMode] = useState('BW'); // 'BW' o 'FC'
  const [capacitorMode, setCapacitorMode] = useState('C');  // 'C' o 'R'
  const [resistanceMode, setResistanceMode] = useState('Ra'); // 'Ra' o 'Rf'

  const [resultUnits, setResultUnits] = useState({
    R: 'Ω',
    Ra: 'Ω',
    Rf: 'Ω',
    C: 'nF',
    C_double: 'nF',
    R_half: 'Ω'  // Agregar unidad independiente para R/2
  });

  const [darkMode] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs({
      ...inputs,
      [e.target.name]: e.target.value
    });
  };

  const handleUnitChange = (param: string, newUnit: string) => {
    setUnits(prev => ({
      ...prev,
      [param]: newUnit
    }));

    // Convertir valores de frecuencia cuando cambian las unidades
    if (results && (param === 'f1' || param === 'f2' || param === 'fo' || param === 'BW')) {
      const currentValue = parseFloat(results[param] as string);
      
      // Primero convertir a Hz (unidad base)
      const baseValueInHz = currentValue * (units[param] === 'MHz' ? 1000000 : units[param] === 'kHz' ? 1000 : 1);
      
      // Luego convertir a la nueva unidad
      let newValue: number;
      if (newUnit === 'MHz') {
        newValue = baseValueInHz / 1000000;
      } else if (newUnit === 'kHz') {
        newValue = baseValueInHz / 1000;
      } else {
        newValue = baseValueInHz;
      }

      setResults(prevResults => {
        if (!prevResults) return prevResults;
        return {
          ...prevResults,
          [param]: newValue.toFixed(2)
        };
      });
    }
  };

  const calculateValues = () => {
    try {
      let fo, BW, f1, f2;
      
      if (calculationMode === 'BW') {
        fo = parseFloat(inputs.fo) * (units.fo === 'kHz' ? 1000 : units.fo === 'MHz' ? 1000000 : 1);
        BW = parseFloat(inputs.BW) * (units.BW === 'kHz' ? 1000 : units.BW === 'MHz' ? 1000000 : 1);
        const Q = fo / BW;
        f1 = fo * (Math.sqrt(1 + 1/(4*Q*Q)) - 1/(2*Q));
        f2 = fo * (Math.sqrt(1 + 1/(4*Q*Q)) + 1/(2*Q));
      } else {
        f1 = parseFloat(inputs.f1) * (units.f1 === 'kHz' ? 1000 : units.f1 === 'MHz' ? 1000000 : 1);
        f2 = parseFloat(inputs.f2) * (units.f2 === 'kHz' ? 1000 : units.f2 === 'MHz' ? 1000000 : 1);
        BW = Math.abs(f2 - f1);
        fo = Math.sqrt(f1 * f2);
      }

      const wo = 2 * Math.PI * fo;
      const Q = fo / BW;

      // Convertir ganancia de dB a V/V
      const A_db = parseFloat(inputs.A);
      const A = Math.pow(10, A_db/20);

      let C, R, R_half;
      if (capacitorMode === 'C') {
        // Convertir C a Faradios
        const C_input = parseFloat(inputs.C);
        C = C_input * (units.C === 'µF' ? 1e-6 : units.C === 'nF' ? 1e-9 : 1e-12);
        R = 1 / (wo * C);
        R_half = R / 2;
      } else {
        // Convertir R a Ohms
        const R_input = parseFloat(inputs.R);
        R = R_input * (units.R === 'kΩ' ? 1000 : 1);
        C = 1 / (wo * R);
        R_half = R / 2;
      }

      // Cálculos de Ra y Rf usando la ganancia en V/V
      let Ra, Rf;
      if (resistanceMode === 'Ra') {
        Ra = parseFloat(inputs.Ra) * (units.Ra === 'kΩ' ? 1000 : 1);
        Rf = Ra * (A - 1);
      } else {
        Rf = parseFloat(inputs.Rf) * (units.Rf === 'kΩ' ? 1000 : 1);
        Ra = Rf / (A - 1);
      }

      // Calcular valores de 2C
      const C_double = 2 * C;

      const { numerador, denominador, coeficientes } = calcularFuncionTransferencia(
        R,
        C,
        Rf,
        Ra
      );

      // Formatear los valores iniciales
      return {
        Q: Q.toFixed(2),
        R: R.toString(),
        R_half: R_half.toString(),
        C: C.toString(),
        C_double: C_double.toString(),
        Rf: Rf.toString(),
        Ra: Ra.toString(),
        fo: fo.toString(),
        BW: BW.toString(),
        f1: f1.toString(),
        f2: f2.toString(),
        bodeData: [],
        numerador,
        denominador,
        coeficientes,
        displayed: {
          R: formatDisplayValue(R),
          R_half: formatDisplayValue(R_half),
          C: formatDisplayValue(C),
          C_double: formatDisplayValue(C_double),
          Rf: formatDisplayValue(Rf),
          Ra: formatDisplayValue(Ra)
        }
      };
    } catch (error) {
      console.error('Error en cálculos:', error);
      throw error;
    }
  };

  // Función para generar los datos del diagrama de Bode
  const generateBodeData = (num_coef: number, den_s_coef: number, den_ind_coef: number) => {
    const bodeData = [];
    
    // Obtener f1 y f2 de los resultados y convertir a Hz
    const f1 = parseFloat(results?.f1 || "0") * (units.f1 === 'kHz' ? 1000 : units.f1 === 'MHz' ? 1000000 : 1);
    const f2 = parseFloat(results?.f2 || "0") * (units.f2 === 'kHz' ? 1000 : units.f2 === 'MHz' ? 1000000 : 1);
    
    // Establecer el rango de frecuencias (tres décadas antes de f1 hasta tres décadas después de f2)
    const startFreq = Math.max(0.1, f1 / 1000);
    const endFreq = f2 * 1000;
    
    // Generar puntos para el diagrama de Bode
    let freq = startFreq;
    while (freq <= endFreq) {
      const w = 2 * Math.PI * freq;
      const s = complex(0, w);
      
      // Calcular numerador: ganancia * (s² + wo²)
      const s_squared = multiply(s, s);
      const num = add(multiply(num_coef, s_squared), multiply(num_coef, den_ind_coef));
      
      // Calcular denominador: s² + (2/RC)s + wo²
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

      // Incrementar la frecuencia logarítmicamente (más puntos para mejor resolución)
      freq *= 1.05;
    }

    return bodeData;
  };

  const handleCalculate = () => {
    try {
      // Reiniciar las unidades a valores por defecto
      setResultUnits({
        R: 'Ω',
        Ra: 'Ω',
        Rf: 'Ω',
        C: 'nF',
        C_double: 'nF',
        R_half: 'Ω'
      });

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
          color: darkMode ? '#ffffff' : '#0a5344',
          callback: function(value: any) {
            if (value === 0) return '0';
            const v = Math.log10(value);
            if (Math.floor(v) === v) return value.toString();
            return '';
          }
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
          color: darkMode ? '#ffffff' : '#0a5344',
          stepSize: 10
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

  const handleResultUnitChange = (param: keyof ResultUnits, newUnit: string) => {
    if (!results) return;

    const value = results[param];
    if (typeof value !== 'string') return;
    
    const currentValue = parseFloat(value);
    let newValue = currentValue;

    if (param === 'R' || param === 'Ra' || param === 'Rf' || param === 'R_half') {
      // Para resistencias
      const baseValue = currentValue * (resultUnits[param] === 'kΩ' ? 1000 : resultUnits[param] === 'MΩ' ? 1000000 : 1);
      if (newUnit === 'kΩ') newValue = baseValue / 1000;
      else if (newUnit === 'MΩ') newValue = baseValue / 1000000;
      else newValue = baseValue;
    } else if (param === 'C' || param === 'C_double') {
      // Para capacitores
      const baseValue = currentValue * (
        resultUnits[param === 'C' ? 'C' : 'C_double'] === 'µF' ? 1e-6 : 
        resultUnits[param === 'C' ? 'C' : 'C_double'] === 'nF' ? 1e-9 : 
        1e-12
      );
      if (newUnit === 'µF') newValue = baseValue * 1e6;
      else if (newUnit === 'nF') newValue = baseValue * 1e9;
      else newValue = baseValue * 1e12;
    }

    // Formatear el valor con dos decimales
    const formattedValue = formatDisplayValue(newValue);

    setResults(prevResults => {
      if (!prevResults) return prevResults;
      return {
        ...prevResults,
        displayed: {
          ...prevResults.displayed,
          [param]: formattedValue
        }
      };
    });

    setResultUnits(prevUnits => ({
      ...prevUnits,
      [param]: newUnit
    }));

    // Actualizar los valores en el esquemático con dos decimales
    updateCircuitValues(param, formattedValue, newUnit);
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
                    <div className="value-container">
                      <span className="value R-value">
                        {`${results.displayed.R} ${resultUnits.R}`}
                      </span>
                    </div>
                    <div className="value-container">
                      <span className="value C-value">
                        {`${results.displayed.C} ${resultUnits.C}`}
                      </span>
                    </div>
                    <div className="value-container">
                      <span className="value C-double-value">
                        {`${results.displayed.C_double} ${resultUnits.C_double}`}
                      </span>
                    </div>
                    <div className="value-container">
                      <span className="value R-half-value">
                        {`${results.displayed.R_half} ${resultUnits.R_half}`}
                      </span>
                    </div>
                    <div className="value-container">
                      <span className="value Rf-value">
                        {`${results.displayed.Rf} ${resultUnits.Rf}`}
                      </span>
                    </div>
                    <div className="value-container">
                      <span className="value Ra-value">
                        {`${results.displayed.Ra} ${resultUnits.Ra}`}
                      </span>
                    </div>
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
                  {capacitorMode === 'C' ? (
                    <>
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
                      <div className="result-item">
                        <span>Capacitor 2C:</span>
                        <div className="result-value-with-unit">
                          <span>{results.C_double}</span>
                          <Select
                            value={resultUnits.C_double}
                            onChange={(e) => handleResultUnitChange('C_double', e.target.value)}
                            size="small"
                            className="unit-select-small"
                          >
                            <MenuItem value="pF">pF</MenuItem>
                            <MenuItem value="nF">nF</MenuItem>
                            <MenuItem value="µF">µF</MenuItem>
                          </Select>
                        </div>
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
                      <div className="result-item">
                        <span>Resistencia R/2:</span>
                        <div className="result-value-with-unit">
                          <span>{results.R_half}</span>
                          <Select
                            value={resultUnits.R_half}
                            onChange={(e) => handleResultUnitChange('R_half', e.target.value)}
                            size="small"
                            className="unit-select-small"
                          >
                            <MenuItem value="Ω">Ω</MenuItem>
                            <MenuItem value="kΩ">kΩ</MenuItem>
                            <MenuItem value="MΩ">MΩ</MenuItem>
                          </Select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
                      <div className="result-item">
                        <span>Resistencia R/2:</span>
                        <div className="result-value-with-unit">
                          <span>{results.R_half}</span>
                          <Select
                            value={resultUnits.R_half}
                            onChange={(e) => handleResultUnitChange('R_half', e.target.value)}
                            size="small"
                            className="unit-select-small"
                          >
                            <MenuItem value="Ω">Ω</MenuItem>
                            <MenuItem value="kΩ">kΩ</MenuItem>
                            <MenuItem value="MΩ">MΩ</MenuItem>
                          </Select>
                        </div>
                      </div>
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
                      <div className="result-item">
                        <span>Capacitor 2C:</span>
                        <div className="result-value-with-unit">
                          <span>{results.C_double}</span>
                          <Select
                            value={resultUnits.C_double}
                            onChange={(e) => handleResultUnitChange('C_double', e.target.value)}
                            size="small"
                            className="unit-select-small"
                          >
                            <MenuItem value="pF">pF</MenuItem>
                            <MenuItem value="nF">nF</MenuItem>
                            <MenuItem value="µF">µF</MenuItem>
                          </Select>
                        </div>
                      </div>
                    </>
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
                    <div className="result-value-with-unit">
                      <span>{results.f1}</span>
                      <Select
                        value={units.f1}
                        onChange={(e) => handleUnitChange('f1', e.target.value)}
                        size="small"
                        className="unit-select-small"
                      >
                        <MenuItem value="Hz">Hz</MenuItem>
                        <MenuItem value="kHz">kHz</MenuItem>
                        <MenuItem value="MHz">MHz</MenuItem>
                      </Select>
                    </div>
                  </div>
                  <div className="result-item">
                    <span>f₂:</span>
                    <div className="result-value-with-unit">
                      <span>{results.f2}</span>
                      <Select
                        value={units.f2}
                        onChange={(e) => handleUnitChange('f2', e.target.value)}
                        size="small"
                        className="unit-select-small"
                      >
                        <MenuItem value="Hz">Hz</MenuItem>
                        <MenuItem value="kHz">kHz</MenuItem>
                        <MenuItem value="MHz">MHz</MenuItem>
                      </Select>
                    </div>
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
                    {"\\[H(s) = \\frac{(1 + \\frac{R_f}{R_a})(s^2 + \\frac{1}{R^2C^2})}{s^2 + \\frac{2}{RC}s + \\frac{1}{R^2C^2}}\\]"}
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