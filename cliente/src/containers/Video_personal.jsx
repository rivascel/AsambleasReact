import React from "react";

const VideoPersonal = () => {
  return (
    <div className="space-y-6">
        {/* Video intervención del propietario */}
        <div className="bg-white p-4 rounded shadow-md">
            <h3 className="text-lg font-medium mb-2">
            Video intervención - propietario
            </h3>
            <video
            id="localVideo"
            autoPlay
            playsInline
            muted
            className="w-full rounded border mb-4"
            ></video>

            <div className="flex gap-4">
            <button
                type="button"
                id="cameraBtn"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Cámara
            </button>
            <button
                type="button"
                id="hangupBtn"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
                Colgar
            </button>
            </div>
        </div>
    </div>
  );
};

export default VideoPersonal;