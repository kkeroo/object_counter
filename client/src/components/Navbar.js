import './Navbar.css';
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
                        <Nav.Link href="#" onClick={() => {props.onLoadDataset()}}>Load dataset</Nav.Link>
                        <Nav.Link href="#1" onClick={() => {props.onAnnotate()}} disabled={props.disableAnnotate}>Annotate</Nav.Link>
                        <Nav.Link href="#3" onClick={() => {props.onLoadModel()}}>Load model</Nav.Link>
                        <Nav.Link href="#4" onClick={() => {props.onTrainModel()}}>Train</Nav.Link>
                        <Nav.Link href="#5" onClick={() => {props.onPredict()}}>Predict</Nav.Link>
                        <Nav.Link className="text-warning" size="sm" onClick={() => {props.onReset()}}>Reset</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Container>
            </Navbar>
        </div>
    );
}

export default Navigation;
