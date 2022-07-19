import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Container from 'react-bootstrap/esm/Container';
import Row from 'react-bootstrap/Row';
import ImageList from './ImageList';

const Predict = (props) => {
    return(
        // <div className="PredictModal">
        //     <Modal show={props.show} onHide={props.onClose}>
        //         <Modal.Header closeButton>
        //             <Modal.Title>Predict</Modal.Title>
        //         </Modal.Header>
        //     <Modal.Body>
        //         <Form.Group>
        //             <Form.Label>Upload dataset on server</Form.Label>
        //             <Form.Control required type="file" multiple accept="image/jpg, image/png" onChange={e => { props.onImageSelected(e) }}/>
        //         </Form.Group>
        //         <div className="mt-2">
        //             <p hidden={props.model == null}>Selected model: <strong>{props.model}</strong></p>
        //             <p hidden={props.model != null}>Please first upload a model</p>
        //         </div>
        //         <Form.Group>
        //             <Form.Label>Label</Form.Label>
        //             <Form.Control type="text" onChange={e => {props.onEnterLabel(e)}} placeholder="Enter the name of objects"/>
        //             <Form.Label className="mt-2">Detection threshold</Form.Label>
        //             <Form.Control type="number" min="0" max="1" onChange={e => {props.onEnterDetectionThreshold(e)}} placeholder="Enter the detection threshold"/>
        //         </Form.Group>
        //         <div class=" mt-2 alert alert-warning" role="alert" hidden={props.errorMessage == ""}>
        //             {props.errorMessage}
        //         </div>
        //     </Modal.Body>
        //     <Modal.Footer>
        //         <Button variant="danger" onClick={props.onDeleteDataset} hidden={props.image_lenght == 0}>
        //             Delete
        //         </Button>
        //         <Button variant="secondary" onClick={props.onClose}>
        //             Close
        //         </Button>
        //         <Button variant="primary" onClick={() => {props.onPredict()}} disabled={props.uploadingImages}>
        //             {props.uploadingImages ? "Uploading..." : "Upload"}
        //         </Button>
        //     </Modal.Footer>
        //     </Modal>
        // </div>
        <Container fluid>
            <Row className="mt-5" hidden={props.predictingFinished}>
                <Col></Col>
                <Col>
                    <Form.Label>Images for prediction</Form.Label>
                    <Form.Control required type="file" disabled={props.alreadyPredicting} multiple accept="image/jpg, image/png" onChange={e => { props.onImageSelected(e) }}/>

                    <Form.Label className="mt-2">Label</Form.Label>
                    <Form.Control type="text" disabled={props.alreadyPredicting} onChange={e => {props.onEnterLabel(e)}} placeholder="Enter the name of objects"/>
                    
                    <Form.Label className="mt-2">Detection threshold</Form.Label>
                    <Form.Control type="number" disabled={props.alreadyPredicting} min="0" max="1" onChange={e => {props.onEnterDetectionThreshold(e)}} placeholder="Enter the detection threshold"/>

                    <div className="mt-2">
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
                    <div className="img-container mt-4 me-5">
                        <img
                        className="slika"
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