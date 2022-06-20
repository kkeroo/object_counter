import logo from './logo.svg';
import slika from './slika.jpg';
import './App.css';
import * as markerjs2 from 'markerjs2';
import React, { Component } from 'react';

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
      this.markerArea.uiStyleSettings.toolbarHeight = 0;
      this.markerArea.uiStyleSettings.hideToolbar = true;
      this.markerArea.uiStyleSettings.hideBox = true;
      this.markerArea.zoomSteps = [1, 1.5, 2, 4];
      this.markerArea.uiStyleSettings.zoomButtonVisible = true;
      this.markerArea.settings.defaultStrokeWidth = 1;
      this.markerArea.settings.newFreehandMarkerOnPointerUp = true;
      //this.markerArea.settings.displayMode = 'popup';

      // attach an event handler to assign annotated image back to our image element
      this.markerArea.addEventListener('render', event => {
        if (this.imgRef.current) {
          this.imgRef.current.src = event.dataUrl;
        }
      });
      // launch marker.js
      this.markerArea.show();
    }
  }

  render() {
    return (
      <div className="App">
        <h1>marker.js 2 Demo.</h1>
        <button onClick = {() => this.showMarkerArea()}>Začni</button>
        <button onClick={() => { this.markerArea.createNewMarker(markerjs2.FrameMarker); }}>Rectangle</button>
        <button onClick={() => { this.markerArea.createNewMarker(markerjs2.EllipseFrameMarker); }}>Ellipse</button>
        <button onClick={() => { this.markerArea.stepZoom(); }}>Zoom in</button>
        <img ref={this.imgRef} 
          src={slika} 
          alt="sample" 
          style={{ maxWidth: '50%' }}
          //onClick = {() => this.showMarkerArea()}
          />
      </div>
    );
  }
}

export default App;
