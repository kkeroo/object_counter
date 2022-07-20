import './App.css';
import * as markerjs2 from 'markerjs2';
import React, { Component, useState } from 'react';
import axios from 'axios';

import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';

import ImageList from './components/ImageList';
import LoadDataset from './components/LoadDataset';
import Navigation from './components/Navbar';
import Train from './components/Train';
import LoadModel from './components/LoadModel';
import Predict from './components/Predict';

class App extends Component {
  constructor(props){
    super(props);
    // page is name of the page (link in navbar), can be: load_dataset, annotate, save, load_model, train, predict
    this.state = {
      uploadedImages: new Array(),
      uploadedImagesPrediction: new Array(),
      images: new Array(), // all uploaded images
      page: "annotate", // current page
      currImage: { image: "", name: "" }, // current image for annotation
      editing: false, // are we annotating?
      toggleInstantAnottations: false, // boolean, idicates we if want to enable new marker creation after marker is created
      alreadyTraining: false, // boolean, idicates if we already sent data to backend...
      alreadyPredicting: false,
      job_id: '', // job id of redis queue job used for machine lerning algo
      job_id_predict: '',
      modelName: "", // name of a model we will download when training is finished
      batchSize: 0, // batch size used for training
      epochs: 0, // number of epochs used during training
      label: "", // label of a object we want to detect (count)
      trainingFinished: false, // indicates if the current training proccess is finished
      predictingFinished: false,
      train_loss: 0,
      valid_loss: 0,
      jobCancelStatus: "", // status of a canceled job: success or error
      uploadingImages: false,
      openDatasetModal: false,
      labelPrediction: "",
      predictErrorMessage: "",
      detectionThreshold: null,
      openModelModal: false,
      selectedModel: null,
      model: null,
      uploadingModel: false,
      totalMarkers: 0,
      predictedImage: "",
      result: new Array()
    };
    this.imgRef = React.createRef();
    this.markerArea = null;
    this.interval = null;
    this.intervalPred = null;
  }

  getServerImages = () => {
    return new Promise ((resolve, reject) => {
      axios({
        method:'GET',
        url:'http://localhost:4000/images'
      }).then(response => {
        resolve(response);
      }).catch(err => {
        reject(err);
      });
    });
  }

  getServerModel = () => {
    return new Promise ( (resolve, reject) => {
      axios({
        method: 'GET',
        url:'/model'
      }).then(response => {
        resolve(response);
      }).catch(err => {
        reject(err);
      });
    });
  }

  getTrainingStatus = () => {
    return new Promise ( (resolve, reject) => {
      axios({
        method:'GET',
        url:'/train'
      }).then(response => {
        resolve(response);
      }).catch(err => {
        reject(err);
      });
    });
  }

  getPredictingStatus = () => {
    return new Promise ( (resolve, reject) => {
      axios({
        method:'GET',
        url:'/predict'
      }).then(response => {
        resolve(response);
      }).catch(err => {
        reject(err);
      });
    });
  }

  loadServerImages = () => {
    this.getServerImages().then(response => {
      let images_data = response.data.images;
      if (images_data.length == 0) {
        this.setState(prevState => ({ ...prevState, images: images_data, currImage: {image: "", name: ""} }));
      }
      else{
        this.setState(prevState => ({ ...prevState, images: images_data, currImage: { image: images_data[0].path, name: images_data[0].name}}));
      }
    }).catch(err => {
      console.error(err);
    });
  }

  loadServerModel = () => {
    this.getServerModel().then(response => {
      let model = response.data.model;
      this.setState(prevState => ({ ...prevState, model: model }));
    }).catch(err => {
      console.error(err);
    });
  }

  loadTrainingStatus = () => {
    this.getTrainingStatus().then(response => {
      let currentlyTraining = response.data.currentlyTraining;
      let job_id = response.data.job_id
      if (currentlyTraining) {
        this.checkTraining(job_id);
      }
      this.setState(prevState => ({ ...prevState, alreadyTraining: currentlyTraining, job_id: job_id }));
    });
  }

