const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('ffmpeg');
const port = 8200

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/',(req,res)=>
{
    res.render('videoUpload');
})


// Multer Configuration
var Storage = multer.diskStorage({
    destination:'videos',
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+path.extname(file.originalname))
    }
})

const FileFilter = (req, file, cb) => {
    if (file.mimetype == 'video/mp4') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const vUpload = multer({ storage: Storage, fileFilter: FileFilter }).single('video');

app.post('/videoupload', vUpload, (req, res) => {
    var pathToFile = req.file.path;
    var pathToThumbnail = path.join(__dirname, '/capture/', `vd-capture-${Date.now()}.png`);

    var width = parseInt(req.body.width);
   

    console.log("width : " + width);
    try {
        var process = new ffmpeg(pathToFile);
        process.then(function (video) {

            video.addCommand('-ss', '00:00:08.000')
            video.addCommand('-vframes', '1')

            video.save(pathToThumbnail, function (error, file) {
                if (!error) {
                 
                    try {
                        sharp(pathToThumbnail)
                        .resize({ fit: sharp.fit.contain, width: width })
                        .toFile('thumbnail-images/' + 'vd-thumbnail-' + Date.now() + ".jpeg", (err, resizeImage) => {
                            if (err) {
                                console.log(err);
                                return res.status(501).json({
                                    message: 'Video thumbnail failed',
                                    data: err
                                });
                            } else {
                                console.log("Video thumbnail successfully :: ");
                                return res.status(201).json({
                                    message: 'Video thumbnail successfully'
                                });
                            }
                        })

                    } catch (error) {
                        console.error(error);
                    }
                }
                else {
                    return res.status(501).json({
                        message: 'Video thumbnail failed'
                    });
                }
            });
        }, function (err) {
            console.log('Error: ' + err);
        });
    } catch (e) {
        console.log(e.code);
        console.log(e.msg);
    }

})


//start server
app.listen(port, () => console.log('video-thumbnail server running on ', port))