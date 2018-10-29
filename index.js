const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const imageminPngquant = require('imagemin-pngquant');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const fs = require('fs');

var prevOperations = [];

exports.handler = function(event, context){
let flag = false;
var srcBucket = event.Records[0].s3.bucket.name;
// Object key may have spaces or unicode non-ASCII characters.
var srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

var params = {Bucket: srcBucket, Key: srcKey};
for(let i=0, j=prevOperations.length; i<j; i++){
if(prevOperations[i].Bucket == params.Bucket && prevOperations[i].Key==params.Key){
flag = true;
prevOperations.splice(i,1);
break;
}
}
if(flag){
return 0;
}

s3.getObject(params, function(err, data){
//fs.writeFileSync(srcKey, data);
//imagemin([array of file paths], destination folder, OPTIONS).then(function(){});
//console.log("minified, file data....", data);
console.log("Optimizing file....", params, ' .... Start!');
imagemin.buffer(data.Body,{
plugins: [
imageminJpegtran(),
imageminPngquant({quality: '65-80'})
],
use:[imageminJpegtran(), imageminPngquant({quality: '65-80'})]
}).then(function(files){
//var minified_data = fs.readFileSycn(srcKey);
//console.log("and files is ..", files);
prevOperations.push({Bucket: params.Bucket, Key: params.Key});
console.log("Optimizing file....", params, ' .... done!');
params.Body = files;//minified_data;
s3.putObject(params, function(err){
//console.log("file write, ",err);
});
// console.log(files);
//=> [{data: <Buffer 89 50 4e …>, path: 'build/images/foo.jpg'}, …]
});
});
};
