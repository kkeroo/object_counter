const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');
var compression = require('compression');
const express = require("express");
var cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

const PORT = process.env.PORT || 4000;
const app = express();

let currentlyTraining = false;
let jobId = '';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(cors());
// app.use(cors({origin: true, credentials: true}));

// using https on production server
// if (process.env.NODE_ENV === "production") {
//   app.use((req, res, next) => {
//     if (req.header("x-forwarded-proto") !== "https")
//       res.redirect(`https://${req.header("host")}${req.url}`);
//     else next();
//   });
// }

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

const modelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploaded_models/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

let upload = multer({ storage: storage })

let uploadModel = multer({ storage: modelStorage });
app.post('/', (req, res) => {
  console.log(req);
  res.send("hello");
})

app.get('/images/:image_name', (req, res) => {
  let image_name = req.params.image_name;
  res.sendFile(image_name, {root: './uploaded_images/'});
});

app.get('/images', (req, res) => {
  // getAllImagesWithAnnotations();
  // const http = require('http');

  // http.get('http://localhost:4200', res => {
  //   console.log("aa");
  // })
  image_names = fs.readdirSync('./uploaded_images');
  image_paths = new Array();
  image_names.forEach(file => {
    image_paths.push({name:file, path:'http://localhost:4000/images/'+file});
  });

  res.json({ images: image_paths });
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

    anno_names = fs.readdir('./uploaded_annotations', (err, files) => {
      if (err) return res.status(500).json({message: 'error'});

      let anno_paths = files.map(f => './uploaded_annotations/' + f);

      anno_paths.forEach(anno => {
        fs.unlink(anno, () => {
          console.log("File " + anno + " deleted successfully.");
        });
      });
    });

    return res.json({ status: '200'});
  });
});

app.get('/model', (req, res) => {
  fs.readdir('./uploaded_models', (err, files) => {
    if (files.length == 0) return res.json({ model: null });
    else return res.json({ model: files[0] });
  });
});

app.post('/model', uploadModel.single('model') , (req, res) => {
  res.send("done");
});

app.delete('/model', (req, res) => {
  fs.readdir('./uploaded_models', (err, files) => {
    if (err) return res.status(500).json({message: 'error'});

    let file_paths = files.map(f => './uploaded_models/' + f);

    file_paths.forEach(file_path => {
      fs.unlink(file_path, () => {
        console.log("File " + file_path + " deleted successfully.");
      });
    });

    return res.json({ status: '200'});
  });
});

app.get('/train', (req, res) => {
  res.json({ currentlyTraining: currentlyTraining, job_id: jobId });
});

app.post('/train', (req, res) => {
  console.log(req.body);
  let modelName = req.body.modelName;
  let batchSize = req.body.batchSize;
  let epochs = req.body.epochs;
  let label = req.body.label;
  // getAllImagesWithAnnotations(modelName, batchSize, epochs, label, res);
  // return res.json({ status: "success"});
// });

// const getAllImagesWithAnnotations = (modelName, batchSize, epochs, label, res) => {
  let images = new Array();
  let annotations = new Array();

  // read all annotations files into annotations array
  // save annotation file's name and content
  let annotations_list = fs.readdirSync('./uploaded_annotations');
  annotations_list = annotations_list.map(f => './uploaded_annotations/' + f);
  annotations_list.forEach(ann => {
    let file = fs.readFileSync(ann);
    file = JSON.parse(file);
    let name = path.parse(ann).name;
    annotations.push({ name: name, file: file });
  });

  data = new Array();
  // read all images and keep only those which have their annotations file
  fs.readdir('./uploaded_images', (err, files) => {
    let file_paths = files.map(f => './uploaded_images/' + f);
    
    file_paths.forEach(file_path => {
      annotations.forEach(ann => {
        let image_name = path.parse(file_path).name;
        if (ann.name === image_name){
          // we have a match
          let obj = { image_name: path.parse(file_path).base, width: ann.file.width, height: ann.file.height, markers: new Array() }
          ann.file.markers.forEach(marker => {
            obj.markers.push({left: marker.left, top: marker.top, width: marker.width, height: marker.height});
          });
          data.push(obj);
        }
      });
    });

    let a = {data: data, modelName: modelName, epochs: epochs, batchSize: batchSize, label:label};

    axios({
        method:'POST',
        url: "http://localhost:8888",
        data: a
      }).then(response => {
          console.log(response.data);
          currentlyTraining = true;
          jobId = response.data.job_id;
          return res.json({ status: "success", job_id: response.data.job_id });
        }).catch(err => {
            console.error(err);
            return res.json({ status: "error" });
    });
  });
});

app.get('/jobs/:job_id', (req, res) => {
  axios({
    method:'GET',
    url:'http://localhost:8888/jobs/'+req.params.job_id
  }).then(response => {
    if (response.data.job_status !== "finished"){
      return res.json({job_status: response.data.job_status});
    }
    else{
      getModel();
      currentlyTraining = false;
      jobId = '';
      return res.json({job_status: response.data.job_status, result: response.data.result});
    }
  }).catch(err => {
    console.error(err);
    return res.json({status: 'error'});
  });
});

app.delete('/jobs/:job_id', (req, res) => {
  axios({
    method:'delete',
    url:'http://localhost:8888/jobs/'+req.params.job_id
  }).then(response => {
    currentlyTraining = false;
    jobId = '';
    return res.json({status: response.data.status})
  }).catch(err => {
    console.error(err);
    return res.json({status: 'error'});
  });
});

const getModel = () => {
  axios({
    method:'GET',
    url:'http://localhost:8888/',
    responseType: 'blob'
  }).then(response => {
    fs.writeFile('./uploaded_models/model.pt', response.data, (err) => {
      if (err) return console.err(err);
      console.log("Model has been saved.");
    });
  });
}
// getAllImagesWithAnnotations();

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});