  loadPredictingStatus = () => {
    this.getPredictingStatus().then(response => {
      console.log(response.data);
      let currentlyPredicting = response.data.currentlyPredicting;
      let job_id = response.data.job_id
      if (currentlyPredicting){
        this.checkPredicting(job_id);
      }
      this.setState(prevState => ({ ...prevState, alreadyPredicting: currentlyPredicting, job_id_predict: job_id }));
    });
  }

  componentDidMount() {
    if (this.state.page === "annotate"){
      this.loadServerImages();
      this.loadServerModel();
      this.loadTrainingStatus();
      this.loadPredictingStatus();
    }
  }

  handleServerUpload = () => {
    this.setState(prevState => ({ ...prevState, uploadingImages: true }));
    let images = this.state.uploadedImages;
    console.log(images);
    if (images.length == 0) return;

    let data = new FormData();
    images.forEach(img => {
      data.append('images', img);
    });

    axios({
      method:'POST',
      url: "/images",
      data: data
    }).then(response => {
      console.log(response);
      this.setState(prevState => ({ ...prevState, uploadingImages: false, page: "annotate" }));
      this.loadServerImages();
    }).catch(e => {
      console.error(e);
      this.setState(prevState => ({ ...prevState, uploadingImages: false, page:"annotate" }));
    });
  }

  handleUploadModel = () => {
    this.setState(prevState => ({ ...prevState, uploadingModel: true }));
    let model = this.state.selectedModel;
    if (model == null) return;

    let data = new FormData();
    data.append('model', model);

    axios({
      method: "POST",
      url:'/model',
      data: data
    }).then(response => {
      console.log(response);
      this.setState(prevState => ({ ...prevState, uploadingModel: false, page: "annotate" }));
      this.loadServerModel();
    }).catch(err => {
      console.error(err);
      this.setState(prevState => ({ ...prevState, uploadingModel: false, page: "annotate" }));
    });
  }

  handleDeleteModel = () => {
    axios({
      method:'DELETE',
      url:'/model'
    }).then(response => {
      console.log(response);
      this.loadServerModel();
    }).catch(err => {
      console.error(err);
    });
  }

  handleImageSelected = (event) => {
    for (let file of event.target.files) {
        this.setState(prevState => ({ ...prevState, uploadedImages: [...prevState.uploadedImages, file] }));
    }
  };

  handleImageSelectedPrediction = (event) => {
    this.setState(prevState => ({ ...prevState, uploadedImagesPrediction: new Array() }), () => {
      for (let file of event.target.files) {
        this.setState(prevState => ({ ...prevState, uploadedImagesPrediction: [...prevState.uploadedImagesPrediction, file] }));
      }
    });
  }

  handleModelSelected = (event) => {
    this.setState(prevState => ({ ...prevState, selectedModel: event.target.files[0] }));
  }

  handleSelectedImage = (image) => {
    this.setState(prevState => ({ ...prevState, predictedImage: image}));
  }

  handleAnnotateSelectedImage = (image) => {
    this.setState(prevState => ({...prevState, currImage: { image: image.path, name: image.name } }));
  }

  handleDeleteDataset = () => {
    axios({
      method:'DELETE',
      url:'/images'
    }).then(response => {
      console.log(response);
      this.loadServerImages();
    }).catch(err => {
      console.error(err);
    });
  }

  handleLoadDatasetPage = () => {
    if (this.state.page !== "annotate"){
      this.setState(prevState => ({...prevState,page: "annotate", openDatasetModal: true }));
    }
    else this.setState(prevState => ({...prevState, openDatasetModal: true }));
  }

  handleAnnotatePage = () => {
    this.setState(prevState => ({...prevState, page: "annotate"}));
  }

  handleTrainPage = () => {
    this.setState(prevState => ({ ...prevState, page:'train' }));
  }

  handleLoadModelPage = () => {
    if (this.state.page !== "annotate") this.setState(prevState => ({ ...prevState, page: "annotate", openModelModal: true }));
    else this.setState(prevState => ({ ...prevState, openModelModal: true }));
  }

  handleLoadPredictPage = () => {
    this.setState(prevState => ({ ...prevState, page: 'predict' }));
  }

