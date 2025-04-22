import { visualizerConfig } from './config.js';
import { drawSpectrumStyle } from './spectrum-styles.js';

// Drawing functions exported for use in main.js
export function getColor(i, total, theme, value, sensitivity) {
  const normalizedValue = value / 255;
  const adjustedValue = Math.min(255, value * sensitivity);
  
  switch(theme) {
    case "rainbow":
      return `hsl(${(i / total * 360)}, 80%, ${50 + normalizedValue * 30}%)`;
    case "pulse":
      return `rgb(${adjustedValue}, ${50 + adjustedValue/3}, ${200 - adjustedValue/2})`;
    case "neon":
      return `rgb(${80 + adjustedValue/2}, ${200}, ${100 + adjustedValue/2})`;
    case "fire":
      return `rgb(${200 + adjustedValue/4}, ${adjustedValue/2}, ${adjustedValue/8})`;
    case "ocean":
      return `rgb(${adjustedValue/8}, ${100 + adjustedValue/3}, ${180 + adjustedValue/4})`;
    default:
      return `rgb(${adjustedValue}, 50, 200)`;
  }
}

// Visual type drawing functions
export function drawBars(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity) {
  const barWidth = (canvas.width / bufferLength) * 2.5;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i] * sensitivity;
    const color = getColor(i, bufferLength, colorTheme, dataArray[i], sensitivity);
    
    ctx.fillStyle = color;
    ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    
    // Add a glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    
    x += barWidth + 1;
  }
  ctx.shadowBlur = 0;
}

export function drawCircle(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const baseRadius = Math.min(canvas.width, canvas.height) / 4;
  
  // Draw multiple rings based on frequency data
  for (let i = 0; i < bufferLength; i += 5) {
    const amplitude = dataArray[i] * sensitivity;
    const radius = baseRadius + (amplitude / 5);
    const color = getColor(i, bufferLength, colorTheme, dataArray[i], sensitivity);
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * (i / bufferLength + 0.2), 0, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add glow effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = color;
  }
  
  // Center pulse
  const avgAmplitude = Array.from(dataArray).slice(0, 10).reduce((a, b) => a + b, 0) / 10;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius * (avgAmplitude / 100), 0, 2 * Math.PI);
  const centerColor = getColor(0, bufferLength, colorTheme, avgAmplitude, sensitivity);
  ctx.fillStyle = centerColor;
  ctx.fill();
  
  ctx.shadowBlur = 0;
}

export function drawVertical(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity) {
  const barHeight = (canvas.height / bufferLength) * 2;
  let y = 0;
  
  for (let i = 0; i < bufferLength; i++) {
    const barWidth = dataArray[i] * sensitivity;
    const color = getColor(i, bufferLength, colorTheme, dataArray[i], sensitivity);
    
    ctx.fillStyle = color;
    ctx.fillRect(canvas.width - barWidth, y, barWidth, barHeight);
    
    // Add a glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    
    y += barHeight + 1;
  }
  ctx.shadowBlur = 0;
}

export function drawWave(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity) {
  ctx.beginPath();
  
  const sliceWidth = canvas.width / bufferLength;
  let x = 0;
  
  ctx.moveTo(0, canvas.height / 2);
  
  for (let i = 0; i < bufferLength; i++) {
    const v = dataArray[i] / 128.0 * sensitivity;
    const y = (v * canvas.height / 2);
    
    ctx.lineTo(x, y);
    x += sliceWidth;
  }
  
  // Complete the wave by drawing to the bottom right then back to origin
  ctx.lineTo(canvas.width, canvas.height / 2);
  
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, getColor(0, bufferLength, colorTheme, dataArray[0], sensitivity));
  gradient.addColorStop(0.33, getColor(Math.floor(bufferLength/3), bufferLength, colorTheme, dataArray[Math.floor(bufferLength/3)], sensitivity));
  gradient.addColorStop(0.66, getColor(Math.floor(bufferLength*2/3), bufferLength, colorTheme, dataArray[Math.floor(bufferLength*2/3)], sensitivity));
  gradient.addColorStop(1, getColor(bufferLength-1, bufferLength, colorTheme, dataArray[bufferLength-1], sensitivity));
  
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Add glow effect
  ctx.shadowBlur = 15;
  ctx.shadowColor = getColor(Math.floor(bufferLength/2), bufferLength, colorTheme, dataArray[Math.floor(bufferLength/2)], sensitivity);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

export function drawParticles(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, particles) {
  // Get the average frequency data for overall intensity
  const avg = Array.from(dataArray).reduce((a, b) => a + b, 0) / bufferLength;
  const intensity = avg * sensitivity;
  
  particles.forEach((particle, index) => {
    // Update particle position based on audio intensity
    const freqIndex = Math.floor(index % bufferLength);
    const freqValue = dataArray[freqIndex];
    
    // Move particles based on their angle and audio level
    particle.x += Math.cos(particle.angle) * particle.speed * (freqValue / 50) * sensitivity;
    particle.y += Math.sin(particle.angle) * particle.speed * (freqValue / 50) * sensitivity;
    
    // Bounce off edges
    if (particle.x < 0 || particle.x > canvas.width) {
      particle.angle = Math.PI - particle.angle;
    }
    if (particle.y < 0 || particle.y > canvas.height) {
      particle.angle = -particle.angle;
    }
    
    // Draw the particle
    const size = particle.size + (freqValue / 30) * sensitivity;
    const color = getColor(freqIndex, bufferLength, colorTheme, freqValue, sensitivity);
    
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
    ctx.fillStyle = color;
    
    // Add glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    
    ctx.fill();
  });
  
  ctx.shadowBlur = 0;
}

export function drawSpectrum(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, centerImage, spectrumStyle) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const baseRadius = Math.min(canvas.width, canvas.height) / 3;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSpectrumStyle(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, centerImage, spectrumStyle, centerX, centerY, baseRadius);
  
  // Keep center image drawing logic here if needed by all styles
  if (centerImage && centerImage.complete) {
    const avg = Array.from(dataArray).reduce((a, b) => a + b, 0) / bufferLength;
    const size = baseRadius * 0.6 * (avg/255 * sensitivity + 0.5);
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(centerImage, centerX - size, centerY - size, size * 2, size * 2);
    ctx.restore();
  }
}
