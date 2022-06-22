import './LoadDataset.css';
import React, { useState } from "react";
import Navbar from './Navbar';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';

const LoadDataset = () => {
    const [images, setImages] = useState(new Array());
    const [previewImage, setPreviewImage] = useState("");
    
    const imageSelected = (event) => { 
        //console.log(event.target.files);
        for (let file of event.target.files) {
            setImages(current => [...current, file]);
        }
    };

    const izpis = () => {
        console.log(images);
    };

    const previewSelectedImage = (image) => {
        setPreviewImage(image);
        console.log(image);
    }

    return (
        <div className="LoadDataset">
            <Navbar></Navbar>
            <Container className="mt-3">
                <Form className='file-input'>
                    <Form.Group controlId="formFile" className="mb-2">
                        <Form.Control type="file" multiple accept=".jpg" onChange={(e) => {imageSelected(e);}}/>
                    </Form.Group>
                </Form>
                <button onClick={izpis()}>Izpisi</button>
                <Row>
                    <Col sm="2" lg="2"></Col>
                    <Col sm="6" lg="6">
                        <img alt="not found" className="preview-image" src={previewImage != "" ? URL.createObjectURL(previewImage) : ""}/>
                    </Col>
                    <Col sm="4" lg="4" className="images-list-container">
                        <Stack direction='horizontal' gap="3" className="s">
                            <h5>Uploaded images</h5>
                            <Button size="sm" className="btn-danger mb-2 ms-auto">Delete dataset</Button>
                        </Stack>
                        <ListGroup as="ul" className="images-list">
                            {
                                images.map((image) => (
                                    <ListGroup.Item action href={image.name} id={image.name} as="li" onClick={() => {previewSelectedImage(image)}}>{image.name}</ListGroup.Item>
                                ))
                            }
                        </ListGroup>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default LoadDataset