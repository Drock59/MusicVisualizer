import { getColor } from './visualizer.js';

export function drawSpectrumStyle(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, centerImage, style, centerX, centerY, baseRadius) {
  switch(style) {
    case 'transparent':
      return drawTransparentSpectrum(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius);
    case 'rings':
      return drawRings(ctx, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius);
    case 'spikes':
      return drawSpikes(ctx, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius);
    case 'polygon':
      return drawPolygon(ctx, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius);
    case 'spiked-polygon':
      return drawSpikedPolygon(ctx, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius);
    case 'multi-waves':
      return drawMultiWaves(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius);
    case 'layered-waves':
      return drawLayeredWaves(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius);
    default:
      return drawDefaultSpectrum(ctx, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius);
  }
}

function drawTransparentSpectrum(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius) {
  const waveCount = 3;
  const maxRadius = baseRadius * 1.5;
  ctx.globalAlpha = 1;

  for (let wave = 0; wave < waveCount; wave++) {
    const waveRadius = baseRadius * 0.6 + (wave * (maxRadius - baseRadius) / waveCount);
    const points = [];
    
    for (let i = 0; i < bufferLength; i++) {
      const amplitude = dataArray[i] * sensitivity;
      const radius = waveRadius + (amplitude / 2);
      const angle = (Math.PI * 2 * i) / bufferLength;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.closePath();

    const gradient = ctx.createLinearGradient(
      centerX - waveRadius, centerY - waveRadius,
      centerX + waveRadius, centerY + waveRadius
    );
    gradient.addColorStop(0, getColor(wave * 40, bufferLength, colorTheme, 150, sensitivity));
    gradient.addColorStop(1, getColor(wave * 40 + 100, bufferLength, colorTheme, 200, sensitivity));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.1;
    ctx.fill();
  }
  
  ctx.globalAlpha = 1;
}

function drawRings(ctx, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius) {
  for (let i = 0; i < 5; i++) {
    const ringSize = baseRadius * 0.3 + (dataArray[i * 10] / 255 * baseRadius * 0.7);
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringSize, 0, Math.PI * 2);
    ctx.strokeStyle = getColor(i * 20, bufferLength, colorTheme, dataArray[i * 20], sensitivity);
    ctx.lineWidth = 2 + (dataArray[i * 10] / 255 * 4);
    ctx.stroke();
  }
}

function drawSpikes(ctx, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius) {
  const spikeCount = 128;
  const angleStep = (Math.PI * 2) / spikeCount;
  for (let i = 0; i < spikeCount; i++) {
    const amplitude = dataArray[i % bufferLength] * sensitivity;
    const spikeLength = baseRadius * 0.3 + (amplitude / 255 * baseRadius * 0.7);
    const angle = angleStep * i;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * spikeLength,
      centerY + Math.sin(angle) * spikeLength
    );
    ctx.strokeStyle = getColor(i, spikeCount, colorTheme, amplitude, sensitivity);
    ctx.lineWidth = 2 + (amplitude / 255 * 4);
    ctx.stroke();
  }
}

function drawPolygon(ctx, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius) {
  const sides = 8;
  const polyAngleStep = (Math.PI * 2) / sides;
  
  const polygonPoints = [];
  for (let i = 0; i < sides; i++) {
    const amplitude = dataArray[Math.floor(i * (bufferLength/sides))] * sensitivity;
    const radius = baseRadius * 0.4 + (amplitude / 255 * baseRadius * 0.6);
    const angle = polyAngleStep * i;
    polygonPoints.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }
  
  ctx.beginPath();
  ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
  polygonPoints.forEach(point => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fillStyle = getColor(0, bufferLength, colorTheme, dataArray[0], sensitivity);
  ctx.globalAlpha = 0.3;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = getColor(bufferLength-1, bufferLength, colorTheme, dataArray[bufferLength-1], sensitivity);
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSpikedPolygon(ctx, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius) {
  const sides = 8;
  const spikeCount = sides * 4; 
  const polyAngleStep = (Math.PI * 2) / sides;
  const spikeAngleStep = polyAngleStep / 4;

  const polygonPoints = [];
  for (let i = 0; i < sides; i++) {
    const amplitude = dataArray[Math.floor(i * (bufferLength/sides))] * sensitivity;
    const adjustedRadius = baseRadius * 0.4 + (amplitude / 255 * baseRadius * 0.6); 
    const angle = polyAngleStep * i;
    polygonPoints.push({
      x: centerX + Math.cos(angle) * adjustedRadius,
      y: centerY + Math.sin(angle) * adjustedRadius
    });
  }

  ctx.beginPath();
  ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
  polygonPoints.forEach(point => ctx.lineTo(point.x, point.y));
  ctx.closePath();
  ctx.fillStyle = getColor(0, bufferLength, colorTheme, dataArray[0], sensitivity);
  ctx.globalAlpha = 0.2;
  ctx.fill();
  ctx.globalAlpha = 1;

  for (let i = 0; i < sides; i++) {
    const basePoint = polygonPoints[i];
    const nextPoint = polygonPoints[(i + 1) % sides];

    for (let j = 0; j < 4; j++) {
      const spikeIndex = i * 4 + j;
      const amplitude = dataArray[spikeIndex % bufferLength] * sensitivity;
      const spikeLength = baseRadius * 0.3 + (amplitude / 255 * baseRadius * 0.7);
      const baseAngle = polyAngleStep * i + spikeAngleStep * j;
      
      ctx.beginPath();
      ctx.moveTo(basePoint.x, basePoint.y);
      ctx.lineTo(
        basePoint.x + Math.cos(baseAngle) * spikeLength,
        basePoint.y + Math.sin(baseAngle) * spikeLength
      );
      ctx.strokeStyle = getColor(spikeIndex, spikeCount, colorTheme, amplitude, sensitivity);
      ctx.lineWidth = 2 + (amplitude / 255 * 4);
      ctx.stroke();
    }
  }
}

function drawMultiWaves(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius) {
  const waveCount = 3; // Number of concentric waves
  const maxRadius = baseRadius * 1.5;
  
  for (let wave = 0; wave < waveCount; wave++) {
    const waveRadius = baseRadius * 0.6 + (wave * (maxRadius - baseRadius) / waveCount);
    const points = [];
    const freqOffset = wave * Math.floor(bufferLength / waveCount);
    
    for (let i = 0; i < bufferLength; i++) {
      const amplitude = dataArray[(i + freqOffset) % bufferLength] * sensitivity;
      const radius = waveRadius + (amplitude / 2);
      const angle = (Math.PI * 2 * i) / bufferLength;
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      });
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length; i++) {
      const currentPoint = points[i];
      const nextPoint = points[(i + 1) % points.length];
      
      ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, (currentPoint.x + nextPoint.x) / 2, (currentPoint.y + nextPoint.y) / 2);
    }

    const gradient = ctx.createLinearGradient(
      centerX - waveRadius, centerY - waveRadius,
      centerX + waveRadius, centerY + waveRadius
    );
    gradient.addColorStop(0, getColor(wave * 40, bufferLength, colorTheme, 150, sensitivity));
    gradient.addColorStop(1, getColor(wave * 40 + 100, bufferLength, colorTheme, 200, sensitivity));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2 + (wave * 2);
    ctx.stroke();
    
    ctx.shadowBlur = 15 + (wave * 5);
    ctx.shadowColor = getColor(wave * 50, bufferLength, colorTheme, 200, sensitivity);
  }
  
  ctx.shadowBlur = 0;
}

