import { useState } from 'react';
import { 
  Paper, 
  Typography, 
  TextField, 
  Button,
  Grid,
  InputAdornment,
  Box
} from '@mui/material';
import circuitImage from '../assets/pasa-banda-circuit.png';
import '../styles/PasaBandaFilter.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface FilterResults {
  R: number;
  nR: number;
  Rf: number;
  Ra: number;
  Q: number;
  fo: number;
  bw: number;
  capacitor: number;
  wo: number;
  wc1: number;
  wc2: number;
  fc1: number;
  fc2: number;
}

interface UnitState {
  fo: 'Hz' | 'kHz';
  bw: 'Hz' | 'kHz';
  capacitor: 'nF' | 'pF';
}

export const PasaBandaFilter = () => {
  const [inputs, setInputs] = useState({
    fo: '1000',
    bw: '20000',
    gain: '10',
    capacitor: '10'
  });

  const [units, setUnits] = useState<UnitState>({
    fo: 'Hz',
    bw: 'Hz',
    capacitor: 'nF'
  });

  const [results, setResults] = useState<FilterResults | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setInputs(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleUnitChange = (name: keyof UnitState) => {
    setUnits(prev => {
      const newUnits = { ...prev };
      if (name === 'fo' || name === 'bw') {
        newUnits[name] = prev[name] === 'Hz' ? 'kHz' : 'Hz';
        // Convertir el valor
        const value = Number(inputs[name]);
        setInputs(prevInputs => ({
          ...prevInputs,
          [name]: prev[name] === 'Hz' ? 
            (value / 1000).toString() : 
            (value * 1000).toString()
        }));
      } else if (name === 'capacitor') {
        newUnits.capacitor = prev.capacitor === 'nF' ? 'pF' : 'nF';
        const value = Number(inputs.capacitor);
        setInputs(prevInputs => ({
          ...prevInputs,
          capacitor: prev.capacitor === 'nF' ? 
            (value * 1000).toString() : 
            (value / 1000).toString()
        }));
      }
      return newUnits;
    });
  };

  const calculateFilter = () => {
    // Convertir valores de entrada
    const fo = Number(inputs.fo);      // Frecuencia central
    const bw = Number(inputs.bw);      // Ancho de banda
    const gainDB = Number(inputs.gain); // Ganancia en dB
    const C = Number(inputs.capacitor) * 1e-9; // Capacitor en Faradios

    // 1. Calcular parámetros básicos
    const wo = 2 * Math.PI * fo;  // Frecuencia angular central
    const Q = fo / bw;            // Factor de calidad
    const A = Math.pow(10, gainDB/20);  // Ganancia en veces (no dB)

    // 2. Calcular n usando la ecuación cuadrática
    const termB = 2 - Math.pow(A + 1, 2)/(2 * Q * Q);
    const discriminant = termB * termB - 4;
    const n1 = (-termB + Math.sqrt(discriminant)) / 2;
    const n2 = (-termB - Math.sqrt(discriminant)) / 2;
    const n = n1 > 1 ? n1 : n2;  // Seleccionar n > 1

    // 3. Calcular R y nR
    const R = Math.sqrt(2/n) / (C * wo);
    const nR = n * R;

    // 4. Calcular Rf/Ra
    const RfRa = 2 * n + 1 - Math.sqrt(2*n)/Q;
    const Ra = 1000;  // 1kΩ como en el ejemplo
    const Rf = RfRa * Ra;

    // 5. Calcular frecuencias de corte
    const termComun = Math.sqrt(1/(4*Q*Q) + 1);
    const wc1 = wo * (termComun - 1/(2*Q));  // rad/s
    const wc2 = wo * (termComun + 1/(2*Q));  // rad/s
    
    // Convertir a Hz
    const fc1 = wc1 / (2 * Math.PI);
    const fc2 = wc2 / (2 * Math.PI);

    console.log({
      // Entrada
      fo,
      bw,
      gainDB,
      C: C.toExponential(),
      
      // Cálculos intermedios
      wo: wo.toFixed(2),
      Q: Q.toFixed(4),
      A: A.toFixed(4),
      termB: termB.toFixed(4),
      n: n.toFixed(4),
      
      // Resistencias
      R: R.toFixed(2),
      nR: (nR/1e6).toFixed(2) + ' MΩ',
      RfRa: RfRa.toFixed(2),
      Rf: (Rf/1e3).toFixed(2) + ' kΩ',
      
      // Frecuencias
      wc1: wc1.toFixed(2) + ' rad/s',
      wc2: wc2.toFixed(2) + ' rad/s',
      fc1: fc1.toFixed(2) + ' Hz',
      fc2: (fc2/1e3).toFixed(3) + ' kHz'
    });

    setResults({
      R,
      nR,
      Rf,
      Ra,
      Q,
      fo,
      bw,
      capacitor: C,
      wo,
      wc1,
      wc2,
      fc1,
      fc2
    });
  };

  const generateTransferFunction = (results: FilterResults) => {
    if (!results) return '';

    try {
      const wo = results.wo;
      const Q = results.Q;
      const gain = results.Rf/results.Ra;  // Ganancia del filtro

      // Formatear números para mejor visualización
      const gainFormatted = gain.toFixed(2);
      const woFormatted = (wo/(2*Math.PI)).toFixed(1);
      const QFormatted = Q.toFixed(3);

      // Construir la función de transferencia según el paper
      return {
        equation: `H(s) = \\frac{1}{nR}(1 + \\frac{R_f}{R_a})s`,
        denominator: `s^2 + \\frac{1}{nR}(2 + \\frac{1}{n}(1-\\frac{R_f}{R_a}))s + \\frac{1}{nR^2C^2}`,
        values: {
          gain: gainFormatted,
          fo: woFormatted,
          Q: QFormatted
        }
      };
    } catch (error) {
      console.error('Error generando función de transferencia:', error);
      return {
        equation: '',
        denominator: '',
        values: {
          gain: '0',
          fo: '0',
          Q: '0'
        }
      };
    }
  };

  const generateBodeData = () => {
    const points = [];
    const fo = Number(inputs.fo);
    const startFreq = fo / 100;
    const endFreq = fo * 100;
    
    for (let f = startFreq; f <= endFreq; f *= 1.1) {
      const w = 2 * Math.PI * f;
      const wo = 2 * Math.PI * fo;
      const Q = fo / Number(inputs.bw);
      const gain = Number(inputs.gain);
      
      // Cálculo de magnitud en dB
      const num = w/wo;
      const den = Math.sqrt(Math.pow(1 - Math.pow(w/wo, 2), 2) + Math.pow(w/(Q*wo), 2));
      const magDb = 20 * Math.log10(gain * num/den);
      
      points.push({
        freq: f,
        magnitude: magDb
      });
    }
    return points;
  };

  return (
    <div className="filter-container">
      <Paper className="input-paper">
        <Typography className="section-title">
          Parámetros de Entrada
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                label="Frecuencia central"
                name="fo"
                value={inputs.fo}
                onChange={handleInputChange}
                variant="outlined"
                className="cyber-input"
                sx={{ 
                  input: { color: '#ffffff' },
                  backgroundColor: 'rgba(0,0,0,0.3)'
                }}
              />
              <Button
                onClick={() => handleUnitChange('fo')}
                variant="outlined"
                sx={{
                  color: '#00ff9d',
                  borderColor: '#00ff9d',
                  minWidth: '60px',
                  height: '56px'
                }}
              >
                {units.fo}
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                label="Ancho de banda"
                name="bw"
                value={inputs.bw}
                onChange={handleInputChange}
                variant="outlined"
                className="cyber-input"
                sx={{ 
                  input: { color: '#ffffff' },
                  backgroundColor: 'rgba(0,0,0,0.3)'
                }}
              />
              <Button
                onClick={() => handleUnitChange('bw')}
                variant="outlined"
                sx={{
                  color: '#00ff9d',
                  borderColor: '#00ff9d',
                  minWidth: '60px',
                  height: '56px'
                }}
              >
                {units.bw}
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ganancia (dB)"
              name="gain"
              value={inputs.gain}
              onChange={handleInputChange}
              variant="outlined"
              className="cyber-input"
              sx={{ 
                input: { color: '#ffffff' },
                backgroundColor: 'rgba(0,0,0,0.3)'
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                fullWidth
                label="Capacitor"
                name="capacitor"
                value={inputs.capacitor}
                onChange={handleInputChange}
                variant="outlined"
                className="cyber-input"
                sx={{ 
                  input: { color: '#ffffff' },
                  backgroundColor: 'rgba(0,0,0,0.3)'
                }}
              />
              <Button
                onClick={() => handleUnitChange('capacitor')}
                variant="outlined"
                sx={{
                  color: '#00ff9d',
                  borderColor: '#00ff9d',
                  minWidth: '60px',
                  height: '56px'
                }}
              >
                {units.capacitor}
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Button 
          variant="contained" 
          fullWidth 
          onClick={calculateFilter}
          className="calculate-button"
        >
          CALCULAR
        </Button>
      </Paper>

      {results && (
        <Paper className="results-paper">
          <Typography className="section-title">
            Resultados del Filtro
          </Typography>

          <Box className="circuit-container">
            <img 
              src={circuitImage} 
              alt="Circuito Pasa Banda"
              className="circuit-image"
            />
            
            <Typography className="circuit-value value-nr-top">
              nR = {results.nR.toLocaleString()} Ω
            </Typography>
            <Typography className="circuit-value value-nr-left">
              nR= {results.nR.toLocaleString()} Ω
            </Typography>
            <Typography className="circuit-value value-c">
              C = {inputs.capacitor} nF
            </Typography>
            <Typography className="circuit-value value-r">
              R = {results.R.toLocaleString()} Ω
            </Typography>
            <Typography className="circuit-value value-rf">
              Rf = {results.Rf.toLocaleString()} Ω
            </Typography>
            <Typography className="circuit-value value-ra">
              Ra = {results.Ra.toLocaleString()} Ω
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ color: '#00ff9d', mb: 1 }}>
                Resistencias:
              </Typography>
              <Typography sx={{ color: 'white', ml: 2 }}>
                R = {results.R.toLocaleString()} Ω
              </Typography>
              <Typography sx={{ color: 'white', ml: 2 }}>
                nR = {results.nR.toLocaleString()} Ω
              </Typography>
              <Typography sx={{ color: 'white', ml: 2 }}>
                Rf = {results.Rf.toLocaleString()} Ω
              </Typography>
              <Typography sx={{ color: 'white', ml: 2 }}>
                Ra = {results.Ra.toLocaleString()} Ω
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography sx={{ color: '#00ff9d', mb: 1 }}>
                Parámetros del filtro:
              </Typography>
              <Typography sx={{ color: 'white', ml: 2 }}>
                • Factor Q = {results.Q}
              </Typography>
              <Typography sx={{ color: 'white', ml: 2 }}>
                Frecuencia de corte inferior = {results.fc1.toLocaleString()} Hz
              </Typography>
              <Typography sx={{ color: 'white', ml: 2 }}>
                Frecuencia de corte superior = {results.fc2.toLocaleString()} Hz
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography sx={{ color: '#00ff9d', mb: 1 }}>
                Notas:
              </Typography>
              <Typography sx={{ color: 'white', ml: 2 }}>
                • El factor Q determina la selectividad del filtro
              </Typography>
              <Typography sx={{ color: 'white', ml: 2 }}>
                • Las frecuencias de corte están a -3dB de la ganancia máxima
              </Typography>
              <Typography sx={{ color: 'white', ml: 2 }}>
                • Ancho de banda = {(results.fc2 - results.fc1).toLocaleString()} Hz
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {results && (
        <Paper className="transfer-function-paper">
          <Typography className="section-title">
            Función de Transferencia y Diagrama de Bode
          </Typography>
          
          <Box className="transfer-function">
            <Typography className="math-equation">
              {generateTransferFunction(results).equation}
            </Typography>
          </Box>
          
          <Box className="bode-plot">
            <LineChart
              width={600}
              height={300}
              data={generateBodeData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="freq"
                type="number"
                scale="log"
                domain={['auto', 'auto']}
                tickFormatter={(value) => `${value.toFixed(0)} Hz`}
              />
              <YAxis
                domain={[-40, 20]}
                tickFormatter={(value) => `${value.toFixed(0)} dB`}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="magnitude"
                stroke="#00ff9d"
                dot={false}
              />
            </LineChart>
          </Box>
        </Paper>
      )}
    </div>
  );
}; 