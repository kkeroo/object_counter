const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');
var compression = require('compression');
const express = require("express");
var cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');

const PORT = process.env.PORT || 4000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use(compression());
app.use(cors());
// app.use(cors({origin: true, credentials: true}));

// using https on production server
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https")
      res.redirect(`https://${req.header("host")}${req.url}`);
    else next();
  });
}

app.use(express.static(path.join(__dirname, 'client', 'build')));

app.use("/", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  next();
});
// app.use((req, res, next) => {
//   res.sendFile(path.join(__dirname, "client", "build", "index.html"));
// });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploaded_images/');
  },
  filename: (req, file, cb) => {
    console.log(file);
    // cb(null, file.fieldname + '-' + Date.now() + '.jpg');
    cb(null, file.originalname);
  }
});

let upload = multer({ storage: storage })

app.post('/', (req, res) => {
  console.log(req);
  res.send("hello");
})

app.get('/images/:image_name', (req, res) => {
  let image_name = req.params.image_name;
  res.sendFile(image_name, {root: './uploaded_images/'});
});

app.get('/images', (req, res) => {
  image_names = fs.readdirSync('./uploaded_images');
  image_paths = new Array();
  image_names.forEach(file => {
    image_paths.push({name:file, path:'http://localhost:4000/images/'+file});
    // image_paths.push(file);
  });

  res.json({ images: image_paths });
  // image_paths.map(i => {
  //   return res.sendFile(i, { root: './uploaded_images/'});
  // })
})

app.post('/images', upload.array('images'), (req, res) => {
  res.send("done");
})

app.post('/annotations', (req, res) => {
  let state = JSON.stringify(req.body.state);
  let image_name = req.body.image;
  image_name = path.parse(image_name).name;

  let file_name = './uploaded_annotations/' + image_name + '.txt';

  fs.writeFile(file_name, state, (err => {
    if (err) {
      res.json({ status: 500 });
    }
    else{
      res.json( {status: 201 });
    }
  }));
});

app.get('/annotations/:image_name', (req, res) => {
  let image_name = path.parse(req.params.image_name).name;
  let file_name = './uploaded_annotations/' + image_name + '.txt';
  fs.access(file_name, fs.F_OK, err => {
    if (err){
      console.error(err);
      return res.json({ status: 500 });
    }
    fs.readFile(file_name, 'utf-8', (err, data) => {
      if (err) {
        return res.json({ status: 500, state: null });
      }
      return res.json( {status: 200, state: JSON.parse(data) });
    });
  });
});

app.delete('/images', (req, res) => {
  image_names = fs.readdir('./uploaded_images', (err, files) => {
    if (err) return res.status(500).json({message: 'error'});

    let file_paths = files.map(f => './uploaded_images/' + f);

    file_paths.forEach(file_path => {
      fs.unlink(file_path, () => {
        console.log("File " + file_path + " deleted successfully.");
      });
    });

    return res.json({ status: '200'});
  });
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });