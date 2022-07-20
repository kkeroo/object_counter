import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';

function Navigation(props){
    return (
        <div className="Navbar">
            <Navbar bg="dark" expand="lg" variant="dark">
            <Container className="me-auto ms-auto">
                <Navbar.Brand>Object Counter</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav justify-content-end">
                    <Nav className="ms-auto">
                        <Nav.Link href="#" onClick={() => {props.onLoadDataset()}} active={false}>Load dataset</Nav.Link>
                        <Nav.Link href="#1" onClick={() => {props.onAnnotate()}} active={props.page === "annotate"}>Annotate</Nav.Link>
                        <Nav.Link href="#3" onClick={() => {props.onLoadModel()}} active={false}>Load model</Nav.Link>
                        <Nav.Link href="#4" onClick={() => {props.onTrainModel()}} active={props.page === "train"}>Train</Nav.Link>
                        <Nav.Link href="#5" onClick={() => {props.onPredict()}} active={props.page === "predict"}>Predict</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
            </Navbar>
        </div>
    );
}

export default Navigation;
