import React, { useState, useEffect } from 'react';
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
import circuitImageBasic from '../assets/PASABANDA.png';
import circuitImageWithValues from '../assets/PASABANDA2.png';

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
const calcularFuncionTransferencia = (n: number, R: number, C: number, Rf: number, Ra: number) => {
  // Log inicial para verificar las unidades
  console.log('Valores de entrada:', {
    n,
    R: `${R} ohms`,
    C: `${C} F`,
    Rf: `${Rf} ohms`,
    Ra: `${Ra} ohms`
  });

  // Calcular numerador
  const coef_num = 1/(n*R*C);
  const ganancia = 1 + Rf/Ra;
  const numerador_final = coef_num * ganancia;

  // Calcular denominador
  const coef_s = (1/(R*C)) * (2 + (1/n) * (1 - Rf/Ra));
  const termino_independiente = 2/(n * R * R * C * C);

  // Log de cálculos intermedios
  console.log('Cálculos:', {
    numerador: {
      coef_1_nRC: coef_num,
      ganancia_RfRa: ganancia,
      resultado: numerador_final
    },
    denominador: {
      coef_s,
      termino_independiente
    }
  });

  // Formatear la función de transferencia
  const numerador = `${numerador_final.toFixed(3)}s`;
  const denominador = `s^2 + ${coef_s.toFixed(3)}s + ${termino_independiente.toFixed(3)}`;

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

interface Results {
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
    nR: string;
    Rf: string;
    Ra: string;
    C: string;
  };
}

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

  const [results, setResults] = useState<Results | null>(null);

  const [showResults, setShowResults] = useState(false);

  const [calculationMode, setCalculationMode] = useState('BW'); // 'BW' o 'FC'
  const [capacitorMode, setCapacitorMode] = useState('C');  // 'C' o 'R'
  const [resistanceMode, setResistanceMode] = useState('Ra'); // 'Ra' o 'Rf'

  const [resultUnits, setResultUnits] = useState({
    R: 'Ω',
    Ra: 'Ω',
    Rf: 'Ω',
    nR: 'Ω',
    C: 'nF'
  });

  const [darkMode] = useState(false);

  const resetValues = () => {
    setResults(null);
    setShowResults(false);
    // Reiniciar las unidades a sus valores por defecto
    setResultUnits({
      R: 'Ω',
      Ra: 'Ω',
      Rf: 'Ω',
      nR: 'Ω',
      C: 'nF'
    });
  };

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

  const formatNumber = (num: number): string => {
    return Number(num).toFixed(2);
  };

  const calculateValues = () => {
    try {
      // Convertir frecuencia a Hz y calcular BW
      let fo = parseFloat(inputs.fo) * (units.fo === 'kHz' ? 1000 : units.fo === 'MHz' ? 1000000 : 1);
      let BW, f1, f2;  // Declarar f1 y f2 aquí
      
      if (calculationMode === 'BW') {
        BW = parseFloat(inputs.BW) * (units.BW === 'kHz' ? 1000 : units.BW === 'MHz' ? 1000000 : 1);
        // Calcular f1 y f2 a partir de fo y BW
        const Q = fo / BW;
        f1 = fo * (Math.sqrt(1 + 1/(4*Q*Q)) - 1/(2*Q));
        f2 = fo * (Math.sqrt(1 + 1/(4*Q*Q)) + 1/(2*Q));
      } else {
        // Modo frecuencias de corte
        f1 = parseFloat(inputs.f1) * (units.f1 === 'kHz' ? 1000 : units.f1 === 'MHz' ? 1000000 : 1);
        f2 = parseFloat(inputs.f2) * (units.f2 === 'kHz' ? 1000 : units.f2 === 'MHz' ? 1000000 : 1);
        // Calcular fo y BW a partir de f1 y f2
        fo = Math.sqrt(f1 * f2);
        BW = f2 - f1;
      }

      const wo = 2 * Math.PI * fo;
      const Q = fo / BW;

      // Ganancia en dB a lineal
      const A_db = parseFloat(inputs.A);
      const A = Math.pow(10, A_db/20);

      // Cálculo de n
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
        const relation = (2 * n + 1) - (Math.sqrt(2 * n) / Q);
        Rf = Ra * relation;
        
        console.log('Modo Ra - Cálculos:', {
          Ra_input: Ra,
          n: n,
          Q: Q,
          relation: relation,
          formula: `${Ra} * (2 * ${n} + 1 - sqrt(2 * ${n})/${Q})`,
          Rf_calculado: Rf
        });
      } else {
        Rf = parseFloat(inputs.Rf) * (units.Rf === 'kΩ' ? 1000 : 1);
        const relation = (2 * n + 1) - (Math.sqrt(2 * n) / Q);
        Ra = Rf / relation;
        console.log('Modo Rf - Cálculos:', {
          Rf_input: Rf,
          n: n,
          Q: Q,
          relation: relation,
          formula: `${Rf} / (2 * ${n} + 1 - sqrt(2 * ${n})/${Q})`,
          Ra_calculado: Ra
        });
      }
      // Calcular nR
      const nR = n * R;

      // Convertir todas las resistencias a ohms y capacitor a faradios
      const R_ohms = R;  // Ya está en ohms
      const nR_ohms = nR;  // Ya está en ohms
      const Rf_ohms = Rf;  // Ya está en ohms
      const Ra_ohms = Ra;  // Ya está en ohms
      const C_farads = C;  // Ya está en faradios

      console.log('Valores antes de calcular H(s):', {
        n,
        R_ohms,
        C_farads,
        Rf_ohms,
        Ra_ohms
      });

      const { numerador, denominador, coeficientes } = calcularFuncionTransferencia(
        n,
        R_ohms,
        C_farads,
        Rf_ohms,
        Ra_ohms
      );

      // Actualizar las unidades por defecto a ohms
      setResultUnits({
        R: 'Ω',
        nR: 'Ω',
        Rf: 'Ω',
        Ra: 'Ω',
        C: 'nF'
      });

      // Formatear los valores iniciales
      const results: Results = {
        n: formatNumber(n),
        Q: formatNumber(Q),
        R: formatNumber(R_ohms),
        C: formatNumber(C_farads),
        Rf: formatNumber(Rf_ohms),
        Ra: formatNumber(Ra_ohms),
        fo: formatNumber(fo/1000) + ' kHz',
        BW: formatNumber(BW/1000) + ' kHz',
        f1: formatNumber(f1/1000) + ' kHz',
        f2: formatNumber(f2/1000) + ' kHz',
        nR: formatNumber(nR_ohms),
        bodeData: [],
        numerador: numerador,
        denominador: denominador,
        coeficientes: {
          num: coeficientes.num,
          den_s: coeficientes.den_s,
          den_ind: coeficientes.den_ind
        },
        displayed: {
          R: formatNumber(R_ohms),
          nR: formatNumber(nR_ohms),
          Rf: formatNumber(Rf_ohms),
          Ra: formatNumber(Ra_ohms),
          C: formatNumber(convertCapacitanceUnit(C_farads, 'F', 'nF'))
        }
      };

      // Log final para verificar los valores
      console.log('Relación final Rf/Ra:', {
        Rf: Rf,
        Ra: Ra,
        relation: Rf/Ra,
        mode: resistanceMode
      });

      setResults(results);
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
      // Reiniciar valores antes de calcular
      resetValues();
      
      const calculatedResults = calculateValues();
      setResults({...calculatedResults, bodeData: []});
      
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
    // Convertir todo a la unidad base (ohms o faradios)
    let baseValue = value;
    
    // Convertir a unidad base
    if (fromUnit.includes('k')) baseValue *= 1000;
    if (fromUnit.includes('M')) baseValue *= 1000000;
    if (fromUnit === 'nF') baseValue *= 1e-9;
    if (fromUnit === 'pF') baseValue *= 1e-12;
    if (fromUnit === 'µF') baseValue *= 1e-6;

    // Convertir de unidad base a unidad destino
    let result = baseValue;
    if (toUnit.includes('k')) result /= 1000;
    if (toUnit.includes('M')) result /= 1000000;
    if (toUnit === 'nF') result /= 1e-9;
    if (toUnit === 'pF') result /= 1e-12;
    if (toUnit === 'µF') result /= 1e-6;

    return result.toString();
  };

  const handleResultUnitChange = (param: keyof Results, newUnit: string) => {
    if (!results) return;

    // Obtener el valor original en ohms
    let baseValue: number;
    let currentUnit: string;
    
    // Obtener el valor y la unidad actual
    switch(param) {
      case 'R':
      case 'Rf':
      case 'Ra':
      case 'nR':
        // Usar el valor base que ya está en ohms
        baseValue = parseFloat(results[param]);
        currentUnit = resultUnits[param];
        break;
      case 'C':
        baseValue = parseFloat(results[param]);
        currentUnit = resultUnits.C;
        break;
      default:
        return;
    }

    // Convertir de la unidad base a la nueva unidad
    let convertedValue: number;
    if (param === 'C') {
      if (newUnit === 'µF') convertedValue = baseValue * 1e6;
      else if (newUnit === 'nF') convertedValue = baseValue * 1e9;
      else if (newUnit === 'pF') convertedValue = baseValue * 1e12;
      else convertedValue = baseValue;
    } else {
      // Para resistencias
      if (newUnit === 'kΩ') convertedValue = baseValue / 1000;
      else if (newUnit === 'MΩ') convertedValue = baseValue / 1000000;
      else convertedValue = baseValue; // Para Ω
    }

    // Actualizar las unidades
    setResultUnits(prev => ({
      ...prev,
      [param]: newUnit
    }));

    // Actualizar tanto el valor mostrado como el valor original
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

  // Actualizar la función que muestra los valores en el circuito
  const updateCircuitValues = (param: string, value: string, unit: string) => {
    const circuitValues = document.querySelectorAll('.circuit-values .value');
    circuitValues.forEach(element => {
      if (element.classList.contains(`${param.toLowerCase()}-value`)) {
        element.textContent = `${value} ${unit}`;
      }
    });
  };

  // Actualizar la función que formatea los valores iniciales
  const formatInitialValue = (value: number, type: 'R' | 'C'): { value: string, unit: string } => {
    if (type === 'R') {
      if (value >= 1000000) {
        return { value: formatNumber(value/1000000), unit: 'MΩ' };
      } else if (value >= 1000) {
        return { value: formatNumber(value/1000), unit: 'kΩ' };
      }
      return { value: formatNumber(value), unit: 'Ω' };
    } else {
      if (value <= 1e-9) {
        return { value: formatNumber(value*1e12), unit: 'pF' };
      } else if (value <= 1e-6) {
        return { value: formatNumber(value*1e9), unit: 'nF' };
      }
      return { value: formatNumber(value*1e6), unit: 'µF' };
    }
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
                    <span className="value nR-top-value">
                      {`${results.displayed.nR} ${resultUnits.nR}`}
                    </span>
                    <span className="value nR-left-value">
                      {`${results.displayed.nR} ${resultUnits.nR}`}
                    </span>
                    <span className="value C-left-value">
                      {`${results.displayed.C} ${resultUnits.C}`}
                    </span>
                    <span className="value C-center-value">
                      {`${results.displayed.C} ${resultUnits.C}`}
                    </span>
                    <span className="value R-value">
                      {`${results.displayed.R} ${resultUnits.R}`}
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
                    <span>Factor n:</span>
                    <span>{results.n}</span>
                  </div>
                  <div className="result-item">
                    <span>Resistencia nR:</span>
                    <div className="result-value-with-unit">
                      <span>{results.displayed.nR}</span>
                      <Select
                        value={resultUnits.nR}
                        onChange={(e) => handleResultUnitChange('nR', e.target.value)}
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
                      <span>Resistencia R:</span>
                      <div className="result-value-with-unit">
                        <span>{results.displayed.R}</span>
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
                  ) : (
                    <div className="result-item">
                      <span>Capacitor C:</span>
                      <div className="result-value-with-unit">
                        <span>{results.displayed.C}</span>
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
                  )}
                  {resistanceMode === 'Ra' ? (
                    <div className="result-item">
                      <span>Resistencia Rf:</span>
                      <div className="result-value-with-unit">
                        <span>{results.displayed.Rf}</span>
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
                        <span>{results.displayed.Ra}</span>
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