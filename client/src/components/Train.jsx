import './Train.css';

import React, { useState } from "react";
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Row from "react-bootstrap/esm/Row";
import Col from "react-bootstrap/esm/Col";

const Train = (props) => {
    return (
        <Container className="Train">
            <Row className="mt-5">
                <Col></Col>
                <Col>
                    <Form.Label>Model name</Form.Label>
                    <Form.Control disabled type="text" placeholder="Enter model name"/>
                    <p className="text-danger mt-1">Please enter valid model name</p>
                    <Form.Check disabled type="checkbox" className="mt-3" label="Train-Test split (70-30 split)"/>
                    <Button variant="success" className="mt-3" disabled>
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Training...
                    </Button>
                    <Button variant="danger mt-3 ms-3">Cancel training</Button>
                </Col>
                <Col></Col>
            </Row>
            <Row className="mt-5">
                <Col></Col>
                <Col>
                    <h4>Training Finished</h4>
                    <p>Train loss: 0.1245 |
                    Validation loss: 0.23211
                    </p>
                    <Button variant="success" className="mt-2">
                        Download model
                    </Button>
                </Col>
                <Col></Col>
            </Row>
            <Row className="mt-5">
                <Col></Col>
                <Col>
                <div class="alert alert-danger" role="alert">
                    A simple danger alert—check it out!
                </div>
                </Col>
                <Col></Col>
            </Row>
        </Container>
    )
}

export default Train;