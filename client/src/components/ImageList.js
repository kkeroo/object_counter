import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ListGroup from 'react-bootstrap/ListGroup';

const ImageList = (props) => {
    return (
        <ListGroup as="ul" className="images-list">
        {
            props.images.map((image) => (
                <ListGroup.Item action href={image.name} id={image.name} as="li" onClick={() => {props.onPreviewSelectedImage != null && props.onPreviewSelectedImage(image)}}>{image.name}</ListGroup.Item>
            ))
        }
        </ListGroup>
    )
};

export default ImageList;