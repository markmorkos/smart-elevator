const express = require('express');
const path = require('path');
const { get } = require('request');
const faceapi = require('face-api.js');
const multer = require('multer');
const fs = require('fs');
const canvas = require('canvas');
const { loadLabeledDescriptors } = require('./labeledDescriptors');
const cors = require('cors'); // Импортируем cors

const app = express();

// Используем cors middleware
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const viewsDir = path.join(__dirname, 'views');
app.use(express.static(viewsDir));
app.use(express.static(path.join(__dirname, './public')));
app.use(express.static(path.join(__dirname, '../images')));
app.use(express.static(path.join(__dirname, '../media')));
app.use(express.static(path.join(__dirname, '../../weights')));
app.use(express.static(path.join(__dirname, '../../dist')));

app.get('/', (req, res) => res.redirect('/face_detection'));
app.get('/face_detection', (req, res) => res.sendFile(path.join(viewsDir, 'faceDetection.html')));
app.get('/face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'faceLandmarkDetection.html')));
app.get('/face_expression_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'faceExpressionRecognition.html')));
app.get('/age_and_gender_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'ageAndGenderRecognition.html')));
app.get('/face_extraction', (req, res) => res.sendFile(path.join(viewsDir, 'faceExtraction.html')));
app.get('/face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'faceRecognition.html')));
app.get('/video_face_tracking', (req, res) => res.sendFile(path.join(viewsDir, 'videoFaceTracking.html')));
app.get('/webcam_face_detection', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceDetection.html')));
app.get('/webcam_face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceLandmarkDetection.html')));
app.get('/webcam_face_expression_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceExpressionRecognition.html')));
app.get('/webcam_age_and_gender_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'webcamAgeAndGenderRecognition.html')));
app.get('/bbt_face_landmark_detection', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceLandmarkDetection.html')));
app.get('/bbt_face_similarity', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceSimilarity.html')));
app.get('/bbt_face_matching', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceMatching.html')));
app.get('/bbt_face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'bbtFaceRecognition.html')));
app.get('/batch_face_landmarks', (req, res) => res.sendFile(path.join(viewsDir, 'batchFaceLandmarks.html')));
app.get('/batch_face_recognition', (req, res) => res.sendFile(path.join(viewsDir, 'batchFaceRecognition.html')));

app.post('/fetch_external_image', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).send('imageUrl param required');
  }
  try {
    const externalResponse = await request(imageUrl);
    res.set('content-type', externalResponse.headers['content-type']);
    return res.status(202).send(Buffer.from(externalResponse.body));
  } catch (err) {
    return res.status(404).send(err.toString());
  }
});

////////////////////////////////////////////////////////////////////////
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(viewsDir));
app.use(express.static(path.join(__dirname, './public')));

app.get('/', (req, res) => res.redirect('/face_detection'));
app.get('/face_detection', (req, res) => res.sendFile(path.join(viewsDir, 'faceDetection.html')));
app.get('/check_server', (req, res) => {
  res.send('Сервер жив');
});

const MODEL_URL = path.join(__dirname, 'models');
async function initialize() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_URL);
  console.log('Модели загружены');

  const labeledFaceDescriptors = await loadLabeledDescriptors();

  app.post('/upload', upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).send('Файл изображения обязателен');
      }

      const imgPath = req.file.path;
      const img = await canvas.loadImage(imgPath);

      const detections = await faceapi.detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceDescriptors();

      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);
      const results = detections.map(d => faceMatcher.findBestMatch(d.descriptor));

      // Удаление временного файла изображения
      fs.unlinkSync(imgPath);

      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).send('Ошибка сервера');
    }
  });
}
////////////////////////////////////////////////////////////////////////

app.listen(3000, () => console.log('Listening on port 3000!'));
initialize();

function request(url, returnBuffer = true, timeout = 10000) {
  return new Promise(function(resolve, reject) {
    const options = Object.assign(
      {},
      {
        url,
        isBuffer: true,
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
        }
      },
      returnBuffer ? { encoding: null } : {}
    );

    get(options, function(err, res) {
      if (err) return reject(err);
      return resolve(res);
    });
  });
}
