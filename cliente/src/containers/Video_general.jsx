import React from "react";

const VideoGeneral = () => {
  return (
    <div className="space-y-6">
      {/* Transmisión en vivo */}
      <div className="bg-white p-4 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-2">Asamblea en vivo</h2>
        <video
          id="remoteVideo"
          autoPlay
          playsInline
          className="w-full rounded border"
        ></video>
      </div>
    </div>
    )
};

export default VideoGeneral;