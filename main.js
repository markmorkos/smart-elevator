const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const tf = require('@tensorflow/tfjs-node');
const canvas = require('canvas'); // Исправление для импорта Canvas
const { Canvas, Image, ImageData } = canvas; // Получение Canvas, Image и ImageData из пакета 'canvas'
const faceapi = require("face-api.js");

// Расширяем Node.js environment для face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Загрузка моделей face-api.js
async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk("./models");
  await faceapi.nets.faceLandmark68Net.loadFromDisk("./models");
  await faceapi.nets.faceRecognitionNet.loadFromDisk("./models");
}
loadModels();

app.get("/photo", async (req, res) => {
    const imagePath = path.join(__dirname, 'images', 'example.jpg');
    
    const imageBuffer = fs.readFileSync(imagePath);
    const decodedImage = tf.node.decodeImage(imageBuffer, 3);
  
    try {
      const detections = await faceapi.detectAllFaces(decodedImage)
        .withFaceLandmarks()
        .withFaceDescriptors();
    
      if (detections.length > 0) {
        res.send(`Лицо обнаружено: ${detections.length}`);
      } else {
        res.send("Лицо не обнаружено");
      }
    } catch (error) {
      console.error(error);
      res.status(500).send('Ошибка при обработке изображения');
    }
  
    decodedImage.dispose();
  });
  

app.listen(3000, () => {
  console.log("Сервер запущен на http://localhost:3000");
});
