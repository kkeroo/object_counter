import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/esm/Container';
import Row from 'react-bootstrap/Row';
import Stack from 'react-bootstrap/Stack';
import ImageList from './ImageList';
import './Predict.css';
import React, { Component } from 'react';
import * as markerjs2 from 'markerjs2';

// const Predict = (props) => {
class Predict extends Component {

    constructor(props){
        super(props);
        this.imgRef = React.createRef();
        this.markerArea = null;
        this.count = 0;
        this.marker_size = 4;
        this.state = {
            editing: false,
            h_ratio: 0,
            w_ratio: 0,
            count: 0,
            annotations: null
        };
    }

    getImageDims = (src, cb) => {
        let img = new Image();
        img.src = src;
        img.onload = function() { cb(this.width, this.height); }
    }
    
    getCount = () => {
        let img_name = this.props.predictedImage.name;
        for (let i = 0; i < this.state.annotations.length; i++){
            if (img_name === this.state.annotations[i].name){
                return this.state.annotations[i].count;
            }
        }
    }

    setCount = () => {
        let img_name = this.props.predictedImage.name;
        for (let i = 0; i < this.state.annotations.length; i++){
            if (img_name === this.state.annotations[i].name){
                this.setState(prevState => ({ ...prevState, count: this.state.annotations[i].count }));
            }
        }
    }

    changeCount = (increase) => {
        let img_name = this.props.predictedImage.name;
        if (!increase) {
            // we decrease count by 1
            if (this.getCount() > 0) {
                let new_anns = this.state.annotations;
                let anns_obj = this.getAnnotationsFromCurrentImage();
                anns_obj.annotations.count = this.getCount() - 1;
                new_anns[anns_obj.ix] = anns_obj.annotations;
                this.setState(prevState => ({ ...prevState, annotations: new_anns }), () => { this.setCount(); });
            }
        }
        else{
            let new_anns = this.state.annotations;
            let anns_obj = this.getAnnotationsFromCurrentImage();
            anns_obj.annotations.count = this.getCount() + 1;
            new_anns[anns_obj.ix] = anns_obj.annotations;
            this.setState(prevState => ({ ...prevState, annotations: new_anns }), () => { this.setCount(); });
        }
    }


    getAnnotationsFromCurrentImage = () => {
        let img_name = this.props.predictedImage.name;
        console.log(img_name);
        for (let i = 0; i < this.state.annotations.length; i++){
            if (img_name === this.state.annotations[i].name){
                console.log(i);
                return {ix: i, annotations: this.state.annotations[i]};
            }
        }
        return null;
    }

    resizeImage = () => {
        let img_col = document.getElementsByClassName('image-col')[0];
        let slika = document.getElementsByClassName('predict-img')[0];

        this.getImageDims(slika.src, (width, height) => {
            if (width > height){
                let ratio = height / width;
                let desired_width = img_col.clientWidth - 30;
                let desired_height = desired_width * ratio;
                
                if (desired_height > img_col.clientHeight - 30) {
                    desired_height = img_col.clientHeight-30;
                    desired_width = desired_height / ratio;
                }
                slika.width = desired_width;
                slika.height = desired_height;

                this.setState(prevState => ({ ...prevState, h_ratio: desired_height/height, w_ratio: desired_width/width }));
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

                this.setState(prevState => ({ ...prevState, h_ratio: desired_height/height, w_ratio: desired_width/width }));
            }
            // this.setCount();
            if (this.state.annotations == null) this.setState(prevState => ({ ...prevState, annotations: this.props.images }), () => { this.setCount() });
            else this.setCount();
        });
    }
    
