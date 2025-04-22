// Preload default assets
export const defaultAssets = {
  centerImage: '/center.jpeg',
  backgroundImage: '/background.jpeg',
  audioFile: '/music.mp3'
};

// Optional: Preload assets to ensure they're ready
export function preloadAssets() {
  const assets = [
    { type: 'image', src: defaultAssets.centerImage },
    { type: 'image', src: defaultAssets.backgroundImage },
    { type: 'audio', src: defaultAssets.audioFile }
  ];

  return Promise.all(assets.map(asset => {
    return new Promise((resolve, reject) => {
      if (asset.type === 'image') {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = asset.src;
      } else if (asset.type === 'audio') {
        const audio = new Audio();
        audio.oncanplaythrough = () => resolve(audio);
        audio.onerror = reject;
        audio.src = asset.src;
      }
    });
  }));
}

