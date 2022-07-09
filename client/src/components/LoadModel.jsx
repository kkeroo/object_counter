import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/esm/Button';

const LoadModel = (props) => {
    return(
        <div className="LoadModel">
            <Modal show={props.show} onHide={props.onClose}>
                <Modal.Header closeButton>
                    <Modal.Title>{(props.model != null) ? "Current model" : "Upload model"}</Modal.Title>
                </Modal.Header>
            <Modal.Body>
                <Form hidden={props.model != null}>
                    <Form.Group>
                        <Form.Label>Upload trained model on server</Form.Label>
                        <Form.Control required type="file" accept=".jpg" onChange={e => { props.onModelSelected(e) }}/>
                    </Form.Group>
                </Form>
                <div className="" hidden={props.model == null}>
                    <p>Currently uploaded model: <strong>model.pt</strong></p>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={props.onDeleteModel} hidden={props.model == null}>
                    Delete
                </Button>
                <Button variant="secondary" onClick={props.onClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={props.onUploadModel} hidden={props.model != null} disabled={props.uploadingModel}>
                    {props.uploadingModel ? "Uploading..." : "Upload"}
                </Button>
            </Modal.Footer>
            </Modal>
        </div>
        );
};

export default LoadModel;