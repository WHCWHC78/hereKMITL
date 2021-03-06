var express = require('express');
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var dateFormat = require('dateformat');
var multer = require('multer');
var fs = require('fs');
var Grid = require('gridfs-stream');
var bodyParser = require('body-parser')
var assert = require('assert');

const PORT = 80; 

var upload = multer({ dest: 'uploads/' });
var db = new mongo.Db('hereKMITL', new mongo.Server("127.0.0.1", 27017), { safe : false });
var app = express();
var gfs = Grid(db, mongo);
var appName = "Here's KMITL";


app.set('views', __dirname+'/views');
app.set('view engine', 'jade');

app.use('/assets', express.static('./assets'));
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.use(function (req, res, next) {
  console.log(dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT"));
  console.log('Requested URL: '+req.url);
  next();
})

app.get('/', function(req, res) {
    res.render('home', {
        title: 'Welcome'
    });
});

app.get('/index', function(req, res){
    res.render('layout');
});

app.get('/allDormitories', function(req, res) {
    var str = req.url.replace('/', '');

    res.render(str, {
        title: appName,
        topic: "หอพัก",
        active: str
    });
});

app.get('/allBuildings', function(req, res) {
    var str = req.url.replace('/', '');

    res.render(str, {
        title: appName,
        topic: "ตึก/อาคารเรียน",
        active: str
    });
});

//app.get('/allCafeterias', function(req, res) {
//    var str = req.url.replace('/', '');
//
//    res.render(str, {
//        title: appName,
//        topic: "ร้านอาหาร",
//        active: str
//    });
//});

app.get('/allWorkouts', function(req, res) {
    var str = req.url.replace('/', '');

    res.render(str, {
        title: appName,
        topic: "สถานที่ออกกำลังกาย",
        active: str
    });
});

app.get('/adminDB', function(req, res) {
    res.render("adminForm", {
        title: appName,
        topic: "Form"
    });
});


db.open(function (err) {
    assert.equal(null, err);

    app.post('/insert', upload.array('images'), function(req, res) {
        var form = req.body;
        var files = req.files;
        var count = 0;

        form.images = [];

        for (var i = 0, len = files.length; i < len; i++) {
            var tempfile = files[i].path;
            var origname = files[i].originalname;
            var writestream = gfs.createWriteStream({ filename: origname });
    
            fs.createReadStream(tempfile).on('end', function() {
                ++count;

                form.images.push(this._readableState.pipes.id);

                if (count == len) {
                    db.collection('documents').insertOne(form, function(err, result) {
                        assert.equal(null, err);

                        console.log('document saved');
                    });

                    res.writeHead(200, {'Refresh' : '0; url=http://archie:3000/adminDB', 'Content-type': 'text/html'});
                    res.end();
                }

              }).on('error', function() {
                ++count;

                console.log("failed saved file");

                if (count == len)
                    res.send("ERROR");

              }).pipe(writestream);
        }
    });

    app.get('/allCafeterias', function(req, res) {
        var count = 0;

        findDoc(db, function(data) {
            var out = [];

            for (var i = 0, length = data.length; i < length; i++) {
                var record = {};
                var imgs = [];

                for (var j = 0, len = data[i].images.length; j < len; j++) {
                    //console.log("len :"+ len);
                    imgs.push('http://archie/queryImg/' + data[i].images[j].valueOf());

                    //console.log(count);
                    if (j == (len - 1)) {
                        record.header = data[i].header;   
                        record.detail = data[i].detail;
                        record.time = data[i].time;
                        record.images = imgs;

                        out.push(record);

                        if (i == (length - 1)) {
                            //console.log(imgs);
                            res.render("allList", {
                                title: appName,
                                topic: "ร้านอาหาร",
                                records: out,
                            });
                        }
                    }
                }
            }
        });
    });

    app.get('/queryImg/:id', function(req, res) {
        gfs.createReadStream({ _id: ObjectId(req.params.id) }).pipe(res);
    });

    app.get('/dormitories', function(req, res) {
        var str = req.url.replace('/', '');

        findDorm(req.query.zone, db, function(data) {
            if (data) {
                res.render('dormitories', {
                    title: appName,
                    topic: req.query.zone,
                    active: str,
                    records: data
                });
            }
            else
                res.send("No the given Zone");
        });
    });
});

app.listen(PORT, function() {
    console.log("listen on Port: ", PORT);
});

function findDoc(database, callback) {
   var cursor = database.collection('documents').find();
   var data = [];

   cursor.each(function(err, doc) {
      assert.equal(err, null);

      if (doc != null) {
          data.push(doc);
          //console.log(data);
      }
      else
          callback(data);
   });
};

function findDorm(curZone, database, callback) {
    var data = [];
    var cursor = database.collection('dormitories').find({ zone: curZone });

   cursor.each(function(err, doc) {
      assert.equal(err, null);

      if (doc != null) {
          data.push(doc);
          //console.log(doc);
      }
      else if (data != undefined)
          callback(data);
      else
          callback(null);
   });
};
