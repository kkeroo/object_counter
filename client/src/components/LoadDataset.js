import './LoadDataset.css';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import ImageList from './ImageList';

const LoadDataset = (props) => {

    return (
        <div className="LoadDataset">
            <Container className="mt-3">
                <Row className="mb-4 mt-4">
                    <Col lg="1"></Col>
                    <Col lg="10">
                        <Row>
                            <Col>
                                <Form className='file-input me-3 mt-1'>
                                    <Form.Group controlId="formFile" className="mb-2">
                                        <Form.Control type="file" multiple accept=".jpg" onChange={(e) => {props.onImageSelected(e);}}/>
                                    </Form.Group>
                                </Form>
                            </Col>
                            <Col>
                                {/* <Button size="md" className="btn-success mt-1" onClick={() => {props.onUploadAnnotationsFile();}}>Upload annotations file</Button> */}
                                <Form.Control className="mt-1" type="file" accept=".txt" onChange={(e) => {props.onUploadAnnotationsFile(e);}}/>
                                {/* <p className="" variant="light">Create an image dataset. Choose files to add them to the dataset. You can choose
                                multiple files, multiple times.</p> */}
                            </Col>
                        </Row>
                    </Col>
                    <Col lg="1"></Col>
                </Row>
                <Row className="image-preview-container">
                    <Col sm="2" lg="2" className="pt-3"></Col>
                    <Col sm="6" lg="6" className="pt-3">
                        <img className="preview-image" src={props.previewImage != "" ? URL.createObjectURL(props.previewImage) : ""}/>
                    </Col>
                    <Col sm="4" lg="4" className="pt-3 images-list-container">
                        <Stack direction='horizontal' gap="3">
                            <h5>Uploaded images</h5>
                            <Button size="sm" className="btn-danger mb-2 ms-auto" onClick={() => {props.onDeleteDataset();}}>Delete dataset</Button>
                        </Stack>
                        <ImageList
                            images={props.images}
                            onPreviewSelectedImage={props.onPreviewSelectedImage}
                        >
                        </ImageList>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default LoadDataset