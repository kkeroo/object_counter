const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');
var compression = require('compression');
const express = require("express");
var cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');

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

app.post('/images', upload.array('images'), (req, res) => {
  res.send("done");
})

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });