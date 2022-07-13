import slika from './slika.jpg'
import './App.css';
import * as markerjs2 from 'markerjs2';
import React, { Component, useState } from 'react';
import { saveAs } from 'file-saver';
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
import SaveDataset from './components/SaveDataset';
import Train from './components/Train';
import LoadModel from './components/LoadModel';

class App extends Component {
  constructor(props){
    super(props);
    // page is name of the page (link in navbar), can be: load_dataset, annotate, save, load_model, train, predict
    this.state = {
      uploadedImages: new Array(),
      images: new Array(), // all uploaded images
      previewImage: "", // current preview image in Load dataset page
      page: "annotate", // current page
      currImage: { image: "", name: "" }, // current image for annotation
      editing: false, // are we annotating?
      annotatedImages: new Array(), // all data (image + annotations)
      filename: "", // file name of a annotations file, we want to download
      filenameErrorMessage: "", // error message (eg. unvalid filename, contains . or space)
      toggleInstantAnottations: false, // boolean, idicates we if want to enable new marker creation after marker is created
      alreadyTraining: false, // boolean, idicates if we already sent data to backend...
      job_id: '', // job id of redis queue job used for machine lerning algo
      modelName: "", // name of a model we will download when training is finished
      batchSize: 0, // batch size used for training
      epochs: 0, // number of epochs used during training
      label: "", // label of a object we want to detect (count)
      trainTestSplit: false, // use a train and test split during training
      trainingFinished: false, // indicates if the current training proccess is finished
      train_loss: 0,
      valid_loss: 0,
      jobCancelStatus: "", // status of a canceled job: success or error
      uploadingImages: false,
      openDatasetModal: false,
      openModelModal: false,
      selectedModel: null,
      model: null,
      uploadingModel: false,
      totalMarkers: 0
    };
    this.imgRef = React.createRef();
    this.markerArea = null;
    this.filereader = null;
    this.interval = null;
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

  loadServerImages = () => {
    this.getServerImages().then(response => {
      let images_data = response.data.images;
      if (images_data.length == 0) {
        this.setState(prevState => ({ ...prevState, images: images_data }));
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
      this.setState(prevState => ({ ...prevState, alreadyTraining: currentlyTraining, job_id: job_id }));
    });
  }

  componentDidMount() {
    if (this.state.page === "annotate"){
      this.loadServerImages();
      this.loadServerModel();
      this.loadTrainingStatus();
    }
    // axios({
    //   method:"get",
    //   url:"http://localhost:4200"
    // }).then(response => {
    //   console.log(response);
    // }).catch(err => {
    //   console.error(err);
    // })
  }

  fileNameValidation = (filename) => {
    if (filename == '') return false;
    let re = /^[\w-]+$/;
    if (re.test(filename)) return true;
    return false;
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
        // if (this.state.images.length == 0){
        //   // we dont yet have an image in our dataset
        //   // so we set the preview image to the first one
        //   // this.setState(prevState => ({images: [...prevState.images, file], previewImage: event.target.files[0]}));
        // }
        // else{
        //   this.setState(prevState => ({images: [...prevState.images, file], previewImage: prevState.previewImage}));
        // }
        this.setState(prevState => ({ ...prevState, uploadedImages: [...prevState.uploadedImages, file] }));
    }
  };

  handleModelSelected = (event) => {
    this.setState(prevState => ({ ...prevState, selectedModel: event.target.files[0] }));
  }

  handlePreviewSelectedImage = (image) => {
    this.setState(prevState => ({images: prevState.images, previewImage: image}));
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

  handleFileNameEnter = (filename) => {
    this.setState(prevState => ({ ...prevState, filename: filename }));
  }

  handleTrainPage = () => {
    this.setState(prevState => ({ ...prevState, page:'train' }));
  }

  handleLoadModelPage = () => {
    if (this.state.page !== "annotate") this.setState(prevState => ({ ...prevState, page: "annotate", openModelModal: true }));
    else this.setState(prevState => ({ ...prevState, openModelModal: true }));
  }

  intervalFunc = () => {
    axios({
      method:'GET',
      url: '/jobs/'+this.state.job_id
    }).then(response => {
      console.log(response);
      if (response.data.job_status === "finished"){
        clearInterval(this.interval);
        this.interval = null;
        // console.log(this.interval);
        // console.log("JOB FINISHED");
        this.setState(prevState => ({ ...prevState, trainingFinished: true, train_loss: response.data.result.train_loss, valid_loss: response.data.result.valid_loss }));
      }
    });
  }

  checkTraining = (job_id) => {
    this.setState(prevState => ({ ...prevState, job_id: job_id }), () => {
      this.interval = setInterval(this.intervalFunc, 1000);
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
      console.log(response.data);
      this.checkTraining(response.data.job_id);
    }).catch(err => {
      console.error(err);
    });
    // let data = this.state.annotatedImages;
    // let images = new Array();
    // let anno = new Array();

    // for (let i = 0; i < data.length; i++){
    //   images.push(data[i].image.file);
    //   let ann = {width: data[i].state.width, height: data[i].state.height};
    //   let ms = new Array();
    //   for (let j = 0; j < data[i].state.markers.length; j++){
    //     let m = {left: data[i].state.markers[j].left, top: data[i].state.markers[j].top, width: data[i].state.markers[j].width, height: data[i].state.markers[j].height};
    //     ms.push(m);
    //   }
    //   ann.markers = ms;
    //   anno.push(ann);
    // }

    // let formData = new FormData();
    // images.forEach(img => {
    //   formData.append('images', img);
      
    // });

    // axios({
    //   method:'POST',
    //   url: "http://localhost:8000",
    //   data: formData
    // }).then(response => {
    //   let user_hash = response.data.hash;
    //   let data = {annotations: anno, user_hash: user_hash};
    //   console.log(data);
    //   axios({
    //     method:'POST',
    //     url: "http://localhost:8000/anno",
    //     data: data
    //   }).then(response => {
    //     console.log(response);
    //     // check if training is finished
    //     this.checkTraining(response.data.job_id);
    //   }).catch(error => {
    //     console.error(error);
    //   });
    // }).catch(error => {
    //   console.error(error);
    // });

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

  handleTrainTestSplit = () => {
    this.setState(prevState => ({ ...prevState, trainTestSplit: !this.state.trainTestSplit }));
  }

  handleCancelTraining = () => {
    axios({
      method:'DELETE',
      url: '/jobs/'+this.state.job_id
    }).then(response => {
      clearInterval(this.interval);
      this.interval = null;
      this.setState(prevState => ({ ...prevState, alreadyTraining: false, modelName: "", batchSize: 0, epochs: 0, label: "", trainTestSplit: false, trainingFinished: false, jobCancelStatus: response.data.status }));
      const timer = setTimeout(() => {
        this.setState(prevState => ({ ...prevState, jobCancelStatus: "" }));
        clearTimeout(timer);
      }, 2000);
    }).catch(err => {
      console.error(err);
    })
  }

  updateAnnotatedImages = (currentState) => {
    console.log(currentState);
    if (currentState.markers.length == 0) return;
    // const newAnnotatedImages = this.state.annotatedImages;
    const currImage = this.state.currImage;

    // for (let i = 0; i < newAnnotatedImages.length; i++){
    //   if (newAnnotatedImages[i].image.name === currImage.name){
    //     newAnnotatedImages[i].state = currentState;
    //     this.setState(prevState => ({ ...prevState, annotatedImages: newAnnotatedImages }));
    //     return;
    //   }
    // }

    // image is not yet in annotatedImages...
    // newAnnotatedImages.push({image: currImage, state: currentState});
    // this.setState(prevState => ({ ...prevState, annotatedImages: newAnnotatedImages }));

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
        // for (let i = 0; i < this.state.annotatedImages.length; i++){
        //   if (this.state.currImage.name === this.state.annotatedImages[i].image.name){
        //     console.log("že obstaja state");
        //     this.markerArea.restoreState(this.state.annotatedImages[i].state);
        //   }
        // }
      });

      this.markerArea.addEventListener('markercreate', event => {
        if (this.state.toggleInstantAnottations){
          event.markerArea.createNewMarker(markerjs2.FrameMarker);
        }
      });

      // this.markerArea.removeEventListener('markercreate');

      // launch marker.js
      this.setState(prevState => ({...prevState, editing: true}));
      this.markerArea.show();
    }
  }