  intervalFuncTraining = () => {
    if (this.state.trainingFinished) return;
    axios({
      method:'GET',
      url: '/jobs/train/'+this.state.job_id
    }).then(response => {
      if (response.data.job_status === "finished"){
        clearInterval(this.interval);
        this.interval = null;
        this.setState(prevState => ({ ...prevState, trainingFinished: true, train_loss: parseFloat(response.data.result.train_loss).toFixed(4), valid_loss: parseFloat(response.data.result.valid_loss).toFixed(4) }));
      }
    }).catch(err => {
      console.error(err);
    });
  }

  intervalFuncPredicting = () => {
    if (this.state.predictingFinished || !this.state.alreadyPredicting) return;
    axios({
      method:'GET',
      url:'/jobs/predict/'+this.state.job_id_predict
    }).then(response => {
      if (response.data.job_status === "finished"){
        clearInterval(this.intervalPred);
        this.intervalPred = null;
        let result = response.data.result; // [{image: , count: },...]
        let data = [];
        result.forEach(r => {
          data.push({ name: r.image, path: "http://localhost:8888/images/"+r.image, count: r.count });
        });
        this.setState(prevState => ({ ...prevState, alreadyPredicting:false, predictingFinished: true, result: data, predictedImage: data[0] }));
      }
    }).catch(err => {
      console.error(err);
    });
  }

  checkTraining = (job_id) => {
    this.setState(prevState => ({ ...prevState, job_id: job_id }), () => {
      this.interval = setInterval(this.intervalFuncTraining, 6000);
    });
  }

  checkPredicting = (job_id) => {
    this.setState(prevState => ({ ...prevState, job_id_predict: job_id }), () => {
      this.intervalPred = setInterval(this.intervalFuncPredicting, 5000);
    });
  }

  handleTrainModel = () => {
    if (this.state.alreadyTraining) return;

    this.setState(prevState => ({ ...prevState, alreadyTraining: true }));

    let data = {
      modelName: this.state.modelName,
      batchSize: this.state.batchSize,
      epochs: this.state.epochs,
      label: this.state.label
    };

    axios({
      method:'POST',
      url:'/train',
      data: data
    }).then(response => {
      this.checkTraining(response.data.job_id);
    }).catch(err => {
      console.error(err);
    });
  }

  handleEnterModelName = (e) => {
    this.setState(prevState => ({ ...prevState, modelName: e.target.value }));
  }

  handleEnterBatchSize = (e) => {
    this.setState(prevState => ({ ...prevState, batchSize: e.target.value }));
  }

  handleEnterEpochs = (e) => {
    this.setState(prevState => ({ ...prevState, epochs: e.target.value }));
  }

  handleEnterLabel = (e) => {
    this.setState(prevState => ({ ...prevState, label: e.target.value }));
  }

  handleEnterLabelPrediction = (e) => {
    this.setState(prevState => ({ ...prevState, labelPrediction: e.target.value }));
  }


  handleEnterDetectionThreshold = (e) => {
    this.setState(prevState => ({ ...prevState, detectionThreshold: e.target.value }));
  }

  handleCancelTraining = () => {
    axios({
      method:'DELETE',
      url: '/jobs/train/'+this.state.job_id
    }).then(response => {
      clearInterval(this.interval);
      this.interval = null;
      this.setState(prevState => ({ ...prevState, alreadyTraining: false, modelName: "", batchSize: 0, epochs: 0, label: "", trainingFinished: false, jobCancelStatus: response.data.status }));
      const timer = setTimeout(() => {
        this.setState(prevState => ({ ...prevState, jobCancelStatus: "" }));
        clearTimeout(timer);
      }, 2000);
    }).catch(err => {
      console.error(err);
    })
  }

  handleCancelPredicting = () => {
    axios({
      method:'DELETE',
      url:'/jobs/predict/'+this.state.job_id_predict
    }).then(response => {
      clearInterval(this.intervalPred);
      this.intervalPred = null;
      this.setState(prevState => ({ ...prevState, alreadyPredicting: false, predictingFinished: false }));
    }).catch(err => {
      console.error(err);
    });
  }

