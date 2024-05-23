const faceapi = require('face-api.js');
const path = require('path');
const canvas = require('canvas');

async function loadLabeledDescriptors() {
  const labels = ['face0', 'face1', 'face2', 'face3', 'face4', 'face5', 'face6', 'face7', 'face8', 'face9'];
  return Promise.all(
    labels.map(async label => {
      const descriptors = [];
      const imgPath = path.join(__dirname, 'images', `${label}.jpg`);
      const img = await canvas.loadImage(imgPath);
      const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
      if (detections) {
        descriptors.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptors);
    })
  );
}

module.exports = { loadLabeledDescriptors };
