import React, { useState } from "react";

const LoadDataset = () => {
    const [images, setImages] = useState(null);
    
    const imageSelected = (event) => { 
        console.log(event.target.files);
        setImages(event.target.files);
    };

    return (
        <div className="LoadDataset">
            <input type="file" multiple name="myImage" onChange={(e) => {imageSelected(e);}}/>
            <div>
                <img alt="not found" src={images != null ? URL.createObjectURL(images[1]) : ""}/>
            </div>
        </div>
    );
}

export default LoadDataset