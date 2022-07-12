import './LoadDataset.css';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import ImageList from './ImageList';
import Modal from 'react-bootstrap/Modal';

const LoadDataset = (props) => {

    // return (
    //     <div className="LoadDataset">
    //         <Container className="mt-3">
    //             <Row className="mb-4 mt-4">
    //                 <Col lg="1"></Col>
    //                 <Col lg="10">
    //                     <Row>
    //                         <Col>
    //                             <Form className='file-input me-3 mt-1'>
    //                                 <Form.Group controlId="formFile" className="mb-2">
    //                                     <Form.Control type="file" multiple accept=".jpg" onChange={(e) => {props.onImageSelected(e);}}/>
    //                                 </Form.Group>
    //                             </Form>
    //                         </Col>
    //                         <Col>
    //                             {/* <Button size="md" className="btn-success mt-1" onClick={() => {props.onUploadAnnotationsFile();}}>Upload annotations file</Button> */}
    //                             {/* <Form.Control className="mt-1" type="file" accept=".txt" onChange={(e) => {props.onUploadAnnotationsFile(e);}}/> */}
    //                             <p className="" variant="light">Create an image dataset. Choose files to add them to the dataset. You can choose
    //                             multiple files, multiple times.</p>
    //                         </Col>
    //                     </Row>
    //                 </Col>
    //                 <Col lg="1"></Col>
    //             </Row>
    //             <Row className="image-preview-container">
    //                 <Col sm="2" lg="2" className="pt-3"></Col>
    //                 <Col sm="6" lg="6" className="pt-3">
    //                     <img className="preview-image" src={props.previewImage != "" ? URL.createObjectURL(props.previewImage) : ""}/>
    //                 </Col>
    //                 <Col sm="4" lg="4" className="pt-3 images-list-container">
    //                     <Stack direction='horizontal' gap="3">
    //                         <h5>Uploaded images</h5>
    //                         <Button size="sm" className="btn-danger mb-2 ms-auto" onClick={() => {props.onDeleteDataset();}}>Delete dataset</Button>
    //                     </Stack>
    //                     <ImageList
    //                         images={props.images}
    //                         onPreviewSelectedImage={props.onPreviewSelectedImage}
    //                     >
    //                     </ImageList>
    //                 </Col>
    //             </Row>
    //         </Container>
    //     </div>
    // );
    // return (
    //     <div className="LoadDataset">
    //         <Container fluid className="">
    //             <Row>
    //                 <Col lg="9">
    //                     <div className="image-preview-container mt-5 me-5">
    //                         <img className="preview-image" src={props.previewImage != "" ? URL.createObjectURL(props.previewImage) : ""}/>
    //                     </div>
    //                 </Col>
    //                 <Col lg="3" className="image-list-container">
    //                     <Stack direction='horizontal' gap="3" className="mt-4 mb-3 ms-5 me-5">
    //                         <input id="image-file-input" hidden type="file" multiple accept=".jpg" onChange={(e) => {props.onImageSelected(e);}}/>
    //                         <Button size="sm" className="btn-success mb-2 me-auto" onClick={() => {document.getElementById('image-file-input').click()}}>Upload Dataset</Button>
    //                         <Button size="sm" className="btn-danger mb-2 ms-auto" onClick={() => {props.onDeleteDataset();}}>Delete dataset</Button>
    //                     </Stack>
    //                     <h5 className="text-light mt-2 ms-5">Uploaded images</h5>
    //                     <h6 className="ms-5 mt-2 mb-2 text-light">Total images: {props.images.length}</h6>
    //                     <ImageList
    //                         images={props.images}
    //                         onPreviewSelectedImage={props.onPreviewSelectedImage}
    //                     >
    //                     </ImageList>
    //                     <Button variant="success" disabled={props.uploadingImages} className="ms-5 mt-2" onClick={() => {props.onServerUpload()}}>
    //                         {props.uploadingImages ? "Uploading..." : "Upload on server"}
    //                     </Button>
    //                 </Col>
    //             </Row>
                
    //         </Container>
    //     </div>
    // );
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