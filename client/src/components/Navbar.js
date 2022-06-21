import './Navbar.css';
import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

function Navigation(props){
    return (
        <div className="Navbar">
            <Navbar bg="dark" expand="lg" variant="dark">
            <Container>
                <Navbar.Brand>Object Counter</Navbar.Brand>
                <Nav>
                <Nav.Link href="#">Load dataset</Nav.Link>
                <Nav.Link href="#1">Save dataset</Nav.Link>
                <Nav.Link href="#3">Load model</Nav.Link>
                <Nav.Link href="#4">Train</Nav.Link>
                <Nav.Link href="#5">Predict</Nav.Link>
                </Nav>
            </Container>
            </Navbar>
        </div>
    );
}

export default Navigation;