  handleDownloadModel = () => {
    axios({
      method:'GET',
      url: '/trained_model'
    }).then(response => {
      console.log(response.headers);
    }).catch(err => {
      console.error(err);
    });
  }

  handlePredict = () => {
    if (this.state.alreadyPredicting) return

    let threshold = this.state.detectionThreshold;
    let uploadedImages = this.state.uploadedImagesPrediction;
    let model = this.state.model;
    let label = this.state.labelPrediction;
    
    if (threshold < 0 || threshold > 1 || threshold == null) {
      this.setState(prevState => ({ ...prevState, predictErrorMessage: "Please choose value of detection threshold between 0 and 1."}));
      return;
    }
    if (uploadedImages.length == 0){
      this.setState(prevState => ({ ...prevState, predictErrorMessage: "Please upload images."}));
      return;
    }
    if (model == null){
      this.setState(prevState => ({ ...prevState, predictErrorMessage: "Please upload model."}));
      return;
    }
    if (label == ""){
      this.setState(prevState => ({ ...prevState, predictErrorMessage: "Please enter label of object"}));
      return;
    }
    
    
    let formData = new FormData();
    uploadedImages.forEach(img => {
      formData.append('images', img);
    });
    
    formData.append('threshold', threshold);
    formData.append('model', model);
    formData.append('label', label);
    
    axios({
      method:"DELETE",
      url:'/predict/images'
    }).then(response => {
      axios({
        method:'POST',
        url:'/predict',
        data: formData
      }).then(response => {
        this.setState(prevState => ({ ...prevState, alreadyPredicting: true, predictErrorMessage: "" }));
        this.checkPredicting(response.data.job_id);
      }).catch(err => {
        console.error(err);
      });
    }).catch(err => {
      console.error(err);
    });
  }

  handleReset = () => {
    this.setState(prevState => ({ ...prevState, uploadedImagesPrediction: new Array(), alreadyPredicting: false, predictingFinished: false, labelPrediction: "", predictErrorMessage: "", detectionThreshold: null, predictedImage: "", result: new Array() }));
  }

  updateAnnotatedImages = (currentState) => {
    if (currentState.markers.length == 0) return;

    const currImage = this.state.currImage;

    let data = {state: currentState, image: currImage.name};

    axios({
      method: "POST",
      url: "/annotations",
      data: data
    }).then(response => {
      console.log(response);
    }).catch(err => {
      console.error(err);
    });
  }

  getImageAnnotations = (image_name) => {
    return new Promise( (resolve, reject) => {
      axios({
        method:'GET',
        url: '/annotations/' + image_name
      }).then(response => {
        console.log(response);
        if (response.data.state != null) {
          resolve(response.data.state);
        }
      }).catch(err => {
        console.error(err);
        resolve(err);
      });

    });
  }

  getImageDims = (src, cb) => {
    let img = new Image();
    img.src = src;
    img.onload = function() { cb(this.width, this.height); }
  }

  resizeImage =() => {
    let img_col = document.getElementsByClassName('image-col')[0];
    let slika = document.getElementsByClassName('slika')[0];

    this.getImageDims(slika.src, (width, height) => {
      if (width > height){
        let ratio = height / width;
        let desired_width = img_col.clientWidth - 30;
        let desired_height = desired_width * ratio;

        if (desired_height > img_col.clientHeight - 30){
          desired_height = img_col.clientHeight-30;
          desired_width = desired_height / ratio;
        }
        slika.width = desired_width;
        slika.height = desired_height;
      }
      else{
        let ratio = width / height;
        let desired_height = img_col.clientHeight - 30;
        let desired_width = desired_height * ratio;

        if (desired_width > img_col.clientWidth - 30){
          desired_width = img_col.clientWidth - 30;
          desired_height = desired_width / ratio;
        }
        slika.width = desired_width;
        slika.height = desired_height;
      }
    });
  }