  zoom(e) {
    let deltaY = e.deltaY;
    console.log(deltaY);
    if (deltaY > 1){
      this.markerArea.stepZoom();
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
            <Col lg="9">
              <div className="img-container mt-4 me-5">
                <img ref={this.imgRef}
                  className="slika"
                  crossorigin="anonymous"
                  src={this.state.currImage.image != "" ? this.state.currImage.image : ""}
                  hidden={this.state.currImage.image == ""}
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
            {/* <LoadDataset
              onImageSelected={this.handleImageSelected}
              onDeleteDataset={this.handleDeleteDataset}
              onServerUpload={this.handleServerUpload}
              images={this.state.images}
              uploadedImages={this.state.uploadedImages}
              uploadingImages={this.state.uploadingImages}
              onClose={this.handleAnnotatePage}
              show={this.state.page === "load_dataset"}>
            </LoadDataset>  */}
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
        alreadyTraining={this.state.alreadyTraining}
        trainingFinished={this.state.trainingFinished}
        jobCancelStatus={this.state.jobCancelStatus}
        valid_loss={this.state.valid_loss}
        train_loss={this.state.train_loss}
        ></Train>
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
          disableSaveDataset={this.state.annotatedImages.length == 0}
          disableAnnotate={this.state.images.length == 0}
          disableTrainModel={this.state.annotatedImages.length == 0}
        >
        </Navigation>
        {this.pageDisplay()}
      </div>
    )
  }

}

export default App;
