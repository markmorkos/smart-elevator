const faceapi = require('face-api.js');
const path = require('path');
const canvas = require('canvas');

async function loadLabeledDescriptors() {
  const labels = ['face_0', 'face_1', 'face_2', 'face_3', 'face_4', 'face_5', 'face_6'];
  return Promise.all(
    labels.map(async label => {
      const descriptors = [];
      const imgPath = path.join(__dirname, 'images', `${label}.jpeg`);
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
