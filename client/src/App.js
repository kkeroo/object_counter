import slika from './slika.jpg'
import './App.css';
import * as markerjs2 from 'markerjs2';
import React, { Component, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import LoadDataset from './components/LoadDataset';
import Navigation from './components/Navbar';
import ImageList from './components/ImageList';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

class App extends Component {
  constructor(props){
    super(props);
    // page is name of the page (link in navbar), can be: load_dataset, annotate, save, load_model, train, predict
    this.state = {
      images: new Array(),
      previewImage: "",
      page: "load_dataset",
      currImage: "",
      editing: false
    };
    this.imgRef = React.createRef();
    this.markerArea = null;
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
    this.setState(prevState => ({...prevState, currImage: URL.createObjectURL(image)}));
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
      // this.markerArea.addEventListener('render', event => {
      //   if (this.imgRef.current) {
      //    this.imgRef.current.src = event.dataUrl;
      //   }
      //   console.log(event);
      //   let myState = event.state;
      //   this.showMarkerArea();
      //   this.markerArea.restoreState(myState);
      // });

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

  finishEditing() {
    this.markerArea.startRenderAndClose();
    this.setState(prevState => ({...prevState, editing: false}));
  }

  pageDisplay = () => {
    console.log(this.state.page);
    switch (this.state.page) {
      case "load_dataset":
        {
          return (<LoadDataset onImageSelected={this.handleImageSelected} 
            onPreviewSelectedImage={this.handlePreviewSelectedImage}
            onDeleteDataset={this.handleDeleteDataset}
            images={this.state.images} 
            previewImage={this.state.previewImage}>
          </LoadDataset> )
          break;
        }
      case "annotate":
        {
          return (
                <div className="App">
                  <Container className="mt-3">
                    <Row>
                      <Col>
                        <Button className="me-2 btn-success" onClick = {() => this.showMarkerArea()} disabled={this.state.editing}>Start</Button>
                        <Button className="me-2" onClick={() => { this.markerArea.createNewMarker(markerjs2.FrameMarker); }}>Rectangle</Button>
                        <Button className="me-2" onClick={() => { this.markerArea.createNewMarker(markerjs2.EllipseMarker); }}>Ellipse</Button>
                        <Button className="me-2" onClick={() => { this.markerArea.stepZoom(); }}>Zoom in</Button>
                        <Button className="btn-danger" onClick={() => { this.finishEditing(); }} disabled={!this.state.editing}>Finish</Button>
                      </Col>
                    </Row>
                  </Container>
                  <Row>
                    <Col lg="10">
                      <div className="img-container">
                        <img ref={this.imgRef}
                          className="slika"
                          src={this.state.currImage}
                          alt="sample"
                          onWheel={(e) => {this.zoom(e)}}
                        />
                      </div>
                    </Col>
                    <Col lg="2" className="mt-5">
                      <div className="me-5">
                      <ImageList
                        images={this.state.images}
                        onPreviewSelectedImage={this.handleAnnotateSelectedImage}
                      >
                      </ImageList>
                      </div>
                    </Col>
                  </Row>
                </div>
              );
          break;
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
          onAnnotate={this.handleAnnotatePage}>
        </Navigation>
        {this.pageDisplay()}
      </div>
    )
  }

  // render(){
  //   return(
  //     <div>
  //       <LoadDataset onImageSelected={this.handleImageSelected} 
  //         onPreviewSelectedImage={this.handlePreviewSelectedImage}
  //         onDeleteDataset={this.handleDeleteDataset}
  //         images={this.state.images} 
  //         previewImage={this.state.previewImage}>
  //       </LoadDataset>
  //     </div>
  //   )
  // }
  // render() {
  //   return (
  //     <div className="App">
  //       <Navbar></Navbar>
  //       <Container className="mt-3">
  //         <Button className="me-2 btn-success" onClick = {() => this.showMarkerArea()}>Start</Button>
  //         <Button className="me-2" onClick={() => { this.markerArea.createNewMarker(markerjs2.FrameMarker); }}>Rectangle</Button>
  //         <Button className="me-2" onClick={() => { this.markerArea.createNewMarker(markerjs2.EllipseMarker); }}>Ellipse</Button>
  //         <Button className="me-2" onClick={() => { this.markerArea.stepZoom(); }}>Zoom in</Button>
  //         <Button className="btn-danger" onClick={() => { this.finishEditing(); }}>Finish</Button>
  //       </Container>
  //       <div className="img-container">
  //         <img ref={this.imgRef}
  //           className="slika"
  //           src={slika}
  //           alt="sample"
  //           onWheel={(e) => {this.zoom(e)}}
  //         />
  //       </div>
  //     </div>
  //   );
  // }
}

export default App;
