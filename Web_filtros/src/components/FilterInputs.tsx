import React from 'react';
import { TextField, Button } from '@mui/material';

interface FilterInputsProps {
  inputs: any;
  units: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUnitChange: (unit: string) => void;
  onCalculate: () => void;
}

export const FilterInputs = ({ inputs, units, onInputChange, onUnitChange, onCalculate }: FilterInputsProps) => {
  return (
    <div className="filter-inputs">
      <h3>Parámetros de Entrada</h3>
      
      <div className="input-group">
        <div className="input-field">
          <TextField
            label="Frecuencia central"
            name="fo"
            value={inputs.fo}
            onChange={onInputChange}
          />
          <Button onClick={() => onUnitChange('fo')}>{units.fo}</Button>
        </div>

        <div className="input-field">
          <TextField
            label="Ancho de banda"
            name="bw"
            value={inputs.bw}
            onChange={onInputChange}
          />
          <Button onClick={() => onUnitChange('bw')}>{units.bw}</Button>
        </div>

        <div className="input-field">
          <TextField
            label="Ganancia (dB)"
            name="gain"
            value={inputs.gain}
            onChange={onInputChange}
          />
        </div>

        <div className="input-field">
          <TextField
            label="Capacitor"
            name="capacitor"
            value={inputs.capacitor}
            onChange={onInputChange}
          />
          <Button onClick={() => onUnitChange('capacitor')}>{units.capacitor}</Button>
        </div>
      </div>

      <Button className="calculate-button" onClick={onCalculate}>
        CALCULAR
      </Button>
    </div>
  );
}; 