  showMarkerArea() {
    if (this.imgRef.current !== null) {
      // create a marker.js MarkerArea
      this.markerArea = new markerjs2.MarkerArea(this.imgRef.current);

      // Settings
      this.markerArea.settings.defaultColor = 'red';
      this.markerArea.settings.defaultFillColor = 'transparent';
      this.markerArea.uiStyleSettings.toolbarHeight = 0;
      this.markerArea.uiStyleSettings.hideToolbar = true;
      this.markerArea.uiStyleSettings.hideBox = true;
      this.markerArea.zoomSteps = [1, 1.5, 2, 2.5, 3];
      this.markerArea.uiStyleSettings.zoomButtonVisible = true;
      this.markerArea.settings.defaultStrokeWidth = 2;
      //this.markerArea.settings.displayMode = 'popup';

      // attach an event handler to assign annotated image back to our image element
      this.markerArea.addEventListener('render', event => {
        let myState = event.state;
        this.updateAnnotatedImages(myState);
      });

      this.markerArea.addEventListener('show', event => {
        this.getImageAnnotations(this.state.currImage.name).then(state => {
          this.markerArea.restoreState(state);
          this.setState(prevState => ({ ...prevState, totalMarkers: state.markers.length }));
        });
      });

      this.markerArea.addEventListener('markercreate', event => {
        if (this.state.toggleInstantAnottations){
          event.markerArea.createNewMarker(markerjs2.FrameMarker);
        }
      });

      // launch marker.js
      this.setState(prevState => ({...prevState, editing: true}));
      this.markerArea.show();
    }
  }

  zoomIn() {
    this.markerArea.stepZoom();
  }

  zoomOut() {
    this.markerArea.zoomLevel = 1;
  }

  finishEditing() {
    this.markerArea.startRenderAndClose();
    this.setState(prevState => ({...prevState, editing: false, totalMarkers: 0}));
  }

  toggleInstantAnottations = (e) => {
    if (e.target.checked){
      this.setState(prevState => ({ ...prevState, toggleInstantAnottations: true }));
    }
    else{
      // we dont want instant annotations
      this.setState(prevState => ({ ...prevState, toggleInstantAnottations: false }));
    }
  }

  mainPage = () => {
    return (
        <Container fluid className="">
          <LoadDataset
              onImageSelected={this.handleImageSelected}
              onDeleteDataset={this.handleDeleteDataset}
              onServerUpload={this.handleServerUpload}
              images={this.state.images}
              image_lenght={this.state.images.length}
              uploadedImages={this.state.uploadedImages}
              uploadingImages={this.state.uploadingImages}
              onClose={() => {this.setState(prevState => ({ ...prevState, openDatasetModal: false }))}}
              show={this.state.openDatasetModal}>
          </LoadDataset> 
          <LoadModel
            show={this.state.openModelModal}
            onClose={() => {this.setState(prevState => ({ ...prevState, openModelModal: false }))}}
            model={this.state.model}
            onModelSelected={this.handleModelSelected}
            onUploadModel={this.handleUploadModel}
            onDeleteModel={this.handleDeleteModel}
            uploadedModel={this.state.uploadingModel}
          >
          </LoadModel>
          <Row>
            <Col lg="9" className="image-col">
              <div className="img-container mt-3 me-4">
                <img
                  ref={this.imgRef}
                  className="slika"
                  crossOrigin="anonymous"
                  src={this.state.currImage.image != "" ? this.state.currImage.image : ""}
                  hidden={this.state.currImage.image == ""}
                  onLoad={this.resizeImage}
                />
              </div>
            </Col>
            <Col lg="3" className="toolbox">

              <Stack direction='horizontal' gap="2" className="ms-5 me-5 mt-3">
                  <Button variant="success" className="me-auto ms-auto start-btn" onClick = {() => this.showMarkerArea()} disabled={this.state.editing || this.state.currImage.name == ""}>
                    Start
                  </Button>
                  <Button className="btn-danger ms-auto me-auto finish-btn" onClick={() => { this.finishEditing(); }} disabled={!this.state.editing}>Finish</Button>
              </Stack>

              <Stack direction="horizontal" gap="3" className="ms-2 me-2 mt-3">
                <Button variant="primary" className="me-auto ms-auto" onClick={() => { this.markerArea.createNewMarker(markerjs2.FrameMarker); }} disabled={!this.state.editing}>
                  <i className="bi bi-plus-square"></i>
                </Button>
                <Button variant="secondary" className="me-auto ms-auto" onClick={() => { this.markerArea.setCurrentMarker(); }} disabled={!this.state.editing}>
                  <i className="bi bi-cursor"></i>
                  </Button>
                <input type="checkbox" className="btn-check ms-auto me-auto" id="btn-check-2-outlined" onChange={e => {this.toggleInstantAnottations(e)}} disabled={!this.state.editing} />
                <label className="btn btn-outline-secondary ms-auto me-auto" htmlFor="btn-check-2-outlined">
                  <i className="bi bi-lightning"></i>
                </label>
                <Button variant="warning" className="me-auto ms-auto" onClick={() => { this.zoomIn(); }} disabled={!this.state.editing}>
                  <i className="bi bi-zoom-in"></i>
                </Button>
                <Button variant="warning" className="me-auto ms-auto" onClick={() => { this.zoomOut(); }} disabled={!this.state.editing}>
                  <i className="bi bi-zoom-out"></i>
                </Button>
              </Stack>

              <h5 className="text-light mt-4 ms-5 me-5 info-text">Uploaded images</h5>
              <h6 className="ms-5 mt-2 text-light info-text">Total images: {this.state.images.length}</h6>
              <h6 className="ms-5 mt-2 mb-2 text-light info-text">Total annotations: {this.state.totalMarkers}</h6>
              <ImageList
                images={this.state.images}
                onPreviewSelectedImage={this.handleAnnotateSelectedImage}
              >
              </ImageList>
            </Col>
          </Row>
        </Container>
    );
  }

