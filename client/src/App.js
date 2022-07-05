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

class App extends Component {
  constructor(props){
    super(props);
    // page is name of the page (link in navbar), can be: load_dataset, annotate, save, load_model, train, predict
    this.state = {
      images: new Array(), // all uploaded images
      previewImage: "", // current preview image in Load dataset page
      page: "load_dataset", // current page
      currImage: { image: "", file: null }, // current image for annotation
      editing: false, // are we annotating?
      annotatedImages: new Array(), // all data (image + annotations)
      filename: "", // file name of a annotations file, we want to download
      filenameErrorMessage: "", // error message (eg. unvalid filename, contains . or space)
      currentlyUploadingAnnotationsFile: false, // boolean, indicates if we are uploading annotatitions file
      toggleInstantAnottations: false, // boolean, idicates we if want to enable new marker creation after marker is created
      alreadyTraining: false // boolean, idicates if we already sent data to backend...
    };
    this.imgRef = React.createRef();
    this.markerArea = null;
    this.filereader = null;
  }

  fileNameValidation = (filename) => {
    if (filename == '') return false;
    let re = /^[\w-]+$/;
    if (re.test(filename)) return true;
    return false;
  }

  handleImageSelected = (event) => { 
    for (let file of event.target.files) {
        if (this.state.images.length == 0){
          // we dont yet have an image in our dataset
          // so we set the preview image to the first one
          this.setState(prevState => ({images: [...prevState.images, file], previewImage: event.target.files[0]}));
        }
        else{
          this.setState(prevState => ({images: [...prevState.images, file], previewImage: prevState.previewImage}));
        }
    }
  };

  handlePreviewSelectedImage = (image) => {
    this.setState(prevState => ({images: prevState.images, previewImage: image}));
  }

  handleAnnotateSelectedImage = (image) => {
    this.setState(prevState => ({...prevState, currImage: { image:URL.createObjectURL(image), file: image } }));
  }

  handleDeleteDataset = () => {
    this.setState(prevState => ({images: new Array(), previewImage: ""}));
  }

  handleLoadDatasetPage = () => {
    this.setState(prevState => ({...prevState, page: "load_dataset"}));
  }

  handleAnnotatePage = () => {
    this.setState(prevState => ({...prevState, page: "annotate"}));
  }

  handleSaveDatasetPage = () => {
    this.setState(prevState => ({ ...prevState, page: "save_dataset" }));
  }

  handleFileNameEnter = (filename) => {
    this.setState(prevState => ({ ...prevState, filename: filename }));
  }

  handleSaveDataset = () => {
    if (!this.fileNameValidation(this.state.filename)){
      this.setState(prevState => ({ ...prevState, filenameErrorMessage: "Please enter valid file name." }));
    }
    else{
      this.setState(prevState => ({ ...prevState, filenameErrorMessage: "" }));

      let data = this.state.annotatedImages;
      for (let i = 0; i < data.length; i++){
        data[i].filename = data[i].image.file.name;
      }
      data = JSON.stringify(data);

      let blob = new Blob([data], {type: "text/plain;charset=utf-8"});
      let fn = this.state.filename + ".txt";
      saveAs(blob, fn);

      this.handleAnnotatePage();
    }
  }

  handleFileRead = e => {
    const content = this.filereader.result;
    let data = JSON.parse(content);
    let newAnnotatedImages = new Array();

    // add uploaded state to every image match in our uploaded images
    for (let imgs = 0; imgs < this.state.images.length; imgs++){
      for (let states = 0; states < data.length; states++){
        if (data[states].filename === this.state.images[imgs].name) {
          // we have match
          newAnnotatedImages.push({image: {image: URL.createObjectURL(this.state.images[imgs]), file: this.state.images[imgs]}, state: data[states].state});
        }
      }
    }
    this.setState(prevState => ({ ...prevState, annotatedImages: newAnnotatedImages }), () => {
      // when annotations file is successfully proccessed and states are updated..
      this.setState(prevState => ({ ...prevState, currentlyUploadingAnnotationsFile: false }));
    });
  }
  
