import { visualizerConfig } from './config.js';

export function createAudioContext(audioElement) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const sourceNode = audioContext.createMediaElementSource(audioElement);
    
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = visualizerConfig.fftSize;
    
    return {
        audioContext: audioContext,
        analyser,
        sourceNode
    };
}

export function createAudioElement(url) {
    const audio = new Audio();
    audio.src = url;
    audio.controls = true;
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    return audio;
}

export function createAudioData(analyser) {
    const bufferLength = analyser.frequencyBinCount;
    return {
        array: new Uint8Array(bufferLength),
        bufferLength
    };
}