  pageDisplay = () => {
    switch (this.state.page) {
      case "load_dataset":
        {
          return (
          <>
            {this.mainPage()}
          </>
          );
        }
      case "annotate":
        {
          return (
            <div className="App">
              {this.mainPage()}
            </div>
          )
        }
      case 'train':
      {
        return <Train
        onEnterModelName={this.handleEnterModelName}
        onEnterBatchSize={this.handleEnterBatchSize}
        onEnterEpochs={this.handleEnterEpochs}
        onEnterLabel={this.handleEnterLabel}
        onTrainTestSplit={this.handleTrainTestSplit}
        onTrain={this.handleTrainModel}
        onCancelTraining={this.handleCancelTraining}
        onDownloadModel={this.handleDownloadModel}
        alreadyTraining={this.state.alreadyTraining}
        trainingFinished={this.state.trainingFinished}
        jobCancelStatus={this.state.jobCancelStatus}
        valid_loss={this.state.valid_loss}
        train_loss={this.state.train_loss}
        ></Train>
      }
      case 'predict':
      {
        return <Predict
          show={this.state.page === 'predict'}
          onClose={() => {this.setState(prevState => ({ ...prevState, page: 'annotate' }))}}
          onImageSelected={this.handleImageSelectedPrediction}
          onDeleteDataset={this.handleDeleteDatasetPrediction}
          onEnterLabel={this.handleEnterLabelPrediction}
          onEnterDetectionThreshold={this.handleEnterDetectionThreshold}
          onCancelPredicting={this.handleCancelPredicting}
          onPredict={this.handlePredict}
          onSelectedImage={this.handleSelectedImage}
          onReset={this.handleReset}
          image_lenght={this.state.uploadedImagesPrediction.length}
          model={this.state.model}
          errorMessage={this.state.predictErrorMessage}
          alreadyPredicting={this.state.alreadyPredicting}
          predictingFinished={this.state.predictingFinished}
          images={this.state.result}
          predictedImage={this.state.predictedImage}
        >
        </Predict>
      }
      default:
        break;
    }
  }

  render(){
    return(
      <div>
        <Navigation
          onLoadDataset={this.handleLoadDatasetPage}
          onAnnotate={this.handleAnnotatePage}
          onTrainModel={this.handleTrainPage}
          onLoadModel={this.handleLoadModelPage}
          onPredict={this.handleLoadPredictPage}
          page={this.state.page}
        >
        </Navigation>
        {this.pageDisplay()}
      </div>
    )
  }

}

export default App;
