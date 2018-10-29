const imagemin = require('imagemin');
const imageminJpegtran = require('imagemin-jpegtran');
const pngToJpeg = require('png-to-jpeg');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

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
        console.log("Optimizing file....", params, ' .... Start!');
        
        let plugins =  [];
        if(data.ContentType == 'image/jpeg') {
            plugins =  [
                imageminJpegtran({ progressive: true })
            ];
        } else if(data.ContentType == 'image/png') {
            plugins =  [
                pngToJpeg({quality: 90}),
                imageminJpegtran({ progressive: true })
            ];
        }
            imagemin.buffer(data.Body,{
                plugins: plugins,
                use:[pngToJpeg({quality: 90}), imageminJpegtran({ progressive: true })]
            }).then(function(files){
                prevOperations.push({Bucket: params.Bucket, Key: params.Key});
                console.log("Optimizing file....", params, ' .... done!');
                params.Body = files;//minified_data;
                s3.putObject(params, function(err){
                    //console.log("file write, ",err);
                });
            });
    });
};
