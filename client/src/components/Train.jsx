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
            <Row className="mt-5" hidden={props.trainingFinished}>
                <Col></Col>
                <Col>
                    <Form.Label>Model name</Form.Label>
                    <Form.Control disabled={props.alreadyTraining} onChange={e => { props.onEnterModelName(e)}} type="text" placeholder="Enter model name"/>
                    <p className="text-danger mt-1">Please enter valid model name</p>
                    <Form.Check disabled={props.alreadyTraining} type="checkbox" className="mt-3" onClick={() => {props.onTrainTestSplit()}} label="Train-Test split (70-30 split)"/>
                    <Button variant="success" className="mt-3" onClick={() => {props.onTrain()}} disabled={props.alreadyTraining}>
                        <div hidden={!props.alreadyTraining} className="spinner-border spinner-border-sm me-2" role="status"></div>
                        {props.alreadyTraining ? "Training..." : "Train"}
                    </Button>
                    <Button hidden={!props.alreadyTraining} variant="danger mt-3 ms-3">Cancel training</Button>
                </Col>
                <Col></Col>
            </Row>
            <Row className="mt-5" hidden={!props.trainingFinished}>
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