  handleUploadAnnotationsFile = (e) => {
    if (e.target.files[0] == undefined) return;
    this.setState(prevState => ({ ...prevState, currentlyUploadingAnnotationsFile: true }));
    this.filereader = new FileReader();
    this.filereader.onloadend = this.handleFileRead;
    this.filereader.readAsText(e.target.files[0]);
  }

  handleTrainModel = () => {
    if (this.state.alreadyTraining) return;

    let data = this.state.annotatedImages;
    let images = new Array();
    let anno = new Array();

    for (let i = 0; i < data.length; i++){
      images.push(data[i].image.file);
      let ann = {width: data[i].state.width, height: data[i].state.height};
      let ms = new Array();
      for (let j = 0; j < data[i].state.markers.length; j++){
        let m = {left: data[i].state.markers[j].left, top: data[i].state.markers[j].top, width: data[i].state.markers[j].width, height: data[i].state.markers[j].height};
        ms.push(m);
      }
      ann.markers = ms;
      anno.push(ann);
    }

    let formData = new FormData();
    images.forEach(img => {
      formData.append('images', img);
      
    });

    axios({
      method:'POST',
      url: "http://localhost:8000",
      data: formData
    }).then(response => {
      let user_hash = response.data.hash;
      let data = {annotations: anno, user_hash: user_hash};
      console.log(data);
      axios({
        method:'POST',
        url: "http://localhost:8000/anno",
        data: data
      }).then(response => {
        console.log(response);
        this.setState(prevState => ({...prevState, alreadyTraining: true}));
      }).catch(error => {
        console.error(error);
      });
    }).catch(error => {
      console.error(error);
    });

  }

  updateAnnotatedImages = (currentState) => {
    if (currentState.markers.length == 0) return;
    const newAnnotatedImages = this.state.annotatedImages;
    const currImage = this.state.currImage;

    for (let i = 0; i < newAnnotatedImages.length; i++){
      if (newAnnotatedImages[i].image.file.name === currImage.file.name){
        newAnnotatedImages[i].state = currentState;
        this.setState(prevState => ({ ...prevState, annotatedImages: newAnnotatedImages }));
        return;
      }
    }

    // image is not yet in annotatedImages...
    newAnnotatedImages.push({image: currImage, state: currentState});
    this.setState(prevState => ({ ...prevState, annotatedImages: newAnnotatedImages }));
  }