    showMarkerArea(){
        if (this.state.editing) return;
        if (this.imgRef.current !== null) {
            // create a marker.js MarkerArea
            this.markerArea = new markerjs2.MarkerArea(this.imgRef.current);
            
            // Settings
            this.markerArea.settings.defaultColor = 'red';
            this.markerArea.settings.defaultFillColor = this.props.method === "famnet" ? 'red' : 'transparent';
            this.markerArea.uiStyleSettings.toolbarHeight = 0;
            this.markerArea.uiStyleSettings.hideToolbar = true;
            this.markerArea.uiStyleSettings.hideBox = true;
            this.markerArea.zoomSteps = [1, 1.5, 2, 2.5, 3];
            this.markerArea.uiStyleSettings.zoomButtonVisible = true;
            this.markerArea.settings.defaultStrokeWidth = 2;
            
            // attach an event handler to assign annotated image back to our image element
            this.markerArea.addEventListener('render', event => {
                let myState = event.state;
                let new_anns = this.state.annotations;
                let anns_obj = this.getAnnotationsFromCurrentImage();
                anns_obj.annotations.state = myState;
                console.log(anns_obj);
                new_anns[anns_obj.ix] = anns_obj.annotations;
                this.setState(prevState => ({ ...prevState, annotations: new_anns }));
                // this.updateAnnotatedImages(myState);
            });
            
            this.markerArea.addEventListener('show', event => {
                let anns_obj = this.getAnnotationsFromCurrentImage();
                console.log(anns_obj);
                if (anns_obj.annotations.state != null || anns_obj.annotations.state != undefined) {
                    this.markerArea.restoreState(anns_obj.annotations.state);
                    console.log("Vzamemo iz react stejta:D");
                }
                else{
                    this.recreateState();
                    // this.markerArea.restoreState(this.state.annotations);
                }
                // this.getImageAnnotations(this.state.currImage.name).then(state => {
                    // this.markerArea.restoreState(state);
                    // this.setState(prevState => ({ ...prevState, totalMarkers: state.markers.length }));
                // });
            });
            
            this.markerArea.addEventListener('markerdelete', event => {
                // if (this.state.count > 0) this.count -= 1;
                this.changeCount(false);
            });

            this.markerArea.addEventListener('markercreate', event => {
                // if (this.state.toggleInstantAnottations){
                if (event.marker.typeName === 'EllipseMarker'){
                    event.markerArea.createNewMarker(markerjs2.EllipseMarker);
                    event.marker.height = this.marker_size * this.state.h_ratio;
                    event.marker.width = this.marker_size * this.state.w_ratio;
                    event.marker.left -= this.marker_size/2 * this.state.w_ratio;
                    event.marker.top -= this.marker_size/2 * this.state.h_ratio;
                }
                    // }
                    // this.count += 1;
                this.changeCount(true);
            });
                
            // launch marker.js
            this.setState(prevState => ({...prevState, editing: true}));
            this.markerArea.show();
        }
    }
        
    finishEditing() {
        if (!this.state.editing) return;
        this.markerArea.startRenderAndClose();
        this.setState(prevState => ({...prevState, editing: false}));
    }

    recreateState = () => {
        if (this.props.method !== "famnet"){
            let anns = this.props.predictedImage.annotations;
            let slika = document.getElementsByClassName('predict-img')[0];
            this.getImageDims(slika.src, (width, height) => {
                let state = {
                    width: this.markerArea.imageWidth,
                    height: this.markerArea.imageHeight
                };

                let markers = []
                anns.forEach(ann => {
                    let left = ann[0];
                    let top = ann[1];
                    let marker_width = (ann[2] - left) * this.state.w_ratio;
                    let marker_height = (ann[3] - top) * this.state.h_ratio;
                    left *= this.state.w_ratio;
                    top *= this.state.h_ratio;
                    // console.log(x1,y1,x2,y2)


                    let marker = {
                        left: left,
                        top: top,
                        height: marker_height,
                        width: marker_width,
                        state: 'select',
                        typeName: 'FrameMarker',
                        visualTransformMatrix: {'a': 1, 'b': 0,'c': 0, 'd': 1, 'e': 0, 'f': 0},
                        containerTransformMatrix: {'a': 1, 'b': 0,'c': 0, 'd': 1, 'e': 0, 'f': 0},
                        rotationAngle: 0,
                        fillColor: 'transparent',
                        strokeColor: 'red',
                        strokeWidth: 2,
                        opacity: 1
                    }
                    markers.push(marker);
                });

                state.markers = markers;
                let new_anns = this.state.annotations;
                let anns_obj = this.getAnnotationsFromCurrentImage();
                anns_obj.annotations.state = state;
                new_anns[anns_obj.ix] = anns_obj.annotations;
                this.setState(prevState => ({ ...prevState, annotations: new_anns }));
                this.markerArea.restoreState(state);
                // console.log(this.markerArea);
            });
        }
        else{
            let xs = this.props.predictedImage.xs;
            let ys = this.props.predictedImage.ys;
            let state = {
                width: this.markerArea.imageWidth,
                height: this.markerArea.imageHeight
            };
            let markers = [];
            for (let i = 0; i < xs.length; i++){
                let x = xs[i]
                let y = ys[i]
                let left = (x - this.marker_size/2) * this.state.w_ratio;
                let top = (y - this.marker_size/2) * this.state.h_ratio;
                let marker_width = this.marker_size * this.state.w_ratio;
                let marker_height = this.marker_size * this.state.h_ratio;

                let marker = {
                    left: left,
                    top: top,
                    height: marker_height,
                    width: marker_width,
                    state: 'select',
                    typeName: 'EllipseMarker',
                    visualTransformMatrix: {'a': 1, 'b': 0,'c': 0, 'd': 1, 'e': 0, 'f': 0},
                    containerTransformMatrix: {'a': 1, 'b': 0,'c': 0, 'd': 1, 'e': 0, 'f': 0},
                    rotationAngle: 0,
                    fillColor: 'red',
                    strokeColor: 'red',
                    strokeWidth: 2,
                    opacity: 1
                }
                markers.push(marker);
            }
            state.markers = markers;
            let new_anns = this.state.annotations;
            let anns_obj = this.getAnnotationsFromCurrentImage();
            anns_obj.annotations.state = state;
            new_anns[anns_obj.ix] = anns_obj.annotations;
            this.setState(prevState => ({ ...prevState, annotations: new_anns }));
            this.markerArea.restoreState(state);
        }
    }

