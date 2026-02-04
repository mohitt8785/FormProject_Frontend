import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

const CameraInput = ({ label, name, setFile, error }) => {
  const webcamRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState("environment"); // user | environment

  const startCamera = () => setCameraOn(true);

  const switchCamera = () => {
    setFacingMode((prev) =>
      prev === "user" ? "environment" : "user"
    );
  };

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();

    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `${name}.jpg`, {
          type: "image/jpeg",
        });
        setFile(file);
        setPreview(imageSrc);
        setCameraOn(false);
      });
  };

  return (
    <div className="form-group">
      <label>{label} *</label>

      {!cameraOn && !preview && (
        <button type="button" onClick={startCamera} className="camera-btn">
          📷 Open Camera
        </button>
      )}

      {cameraOn && (
        <>
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode }}
            width="100%"
          />

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>

            <button type="button" onClick={switchCamera} className="switch-btn">
              🔄 Switch Camera
            </button>

            
            <button type="button" onClick={capture} className="capture-btn">
              📸 Capture
            </button>

    
          </div>
        </>
      )}

      {preview && (
        <>
          <img src={preview} alt="preview" width="100%" />
          <button type="button" onClick={() => setPreview(null)} className="retake-btn">
            🔄 Retake
          </button>
        </>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
};


export default CameraInput;