  showMarkerArea() {
    if (this.imgRef.current !== null) {
      // create a marker.js MarkerArea
      this.markerArea = new markerjs2.MarkerArea(this.imgRef.current);

      // Settings
      this.markerArea.settings.defaultColor = 'green';
      this.markerArea.settings.defaultFillColor = 'transparent';
      this.markerArea.uiStyleSettings.toolbarHeight = 0;
      this.markerArea.uiStyleSettings.hideToolbar = true;
      this.markerArea.uiStyleSettings.hideBox = true;
      this.markerArea.zoomSteps = [1, 1.5, 2, 2.5, 3];
      this.markerArea.uiStyleSettings.zoomButtonVisible = true;
      this.markerArea.settings.defaultStrokeWidth = 1;
      //this.markerArea.settings.displayMode = 'popup';

      // attach an event handler to assign annotated image back to our image element
      this.markerArea.addEventListener('render', event => {
        let myState = event.state;
        this.updateAnnotatedImages(myState);
      });

      this.markerArea.addEventListener('show', event => {
        for (let i = 0; i < this.state.annotatedImages.length; i++){
          if (this.state.currImage.file.name === this.state.annotatedImages[i].image.file.name){
            console.log("že obstaja state");
            this.markerArea.restoreState(this.state.annotatedImages[i].state);
          }
        }
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
    this.setState(prevState => ({...prevState, editing: false}));
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

  pageDisplay = () => {
    console.log(this.state.page);
    switch (this.state.page) {
      case "load_dataset":
        {
          return (<LoadDataset onImageSelected={this.handleImageSelected} 
            onPreviewSelectedImage={this.handlePreviewSelectedImage}
            onDeleteDataset={this.handleDeleteDataset}
            onUploadAnnotationsFile={this.handleUploadAnnotationsFile}
            images={this.state.images} 
            previewImage={this.state.previewImage}>
          </LoadDataset> )
        }
      case "save_dataset":
        {
          return (
            <SaveDataset
              show={this.state.page === "save_dataset"}
              onClose={this.handleAnnotatePage}
              onFileNameEnter={this.handleFileNameEnter}
              errorMessage={this.state.filenameErrorMessage}
              onSaveDataset={this.handleSaveDataset}
            ></SaveDataset>
          )
        }
      case "annotate":
        {
          return (
            <div className="App">
              <Container fluid className="">
                <Row>
                  <Col lg="9">
                    <div className="img-container mt-4 me-5">
                      <img ref={this.imgRef}
                        className="slika"
                        src={this.state.currImage.image != "" ? this.state.currImage.image : ""}
                        hidden={this.state.currImage.image == ""}
                      />
                    </div>
                  </Col>
                  <Col lg="3" className="toolbox">
                    
                    <Stack direction="horizontal" className="ms-auto me-auto mt-3">
                      <Button variant="outline-dark" className="me-auto ms-auto upload-btn" disabled={this.state.images.length == 0} onClick={() => {document.getElementById("input-annotations-file").click()}}>
                        <span hidden={!this.state.currentlyUploadingAnnotationsFile} class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Upload annotations file
                      </Button>
                      <input type="file" id="input-annotations-file" hidden onChange={(e) => {this.handleUploadAnnotationsFile(e)}}/>
                    </Stack>

                    <Stack direction='horizontal' gap="2" className="ms-5 me-5 mt-3">
                        <Button variant="success" className="me-auto ms-auto start-btn" onClick = {() => this.showMarkerArea()} disabled={this.state.editing || this.state.currImage.file == null || this.state.currentlyUploadingAnnotationsFile}>
                          Start
                        </Button>
                        <Button className="btn-danger ms-auto me-auto finish-btn" onClick={() => { this.finishEditing(); }} disabled={!this.state.editing}>Finish</Button>
                    </Stack>

                    <Stack direction="horizontal" gap="3" className="ms-2 me-2 mt-3">
                      <Button variant="primary" className="me-auto ms-auto" onClick={() => { this.markerArea.createNewMarker(markerjs2.FrameMarker); }} disabled={!this.state.editing}>
                        <i class="bi bi-plus-square"></i>
                      </Button>
                      <Button variant="secondary" className="me-auto ms-auto" onClick={() => { this.markerArea.setCurrentMarker(); }} disabled={!this.state.editing}>
                        <i class="bi bi-cursor"></i>
                        </Button>
                      <input type="checkbox" class="btn-check ms-auto me-auto" id="btn-check-2-outlined" autocomplete="off" onChange={e => {this.toggleInstantAnottations(e)}} disabled={!this.state.editing} />
                      <label class="btn btn-outline-secondary ms-auto me-auto" for="btn-check-2-outlined">
                        <i class="bi bi-lightning"></i>
                      </label>
                      <Button variant="warning" className="me-auto ms-auto" onClick={() => { this.zoomIn(); }} disabled={!this.state.editing}>
                        <i class="bi bi-zoom-in"></i>
                      </Button>
                      <Button variant="warning" className="me-auto ms-auto" onClick={() => { this.zoomOut(); }} disabled={!this.state.editing}>
                        <i class="bi bi-zoom-out"></i>
                      </Button>
                    </Stack>

                    <h5 className="text-light mt-4 ms-5 me-5 info-text">Uploaded images</h5>
                    <h6 className="ms-5 mt-2 text-light info-text">Total images: {this.state.images.length}</h6>
                    {/* <h6 className="ms-5 mt-2 mb-2 text-light info-text">Total annotations: {10}</h6> */} {/* TODO */}
                    <ImageList
                      images={this.state.images}
                      onPreviewSelectedImage={this.handleAnnotateSelectedImage}
                    >
                    </ImageList>
                  </Col>
                </Row>
              </Container>
            </div>
          );
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
          onSaveDataset={this.handleSaveDatasetPage}
          onTrainModel={this.handleTrainModel}
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
