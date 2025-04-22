import { defaultAssets } from './preload.js';

export const visualizerConfig = {
  // Default settings
  defaultVisualType: "spectrum",
  defaultSpectrumStyle: "multi-waves",
  defaultColorTheme: "rainbow",
  defaultSensitivity: 1.0,
  
  // Audio settings
  fftSize: 512,
  
  // Visual settings
  particleCount: 100,

  // Default assets
  defaultCenterImage: defaultAssets.centerImage,
  defaultBackgroundImage: defaultAssets.backgroundImage,
  defaultAudioFile: defaultAssets.audioFile,

  // Modify to auto-play default audio
  autoPlayDefaultAudio: false 
};