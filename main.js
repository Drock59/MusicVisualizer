import { visualizerConfig } from './config.js';
import { preloadAssets } from './preload.js';
import * as visualizerFunctions from './visualizer.js';
import { defaultAssets } from './preload.js';
import { initImageGeneration } from './image-gen.js';

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Music Visualizer Test - Successfully Loaded!");

  // Get current user info
  const room = new WebsimSocket();
  const tempRecord = await room.collection('tempUser').create({});
  const currentUsername = tempRecord.username;
  const clientId = tempRecord.id;
  await room.collection('tempUser').delete(tempRecord.id);

  // Initialize WebsimSocket
  const timeEntries = room.collection('timeEntry');

  // Preload assets before initializing
  try {
    await preloadAssets();
  } catch (error) {
    console.error('Asset preloading failed:', error);
  }

  // Time tracking functionality
  let lastUpdate = Date.now();
  let timeSpentInterval;

  // Track time spent in the app
  async function trackTimeSpent() {
    const currentTime = Date.now();
    const deltaSeconds = Math.floor((currentTime - lastUpdate) / 1000);
    lastUpdate = currentTime;

    if(deltaSeconds <= 0) return;

    try {
      // Find existing entry by username
      const existing = await timeEntries.filter({ username: currentUsername }).getList();
      
      if(existing.length > 0) {
        // Update with real delta time
        await timeEntries.update(existing[0].id, {
          timeSpent: existing[0].timeSpent + deltaSeconds
        });
      } else {
        await timeEntries.create({
          timeSpent: deltaSeconds,
          clientId,
          username: currentUsername
        });
      }
    } catch(error) {
      console.error('Time tracking failed:', error);
    }
  }

  // Update leaderboard UI with realtime data
  function updateLeaderboardUI(entries) {
    const leaderboardElement = document.getElementById('time-leaderboard');
    
    // Aggregate entries by username
    const userMap = new Map();
    entries.forEach(entry => {
      if (userMap.has(entry.username)) {
        userMap.get(entry.username).timeSpent += entry.timeSpent;
      } else {
        userMap.set(entry.username, {...entry});
      }
    });

    const sorted = Array.from(userMap.values()).sort((a, b) => b.timeSpent - a.timeSpent);
    
    leaderboardElement.innerHTML = `
      <div class="leaderboard-header">
        <div class="leaderboard-title">Live Leaderboard</div>
        <svg class="chevron" viewBox="0 0 24 24">
          <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
        </svg>
      </div>
      <div class="leaderboard-entries">
        ${sorted.slice(0, 10).map((entry, index) => `
          <div class="leaderboard-entry ${entry.username === currentUsername ? 'current-user' : ''}">
            <img src="https://images.websim.ai/avatar/${encodeURIComponent(entry.username)}" 
                 class="user-avatar" 
                 alt="${entry.username}'s avatar">
            <span class="rank">${index + 1}</span>
            <span class="username">${entry.username}</span>
            <span class="time">${formatTime(entry.timeSpent)}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Toggle visibility
    leaderboardElement.querySelector('.leaderboard-header').addEventListener('click', () => {
      leaderboardElement.classList.toggle('expanded');
    });
  }

  const fileInput = document.getElementById("file-input");
  const visualizer = document.getElementById("visualizer");
  const visualTypeSelect = document.getElementById("visual-type");
  const colorThemeSelect = document.getElementById("color-theme");
  const sensitivitySlider = document.getElementById("sensitivity");
  const nowPlaying = document.getElementById("now-playing");
  const audioControls = document.querySelector(".audio-controls");
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const backgroundUpload = document.getElementById("background-upload");
  const centerImageUpload = document.getElementById("center-image-upload");
  const centerImageGroup = document.getElementById("center-image-group");

  let audioContext, analyser, source, audioData, bufferLength, dataArray;
  let canvas, ctx;
  let currentAudio = null;
  let particles = [];
  let sensitivity = 1;
  let centerImage = null;

  // Preload and set default background
  const defaultBackground = new Image();
  defaultBackground.onload = () => {
    visualizer.style.backgroundImage = `url(${defaultAssets.backgroundImage})`;
  };
  defaultBackground.src = defaultAssets.backgroundImage;

  // Preload and set default center image
  centerImage = new Image();
  centerImage.onload = () => {
    // Optional: You might want to trigger a redraw or update
  };
  centerImage.src = defaultAssets.centerImage;
  let currentCenterImage = centerImage; // Keep reference to current center image

  const startOverlay = document.createElement('div');
  startOverlay.style.cssText = `
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #3498db, #9b59b6);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-size: 1rem;
    font-weight: 500;
    color: white;
    cursor: pointer;
    z-index: 100;
    border-radius: 16px;
    padding: 12px 20px;
    width: fit-content;
    height: fit-content;
    margin: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    border: none;
  `;
  startOverlay.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 24px; height: 24px;">
      <path d="M19 16a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3z"></path>
      <path d="M12 5v14"></path>
      <path d="M9 8h6"></path>
    </svg>
    <span style="background: linear-gradient(90deg, #fff, #fff); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">Click to start audio</span>
  `;
  visualizer.appendChild(startOverlay);

  let audioStarted = false;
  visualizer.addEventListener('click', () => {
    if (!audioStarted) {
      startOverlay.remove();
      audioStarted = true;
      playAudio(defaultAssets.audioFile);
      nowPlaying.textContent = `Now playing: Default Track`;
    }
  }, { once: true });

  // Set default selected options based on config
  visualTypeSelect.value = visualizerConfig.defaultVisualType;
  document.getElementById("spectrum-style").value = visualizerConfig.defaultSpectrumStyle;
  document.getElementById("color-theme").value = visualizerConfig.defaultColorTheme;

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (currentAudio) {
      currentAudio.pause();
      // Disconnect existing audio nodes
      if (currentAudio.sourceNode) {
        currentAudio.sourceNode.disconnect();
      }
      currentAudio.remove();
      audioControls.innerHTML = '';
    }

    const url = URL.createObjectURL(file);
    nowPlaying.textContent = `Now playing: ${file.name}`;
    playAudio(url);
  });

  visualTypeSelect.addEventListener("change", () => {
    if (visualTypeSelect.value === "spectrum") {
      centerImageGroup.style.display = "block";
      document.getElementById('spectrum-style-group').style.display = 'block';
    } else {
      centerImageGroup.style.display = "none";
      document.getElementById('spectrum-style-group').style.display = 'none';
    }
    if (canvas) {
      // Reset certain visualizations that need cleanup
      if (visualTypeSelect.value === "particles") {
        resetParticles();
      }
    }
  });

  sensitivitySlider.addEventListener("input", () => {
    sensitivity = parseFloat(sensitivitySlider.value);
  });

  fullscreenBtn.addEventListener("click", toggleFullscreen);
  document.addEventListener("fullscreenchange", handleFullscreenChange);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      visualizer.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  function handleFullscreenChange() {
    fullscreenBtn.classList.toggle("active", !!document.fullscreenElement);
    
    // Update canvas size when entering/exiting fullscreen
    if (canvas) {
      canvas.width = visualizer.clientWidth;
      canvas.height = visualizer.clientHeight;
      
      if (visualTypeSelect.value === "particles") {
        resetParticles();
      }
    }
  }

  function playAudio(url) {
    if (currentAudio) {
      currentAudio.pause();
      // Disconnect existing audio nodes
      if (currentAudio.sourceNode) {
        currentAudio.sourceNode.disconnect();
      }
      currentAudio.remove();
      audioControls.innerHTML = '';
    }

    const audio = new Audio();
    audio.src = url;
    audio.controls = true;

    // Add repeat button to audio controls
    const repeatBtn = document.createElement('button');
    repeatBtn.id = 'repeat-btn';
    repeatBtn.classList.add('audio-btn');
    repeatBtn.title = 'Repeat';
    repeatBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 2l4 4-4 4"></path>
        <path d="M3 11v-1a4 4 0 0 1 4-4h14"></path>
        <path d="M7 22l-4-4 4-4"></path>
        <path d="M21 13v1a4 4 0 0 1-4 4H3"></path>
      </svg>
    `;

    let repeatEnabled = false;
    repeatBtn.addEventListener('click', () => {
      repeatEnabled = !repeatEnabled;
      repeatBtn.classList.toggle('active', repeatEnabled);
      audio.loop = repeatEnabled;
    });

    const audioButtonsContainer = document.createElement('div');
    audioButtonsContainer.classList.add('audio-buttons');
    audioButtonsContainer.appendChild(repeatBtn);

    audioControls.innerHTML = '';
    audioControls.appendChild(audioButtonsContainer);
    
    audio.controls = true;
    audioControls.appendChild(audio);
    currentAudio = audio;

    audio.loop = repeatEnabled;

    audio.addEventListener("play", () => {
      if (!audioContext) {
        setupAudioContext(audio);
      } else {
        // Only create new source if none exists for this audio element
        if (!audio.sourceNode) {
          audio.sourceNode = audioContext.createMediaElementSource(audio);
          audio.sourceNode.connect(analyser);
          analyser.connect(audioContext.destination);
        }
      }
      
      drawVisualization();
    });

    audio.play();
  }

  function setupAudioContext(audio) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    
    // Create new media element source each time
    audio.sourceNode = audioContext.createMediaElementSource(audio);
    audio.sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
    
    analyser.fftSize = 512;
    const audioData = createAudioData(analyser);
    bufferLength = audioData.bufferLength;
    dataArray = audioData.array;

    setupCanvas();
    initParticles();
  }

  function setupCanvas() {
    if (canvas) {
      visualizer.removeChild(canvas);
    }
    
    canvas = document.createElement("canvas");
    canvas.width = visualizer.clientWidth;
    canvas.height = visualizer.clientHeight;
    ctx = canvas.getContext("2d");
    visualizer.appendChild(canvas);

    // Handle window resize
    window.addEventListener("resize", () => {
      canvas.width = visualizer.clientWidth;
      canvas.height = visualizer.clientHeight;
      
      if (visualTypeSelect.value === "particles") {
        resetParticles();
      }
    });
  }

  function drawVisualization() {
    requestAnimationFrame(drawVisualization);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const visualType = visualTypeSelect.value;
    const colorTheme = colorThemeSelect.value;
    const spectrumStyle = document.getElementById("spectrum-style").value;
    
    switch (visualType) {
      case "bars":
        visualizerFunctions.drawBars(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity);
        break;
      case "circle":
        visualizerFunctions.drawCircle(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity);
        break;
      case "vertical":
        visualizerFunctions.drawVertical(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity);
        break;
      case "wave":
        visualizerFunctions.drawWave(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity);
        break;
      case "particles":
        visualizerFunctions.drawParticles(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, particles);
        break;
      case "transparent":
        visualizerFunctions.drawTransparent(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity);
        break;
      case "spectrum":
        visualizerFunctions.drawSpectrum(ctx, canvas, dataArray, bufferLength, colorTheme, sensitivity, currentCenterImage, spectrumStyle);
        break;
    }
  }

  function initParticles() {
    particles = [];
    const particleCount = 100;
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 5 + 1,
        speed: Math.random() * 3 + 1,
        angle: Math.random() * Math.PI * 2
      });
    }
  }

  function resetParticles() {
    initParticles();
  }

  // Helper function to format time
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }

  initImageGeneration(visualizer, (newImage) => {
    currentCenterImage = newImage;
  });

  if (visualTypeSelect.value === "spectrum") {
    centerImageGroup.style.display = "block";
    document.getElementById('spectrum-style-group').style.display = 'block';
  } else {
    centerImageGroup.style.display = "none";
    document.getElementById('spectrum-style-group').style.display = 'none';
  }

  // Start tracking time
  timeSpentInterval = setInterval(trackTimeSpent, 1000); // Update every 1 second

  // Replace localStorage leaderboard with realtime updates
  const unsubscribe = timeEntries.subscribe(updateLeaderboardUI);
  
  // Expand leaderboard by default
  document.getElementById('time-leaderboard').classList.add('expanded');

  // Clear interval and unsubscribe on unmount
  window.addEventListener('beforeunload', () => {
    clearInterval(timeSpentInterval);
    unsubscribe();
    trackTimeSpent(); // Final update
  });
});

function createAudioData(analyser) {
  return {
    bufferLength: analyser.frequencyBinCount,
    array: new Uint8Array(analyser.frequencyBinCount)
  };
}