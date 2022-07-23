import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/esm/Container';
import Row from 'react-bootstrap/Row';
import ImageList from './ImageList';
import './Predict.css';

const Predict = (props) => {
    return (
        <Container fluid>
            <Row className="mt-5" hidden={props.predictingFinished}>
                <Col></Col>
                <Col>
                    <Form.Label>Inference method</Form.Label>
                    <select className="form-select" onChange={(e) => {props.onSelectMethod(e)}}>
                        <option selected value="">Choose a method</option>
                        <option value="custom">Custom model</option>
                        <option value="faster_rcnn">Faster R-CNN model</option>
                        <option value="famnet">FamNet model</option>
                    </select>

                    <Form.Label className="mt-2">Images for prediction</Form.Label>
                    
                    {/* Used with every method but FamNet */}
                    <Form.Control required type="file" hidden={props.method == 'famnet'} disabled={props.alreadyPredicting} multiple accept="image/jpg, image/png" onChange={e => { props.onImageSelected(e) }}/>

                    {/* Used only with FamNet */}
                    <Form.Text hidden={props.method != 'famnet'}><br></br>For FamNet method images with annotations are used.<br></br></Form.Text>

                    {/* Used only for custom method */}
                    <Form.Label className="mt-2" hidden={props.method !== 'custom'}>Label</Form.Label>
                    <Form.Control type="text" disabled={props.alreadyPredicting} hidden={props.method !== 'custom'} onChange={e => {props.onEnterLabel(e)}} placeholder="Enter the name of objects"/>
                    
                    {/* Used only for Faster R-CNN method */}
                    <Form.Label hidden={props.method !== 'faster_rcnn'} className="mt-2">Category</Form.Label>
                    <select hidden={props.method !== 'faster_rcnn'} className="form-select" onChange={(e) => {props.onEnterLabel(e)}}>
                        <option value="" selected>Select category</option>
                        {props.categories.map(category => (
                            <option value={category}>{category}</option>
                        ))}
                    </select>

                    {/* Used with every method but FamNet method */}
                    <Form.Label hidden={props.method === "famnet"} className="mt-2">Detection threshold</Form.Label>
                    <Form.Control type="number" hidden={props.method === "famnet"} disabled={props.alreadyPredicting} min="0" max="1" onChange={e => {props.onEnterDetectionThreshold(e)}} placeholder="Enter the detection threshold"/>

                    {/* Used only with custom method */}
                    <div className="mt-2" hidden={props.method !== 'custom'}>
                        <p hidden={props.model == null}>Selected model: <strong>{props.model}</strong></p>
                        <p hidden={props.model != null}>Please first upload a model</p>
                    </div>

                    <div class=" mt-2 alert alert-warning" role="alert" hidden={props.errorMessage == ""}>
                        {props.errorMessage}
                    </div>

                    <Button variant="success" className="mt-3" onClick={() => {props.onPredict()}} disabled={props.alreadyPredicting}>
                        <div hidden={!props.alreadyPredicting} className="spinner-border spinner-border-sm me-2" role="status"></div>
                        {props.alreadyPredicting ? "Predicting..." : "Predict"}
                    </Button>
                    <Button hidden={!props.alreadyPredicting} onClick={() => {props.onCancelPredicting()}} variant="danger mt-3 ms-3">Cancel predicting</Button>
                </Col>
                <Col></Col>
            </Row>

            <Row className="" hidden={!props.predictingFinished}>
                <Col lg="9">
                    <div className="predict-img-container mt-4 me-5">
                        <img
                        className="predict-img"
                        // crossorigin="anonymous"
                        src={props.predictedImage.path}
                        hidden={props.predictedImage === ""}
                        />
                    </div>
                </Col>
                <Col lg="3" className="toolbox">
                    <h4 className="mt-5 ms-5 text-light">Detections</h4>
                    <p className="mt-3 ms-5 text-light">
                        Total Images: {props.images.length} <br/>
                        Total detections: {props.predictedImage.count}
                    </p>
                    <ImageList
                        images={props.images}
                        onPreviewSelectedImage={props.onSelectedImage}
                        >
                    </ImageList>
                    <a className="btn btn-primary mt-2 ms-5" href="http://localhost:8888/predict/" download="predictions.zip" >Download</a>
                    <a className="btn btn-danger mt-2 ms-2" onClick={() => {props.onReset()}}>Reset</a>
                </Col>
            </Row>
        </Container>
    )
};

export default Predict;