import React, { useState } from "react";
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

const SaveDataset = (props) => {
    return (
        <>
        <Modal show={props.show} onHide={props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Save dataset</Modal.Title>
            </Modal.Header>
        <Modal.Body>
            <p>In order to save current annotations on your dataset, set the name of a 
                file where the information about the annotations will be stored.
                You will need that file when you will want to continue annotate images next time.</p>
            <Form onSubmit={props.onSaveDataset}>
                <Form.Group>
                    <Form.Label>File name</Form.Label>
                    <Form.Control required type="text" onChange={e => { props.onFileNameEnter(e.target.value) }} placeholder="Enter file name"/>
                    <p className="text-danger mt-1">{props.errorMessage}</p>
                </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={props.onClose}>
                Close
            </Button>
            <Button variant="primary" onClick={props.onSaveDataset}>
                Save
            </Button>
        </Modal.Footer>
        </Modal>
        </>
    )
}

export default SaveDataset;