
var fs = require('fs');
var Client = require('ftp');

var express = require('express');
var bodyParser = require('body-parser');
var app = express()
var path = require('path');
var multer  = require('multer')
var upload = multer({ dest: 'public/uploads' })

var Audio_Convertor_API_Key = 'HnBR-hyyLqIp3l4X91E9f37OU3yiAs5-703Qdw5L-BWVFx5PRiV-h2SucqTlesHR-U-U9OloRzQLVteLvqP9FQ';
var cloudconvert = new (require('cloudconvert'))(Audio_Convertor_API_Key);


app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname + '/index.html'))
});

app.post('/', upload.array('audiofile'), function(req, res) {

  console.log('loading...');

  for(i in req.files) {
    audioText(req.files[i].originalname, req.files[i].path, res)
  };

  res.sendFile(path.join(__dirname + '/sent.html'));

});

var port = process.env.PORT || 8080;

app.listen(port, function() {
  console.log(`Server running at ${port}`);
});

// Imports the Google Cloud client library

const Storage = require('@google-cloud/storage');

const storage = Storage({
  keyFilename: './Speech to text-a1bab6669ed5.json'
});

var bucket;

function audioText(fileName, filePath, res) {

  bucket = storage.bucket('audio-tests');
  var ext = fileName.substr(fileName.lastIndexOf(".")+1);
  var fileName = fileName.substr(0,fileName.lastIndexOf("."));
  var file = bucket.file(`${fileName}.flac`);
  var newFilePath = `./audio/${fileName}.flac`

  console.log(filePath);
  //
  // fs.rename(filePath, `${filePath}.${ext}`, function(err) {})
  //
  // // fs.createReadStream(`${filePath}.${ext}`)
  // // .pipe(cloudconvert.convert({
  // //   "inputformat": ext,
  // //   "outputformat": "flac",
  // //   "input": "upload",
  // //   "converteroptions": {
  // //     "audio_frequency": "16000",
  // //     "audio_channels": "1"
  // //   }
  // // }))
  // // .pipe(
  // fs.createWriteStream(newFilePath)
  // .on('finish', function() {
  //   console.log('getting text');
  //    fs.unlink(`${filePath}.${ext}`, function(err) {});
      readStream(fileName, filePath, file, res);
  // });
}

function runScript(fileName, filePath, file, res) {

  var fileExt = `${fileName}.flac`;

  var gcsUri = `gs://audio-tests/${fileExt}`;

  // Makes an authenticated API request.
  storage
    .getBuckets()
    .then((results) => {
      const buckets = results[0];

    })
    .catch((err) => {
      console.log("error at storage")
      console.error('ERROR:', err);
    });


  const speech = require('@google-cloud/speech');

  // Your Google Cloud Platform project ID
  const projectId = 'speech-to-text-197120';

  // Creates a client
  const client = new speech.SpeechClient({
    projectId: projectId,
  });

  const encoding = 'FLAC';
  const sampleRateHertz = 16000;
  const languageCode = 'en-US';

  const config = {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
  };

  const audio = {
      uri: gcsUri,
    };

  const request = {
    config: config,
    audio: audio,
  };

  // Detects speech in the audio file
  client
    .longRunningRecognize(request)
    .then(data => {
    const operation = data[0];
    // Get a Promise representation of the final result of the job
    return operation.promise();
    })
    .then(data => {
      const response = data[0];

      var transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
      console.log(`Transcription: `, transcription);
      var fileName = fileExt.slice(0, - 5);
      var percent = response.results[0].alternatives[0].confidence * 100;
      percent = percent.toFixed(1) + "%";
      transcription = `\nTranscription: ${transcription} \n\nConfidence Level: ${percent}`
      var transcriptFile = `./transcript outputs/${fileName}.txt`
      fs.writeFile(transcriptFile, transcription, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("The file was saved!");
      });
      file.delete(function(err, apiResponse) {});
      var txt = bucket.file(`${fileName}.txt`);
      fs.createReadStream(transcriptFile)
        .pipe(txt.createWriteStream())
        .on('error', function(err) {})
        .on('finish', function() {
          console.log('on google cloud')
          res.end('<p>done</p>')
      })
      fs.unlink(filePath, function(err) {});
    })
    .catch(err => {
      console.log('error at client');
      console.error('ERROR:', err);
    });
}

function readStream(fileName, filePath, file, res) {
  console.log('readstream');
  fs.createReadStream(filePath)
    .pipe(file.createWriteStream())
    .on('error', function(err) {})
    .on('finish', function() {

      runScript(fileName, filePath, file, res);

    });
  }
