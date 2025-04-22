import { visualizerConfig } from './config.js';

export function initImageGeneration(visualizer, updateCenterImage) {
  const promptInput = document.getElementById('image-prompt');
  const generateBtns = document.querySelectorAll('.generate-btn');

  generateBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const prompt = promptInput.value.trim();
      const imageType = btn.dataset.type;
      
      if (!prompt) {
        alert('Please enter an image description');
        return;
      }

      try {
        btn.disabled = true;
        btn.textContent = 'Generating...';
        
        const result = await websim.imageGen({
          prompt: `${prompt} - ${imageType === 'background' ? 'wide aspect ratio' : 'centered circular logo style'}`,
          aspect_ratio: imageType === 'background' ? '16:9' : '1:1'
        });

        const img = new Image();
        img.onload = () => {
          if (imageType === 'background') {
            visualizer.style.backgroundImage = `url(${result.url})`;
          } else {
            updateCenterImage(img);
          }
          btn.textContent = `Generate ${imageType}`;
          btn.disabled = false;
        };
        img.src = result.url;
      } catch (error) {
        console.error('Image generation failed:', error);
        alert('Failed to generate image');
        btn.textContent = `Generate ${imageType}`;
        btn.disabled = false;
      }
    });
  });
}

