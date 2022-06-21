import slika from './slika.jpg';
import './App.css';
import * as markerjs2 from 'markerjs2';
import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Navbar from './components/Navbar';
import LoadDataset from './components/LoadDataset';

class App extends Component {
  constructor(props){
    super(props);
    this.imgRef = React.createRef();
    this.markerArea = null;
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
        //if (this.imgRef.current) {
        //  this.imgRef.current.src = event.dataUrl;
        //}
        console.log(event);
        let myState = event.state;
        this.showMarkerArea();
        this.markerArea.restoreState(myState);
      });

      // launch marker.js
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
  }

  render(){
    return(
      <div>
        <LoadDataset></LoadDataset>
      </div>
    )
  }
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