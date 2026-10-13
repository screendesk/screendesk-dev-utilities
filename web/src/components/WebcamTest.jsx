import { useState, useEffect, useRef } from 'react'
import { DeviceSelector } from '@/components/DeviceSelector'
import { PermissionRequest } from '@/components/PermissionRequest'
import { VideoCameraIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Badge, ui } from '@/components/tools/toolUi'

export function WebcamTest({ permissions, setPermissions, combined = false }) {
  const videoRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to enumerate devices
  const enumerateDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = deviceList.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);

      // Select the first device by default if available
      if (videoDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
      setError('Unable to access camera devices. Please ensure your browser supports camera access.');
    }
  };

  // Function to start the webcam
  const startWebcam = async () => {
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request camera access with the selected device (or default if none selected)
      const constraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Update permissions state
      setPermissions(prev => ({ ...prev, camera: 'granted' }));

      // Set the stream and connect to video element
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Enumerate devices again to get labels (which are only available after permission)
      enumerateDevices();

    } catch (err) {
      console.error('Error accessing webcam:', err);

      // Handle permission denied
      if (err.name === 'NotAllowedError') {
        setPermissions(prev => ({ ...prev, camera: 'denied' }));
        setError('Camera access denied. Please allow camera access in your browser settings.');
      }
      // Handle device not found
      else if (err.name === 'NotFoundError') {
        setError('No camera detected. Please connect a camera and try again.');
      }
      // Handle other errors
      else {
        setError(`Error accessing camera: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle device selection change
  const handleDeviceChange = (deviceId) => {
    setSelectedDeviceId(deviceId);
  };

  // Initialize component state on mount
  useEffect(() => {
    // Don't auto-start, just set loading to false
    setIsLoading(false);

    // Enumerate devices to populate the selector
    enumerateDevices();

    // Clean up function to stop all tracks when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Restart webcam when selected device changes
  useEffect(() => {
    if (selectedDeviceId && permissions.camera === 'granted') {
      startWebcam();
    }
  }, [selectedDeviceId]);

  // Listen for device change events from the hero section
  useEffect(() => {
    const handleDeviceChange = (event) => {
      if (event.detail && event.detail.deviceId) {
        setSelectedDeviceId(event.detail.deviceId);
      }
    };

    const handleTestRequest = () => {
      // Always try to start webcam when requested
      // This handles both permission requests and device activation
      startWebcam();
    };

    window.addEventListener('webcam-device-change', handleDeviceChange);
    window.addEventListener('webcam-test-request', handleTestRequest);

    return () => {
      window.removeEventListener('webcam-device-change', handleDeviceChange);
      window.removeEventListener('webcam-test-request', handleTestRequest);
    };
  }, [permissions.camera]);

  // Populate the device selector in the hero section
  useEffect(() => {
    if (devices.length > 0) {
      // Find the camera select on the page
      const select = document.getElementById('camera-selector');
      if (select) {
        // Clear existing options except the first one
        while (select.options.length > 1) {
          select.remove(1);
        }

        // Add device options
        devices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.text = device.label || `Camera ${device.deviceId.substring(0, 8)}`;
          option.selected = device.deviceId === selectedDeviceId;
          select.appendChild(option);
        });

        // Add event listener to the select element
        const handleSelectChange = (e) => {
          if (e.target.value && e.target.value !== 'Select Camera') {
            setSelectedDeviceId(e.target.value);
          }
        };

        // Remove any existing event listeners to prevent duplicates
        select.removeEventListener('change', handleSelectChange);
        select.addEventListener('change', handleSelectChange);
      }
    }
  }, [devices, selectedDeviceId]);

  // Combined mode for the hero section
  if (combined) {
    return (
      <div className="h-full w-full">
        {permissions.camera === 'granted' ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                <div className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-400"></div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 p-6">
                <div className="text-center">
                  <ExclamationTriangleIcon className="mx-auto mb-3 size-6 text-amber-400" />
                  <p className="text-sm text-zinc-200">{error}</p>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
              onLoadedMetadata={() => setIsLoading(false)}
            />

            {/* Recording indicator */}
            {!error && !isLoading && (
              <div className="absolute top-3 right-3 flex items-center rounded-md bg-black/60 px-2 py-1">
                <div className="mr-1.5 size-1.5 rounded-full bg-rose-400"></div>
                <span className="text-xs font-medium text-white">Camera active</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-6">
            <div className="text-center">
              {permissions.camera === 'denied' ? (
                <>
                  <ExclamationTriangleIcon className="mx-auto mb-4 size-8 text-amber-400" />
                  <h3 className="mb-1 text-sm font-medium text-white">Camera Access Denied</h3>
                  <p className="mb-5 text-sm text-zinc-400">Please allow camera access in your browser settings.</p>
                  <button
                    onClick={startWebcam}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 grid size-12 place-items-center rounded-lg border border-zinc-700 bg-zinc-800">
                    <VideoCameraIcon className="size-6 text-zinc-300" />
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-white">Video Offline</h3>
                  <p className="mb-5 text-sm text-zinc-400">Allow access to begin testing your camera</p>
                  <button
                    onClick={startWebcam}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                  >
                    Allow Camera Access
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Standard mode for the troubleshooting section
  return (
    <div className={ui.card}>
      <div className={ui.cardBody}>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3 grid size-9 place-items-center rounded-lg border border-zinc-200 bg-zinc-50">
              <VideoCameraIcon className="size-5 text-zinc-700" />
            </div>
            <h3 className={ui.cardTitle}>Webcam Test</h3>
          </div>

          {/* Status indicator */}
          {permissions.camera === 'granted' && !error && !isLoading && (
            <Badge tone="positive">Ready</Badge>
          )}
          {permissions.camera === 'denied' && (
            <Badge tone="negative">Access denied</Badge>
          )}
        </div>

        {/* Camera preview */}
        <div className="relative mb-5 aspect-video overflow-hidden rounded-lg bg-zinc-900">
          {permissions.camera === 'granted' ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                  <div className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-rose-400"></div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 p-6">
                  <div className="text-center">
                    <ExclamationTriangleIcon className="mx-auto mb-3 size-6 text-amber-400" />
                    <p className="text-sm text-zinc-200">{error}</p>
                  </div>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
                onLoadedMetadata={() => setIsLoading(false)}
              />

              {/* Recording indicator */}
              {!error && !isLoading && (
                <div className="absolute top-3 right-3 flex items-center rounded-md bg-black/60 px-2 py-1">
                  <div className="mr-1.5 size-1.5 rounded-full bg-rose-400"></div>
                  <span className="text-xs font-medium text-white">Camera active</span>
                </div>
              )}
            </>
          ) : (
            <PermissionRequest
              type="camera"
              permissions={permissions}
              onRequestPermission={startWebcam}
            />
          )}
        </div>

        {/* Device selector and status */}
        <div className="space-y-4">
          {/* Device selector */}
          {permissions.camera === 'granted' && devices.length > 0 && (
            <DeviceSelector
              label="Select camera"
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onChange={handleDeviceChange}
              icon={
                <svg className="size-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            />
          )}

          {/* Status and help text */}
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            {permissions.camera === 'granted' ? (
              error ? (
                <div>
                  <p className="mb-3 text-amber-700">{error}</p>
                  <button
                    onClick={startWebcam}
                    className={ui.primaryButton}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <p>Your camera is working properly. If you can see yourself above, your webcam is ready for recording.</p>
              )
            ) : permissions.camera === 'denied' ? (
              <div>
                <p className="text-red-700">Camera access denied. Please allow camera access in your browser settings and try again.</p>
              </div>
            ) : (
              <p>Click the "Start Camera Test" button above to test your webcam.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
