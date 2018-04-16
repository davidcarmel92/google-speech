var Audio_Convertor_API_Key = 'HnBR-hyyLqIp3l4X91E9f37OU3yiAs5-703Qdw5L-BWVFx5PRiV-h2SucqTlesHR-U-U9OloRzQLVteLvqP9FQ';


var fs = require('fs');
var cloudconvert = new (require('cloudconvert'))(Audio_Convertor_API_Key);

function convertor() {
  fs.createReadStream('/Users/david.carmel/Desktop/media1.m4a')
  .pipe(cloudconvert.convert({
      "inputformat": "m4a",
      "outputformat": "flac",
      "input": "upload",
      "converteroptions": {
        "audio_frequency": "16000",
        "audio_channels": "1"
      }
    }))
    .pipe(fs.createWriteStream('outputfile.flac'))
    .on('finish', function() {
      console.log('done');
    });
  }

convertor();
