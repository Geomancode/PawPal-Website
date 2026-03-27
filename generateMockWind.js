const fs = require('fs');

const nx = 180;
const ny = 91;
const lo1 = 0;
const la1 = 90;
const dx = 2;
const dy = 2;

const uData = [];
const vData = [];

for (let j = 0; j < ny; j++) {
  const lat = la1 - j * dy;
  for (let i = 0; i < nx; i++) {
    const lon = lo1 + i * dx;
    
    // Create some interesting wind patterns
    // Global westerlies/easterlies pattern based on latitude
    const latRad = (lat * Math.PI) / 180;
    const lonRad = (lon * Math.PI) / 180;
    
    // Zonal (u) component: Strong westerlies in mid-lats, weak easterlies in tropics
    let u = Math.cos(latRad * 3) * 15;
    
    // Meridional (v) component: Rossby wave-like pattern
    let v = Math.sin(lonRad * 4) * Math.cos(latRad) * 8;
    
    // Add some noise/swirls
    u += Math.sin(latRad * 5 + lonRad * 2) * 4;
    v += Math.cos(latRad * 3 + lonRad * 4) * 4;

    uData.push(u);
    vData.push(v);
  }
}

const windField = [
  {
    header: {
      parameterCategory: 2,
      parameterNumber: 2,
      nx, ny, lo1, la1, dx, dy,
    },
    data: uData
  },
  {
    header: {
      parameterCategory: 2,
      parameterNumber: 3,
      nx, ny, lo1, la1, dx, dy,
    },
    data: vData
  }
];

fs.writeFileSync('./public/wind.json', JSON.stringify(windField));
console.log('Mock wind data generated at ./public/wind.json');
