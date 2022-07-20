import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const LoadDataset = (props) => {
    return(
    <div className="LoadDataset">
        <Modal show={props.show} onHide={props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>{(props.image_lenght == 0) ? "Upload dataset" : "Current dataset"}</Modal.Title>
            </Modal.Header>
        <Modal.Body>
            <Form onSubmit={props.onSaveDataset} hidden={props.image_lenght != 0}>
                <Form.Group>
                    <Form.Label>Upload dataset on server</Form.Label>
                    <Form.Control required type="file" multiple accept="image/jpg, image/png" onChange={e => { props.onImageSelected(e) }}/>
                </Form.Group>
            </Form>
            <div className="" hidden={props.image_lenght == 0}>
                <p>Total images: {props.image_lenght}</p>
            </div>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="danger" onClick={props.onDeleteDataset} hidden={props.image_lenght == 0}>
                Delete
            </Button>
            <Button variant="secondary" onClick={props.onClose}>
                Close
            </Button>
            <Button variant="primary" onClick={props.onServerUpload} hidden={props.image_lenght > 0} disabled={props.uploadingImages}>
                {props.uploadingImages ? "Uploading..." : "Upload"}
            </Button>
        </Modal.Footer>
        </Modal>
    </div>
    );
}

export default LoadDataset