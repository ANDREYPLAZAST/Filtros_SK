import React from 'react';

export const FilterDescription = () => {
  return (
    <div className="filter-description">
      <h3>Parámetros del Filtro</h3>
      <div className="parameter">
        <h4>Frecuencia central (fo):</h4>
        <p>Frecuencia de máxima ganancia del filtro.</p>
      </div>
      <div className="parameter">
        <h4>Ancho de banda (BW):</h4>
        <p>Rango de frecuencias donde la ganancia es mayor que -3dB.</p>
      </div>
      <div className="parameter">
        <h4>Ganancia (dB):</h4>
        <p>Amplificación máxima en la frecuencia central.</p>
      </div>
      <div className="parameter">
        <h4>Capacitor (C):</h4>
        <p>Valor del capacitor usado en el circuito.</p>
      </div>

      <div className="equations">
        <h3>Ecuaciones del Filtro</h3>
        <div className="equation">H(s) = (s/ωo) / (s²/ωo² + s/(Qωo) + 1)</div>
        <div className="equation">Q = fo/BW</div>
        <div className="equation">ωo = 2πfo</div>
      </div>
    </div>
  );
}; 