function drawLayeredWaves(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius) {
  const waveCount = 4;
  const maxRadius = baseRadius * 1.8;
  
  for (let wave = 0; wave < waveCount; wave++) {
    const waveRadius = baseRadius * 0.8 + (wave * (maxRadius - baseRadius) / waveCount);
    const points = [];
    const freqOffset = wave * Math.floor(bufferLength / waveCount);
    const phaseShift = (performance.now() * 0.001) * (wave + 1);
    
    for (let i = 0; i < bufferLength; i++) {
      const amplitude = dataArray[(i + freqOffset) % bufferLength] * sensitivity;
      const modulatedRadius = waveRadius + (amplitude / 2 * Math.sin(phaseShift + i * 0.1));
      const angle = (Math.PI * 2 * i) / bufferLength;
      
      points.push({
        x: centerX + Math.cos(angle) * modulatedRadius,
        y: centerY + Math.sin(angle) * modulatedRadius
      });
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 0; i < points.length; i++) {
      const current = points[i];
      const next = points[(i + 1) % points.length];
      const cpX = (current.x + next.x) / 2;
      const cpY = (current.y + next.y) / 2;
      ctx.quadraticCurveTo(current.x, current.y, cpX, cpY);
    }

    const gradient = ctx.createLinearGradient(
      centerX - waveRadius, centerY - waveRadius,
      centerX + waveRadius, centerY + waveRadius
    );
    gradient.addColorStop(0, getColor(wave * 40, bufferLength, colorTheme, 150, sensitivity));
    gradient.addColorStop(1, getColor(wave * 40 + 100, bufferLength, colorTheme, 200, sensitivity));

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2 + (wave * 1.5);
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    ctx.shadowBlur = 20 + (wave * 5);
    ctx.shadowColor = gradient;
  }
  
  ctx.shadowBlur = 0;
}

function drawDefaultSpectrum(ctx, dataArray, bufferLength, colorTheme, sensitivity, centerX, centerY, baseRadius) {
  const points = [];
  const angleStep = (Math.PI * 2) / bufferLength;
  
  for (let i = 0; i < bufferLength; i++) {
    const amplitude = dataArray[i] * sensitivity;
    const radius = baseRadius + (amplitude / 2);
    const angle = angleStep * i;
    
    points.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius
    });
  }
  
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  
  for (let i = 0; i < points.length; i++) {
    const currentPoint = points[i];
    const nextPoint = points[(i + 1) % points.length];
    
    const nextPointIdx = (i + 1) % points.length;
    const prevPointIdx = (i - 1 + points.length) % points.length;
    
    const cp1x = (points[i].x + points[nextPointIdx].x) / 2;
    const cp1y = (points[i].y + points[nextPointIdx].y) / 2;
    
    ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, cp1x, cp1y);
  }
  
  ctx.closePath();
  
  const gradient = ctx.createRadialGradient(
    centerX, centerY, baseRadius * 0.5,
    centerX, centerY, baseRadius * 1.5
  );
  gradient.addColorStop(0, getColor(0, bufferLength, colorTheme, dataArray[0], sensitivity));
  gradient.addColorStop(1, getColor(bufferLength-1, bufferLength, colorTheme, dataArray[bufferLength-1], sensitivity));

  ctx.fillStyle = gradient;
  ctx.fill();
}