    zoomIn() {
        this.markerArea.stepZoom();
    }
    
    zoomOut() {
        this.markerArea.zoomLevel = 1;
    }

    render() {
        return(
            <Container fluid>
            <Row className="mt-5" hidden={this.props.predictingFinished}>
                <Col></Col>
                <Col>
                    <Form.Label>Inference method</Form.Label>
                    <select className="form-select" disabled={this.props.alreadyPredicting} onChange={(e) => {this.props.onSelectMethod(e)}}>
                        <option selected value="">Choose a method</option>
                        <option value="custom">Custom model</option>
                        <option value="faster_rcnn">Faster R-CNN model</option>
                        <option value="famnet">FamNet model</option>
                    </select>

                    <Form.Label className="mt-2">Images for counting</Form.Label>
                    <Form.Text hidden={this.props.method != 'famnet'}><br></br>For FamNet method images with annotations are used.<br></br></Form.Text>
                        
                    {/* Used with every method but FamNet */}
                    <Form.Control required type="file" hidden={this.props.method == 'famnet'} disabled={this.props.alreadyPredicting} multiple accept="image/jpg, image/png" onChange={e => { this.props.onImageSelected(e) }}/>

                    {/* Used only with FamNet */}
                    <Form.Label hidden={this.props.method != "famnet"} className="mt-2">NMS kernel size factor</Form.Label>
                    <Form.Control type="number" hidden={this.props.method != "famnet"} disabled={this.props.alreadyPredicting} min="0" max="1" defaultValue={0.7} step="0.1" onChange={e => {this.props.onEnterSizeFactor(e)}} placeholder="Enter Non-maxima suppression kernel size factor"/>

                    <Form.Text hidden={this.props.method != 'famnet'}>HINT: Use values closer to 0 (e.g. 0.3) for objects closer together and values closer to 1 for distant objects.<br></br></Form.Text>

                    {/* Used only for custom method */}
                    {/* <Form.Label className="mt-2" hidden={this.props.method !== 'custom'}>Label</Form.Label> */}
                    {/* <Form.Control type="text" disabled={this.props.alreadyPredicting} hidden={this.props.method !== 'custom'} onChange={e => {this.props.onEnterLabel(e)}} placeholder="Enter the name of objects"/> */}
                        
                    {/* Used only for Faster R-CNN method */}
                    <Form.Label hidden={this.props.method !== 'faster_rcnn'} className="mt-2">Category</Form.Label>
                    <select hidden={this.props.method !== 'faster_rcnn'} className="form-select" onChange={(e) => {this.props.onEnterLabel(e)}}>
                        <option value="" selected>Select category</option>
                        {this.props.categories.map(category => (
                            <option value={category}>{category}</option>
                        ))}
                    </select>

                    {/* Used with every method but FamNet method */}
                    <Form.Label hidden={this.props.method === "famnet"} className="mt-2">Detection threshold</Form.Label>
                    <Form.Control type="number" hidden={this.props.method === "famnet"} disabled={this.props.alreadyPredicting} min="0" max="1" onChange={e => {this.props.onEnterDetectionThreshold(e)}} placeholder="Enter the detection threshold"/>

                    {/* Used only with custom method */}
                    <div className="mt-2" hidden={this.props.method !== 'custom'}>
                        <p hidden={this.props.model == null}>Selected model: <strong>{this.props.model}</strong></p>
                        <p hidden={this.props.model != null}>Please first upload a model</p>
                    </div>

                    <div class=" mt-2 alert alert-warning" role="alert" hidden={this.props.errorMessage == ""}>
                        {this.props.errorMessage}
                    </div>

                    <Button name='predict_btn' variant="success" className="mt-3" onClick={() => {this.props.onPredict()}} disabled={this.props.alreadyPredicting}>
                        <div hidden={!this.props.alreadyPredicting} className="spinner-border spinner-border-sm me-2" role="status"></div>
                        {this.props.alreadyPredicting ? "Counting..." : "Count"}
                    </Button>
                    <Button name='cancel_btn' hidden={!this.props.alreadyPredicting} onClick={() => {this.props.onCancelPredicting()}} variant="danger mt-3 ms-3">Cancel predicting</Button>
                </Col>
                <Col></Col>
            </Row>

            <Row className="" hidden={!this.props.predictingFinished}>
                <Col lg="9" className='image-col'>
                    <div className="predict-img-container mt-3 me-4">
                        <img
                        alt='Preview image'
                        className="predict-img"
                        ref={this.imgRef}
                        crossorigin="anonymous"
                        src={this.props.predictedImage.path}
                        hidden={this.props.predictedImage === ""}
                        onLoad={this.resizeImage}
                        />
                    </div>
                </Col>
                <Col lg="3" className="toolbox">
                    <Stack direction='horizontal' gap="2" className="ms-5 me-5 mt-3">
                        <Button aria-label='start_btn' variant="success" className="me-auto ms-auto start-btn" onClick = {() => this.showMarkerArea()} disabled={this.state.editing}>
                            Re-count
                        </Button>
                        <Button aria-label='finish_btn' className="btn-danger ms-auto me-auto finish-btn" onClick={() => { this.finishEditing(); }} disabled={!this.state.editing}>Finish</Button>
                    </Stack>
                    <Stack direction="horizontal" gap="3" className="ms-2 me-2 mt-3 mb-3">
                        <Button aria-label='marker_btn' variant="primary" className="me-auto ms-auto" onClick={() => { this.markerArea.createNewMarker(markerjs2.FrameMarker); }} disabled={!this.state.editing}>
                            <i className="bi bi-plus-square"></i>
                        </Button>
                        <Button aria-label='marker_el_btn' variant="primary" className="me-auto ms-auto" onClick={() => { this.markerArea.createNewMarker(markerjs2.EllipseMarker); }} disabled={!this.state.editing}>
                            <i className="bi bi-plus-circle"></i>
                        </Button>
                        <Button aria-label='deselect_btn' variant="secondary" className="me-auto ms-auto" onClick={() => { this.markerArea.setCurrentMarker(); }} disabled={!this.state.editing}>
                            <i className="bi bi-cursor"></i>
                        </Button>
                        <Button aria-label='zoomIn_btn' variant="warning" className="me-auto ms-auto" onClick={() => { this.zoomIn(); }} disabled={!this.state.editing}>
                            <i className="bi bi-zoom-in"></i>
                        </Button>
                        <Button aria-label='zoomOut_btn' variant="warning" className="me-auto ms-auto" onClick={() => { this.zoomOut(); }} disabled={!this.state.editing}>
                            <i className="bi bi-zoom-out"></i>
                        </Button>
                    </Stack>
                    <h4 className="mt-4 ms-5 text-light">Detections</h4>
                    <p className="mt-3 ms-5 text-light">
                        Total Images: {this.props.images.length} <br/>
                        Total detections: {this.state.count}
                    </p>


                    <ImageList
                        images={this.props.images}
                        onPreviewSelectedImage={this.props.onSelectedImage}
                        >
                    </ImageList>
                    {/* <a className="btn btn-primary mt-2 ms-5" href="http://localhost:8888/predict/" download="predictions.zip" >Download</a> */}
                    <a className="btn btn-danger mt-2 ms-5" onClick={() => {this.props.onReset()}}>Reset</a>
                </Col>
            </Row>
        </Container>
        )
    }
};

export default Predict;