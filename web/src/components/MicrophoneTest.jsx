import { useState, useEffect, useRef } from 'react'
import { DeviceSelector } from '@/components/DeviceSelector'
import { PermissionRequest } from '@/components/PermissionRequest'
import { MicrophoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Badge, ui } from '@/components/tools/toolUi'

export function MicrophoneTest({ permissions, setPermissions, combined = false, visualOnly = false }) {
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [volume, setVolume] = useState(0);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Function to enumerate devices
  const enumerateDevices = async () => {
    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = deviceList.filter(device => device.kind === 'audioinput');
      setDevices(audioDevices);

      // Select the first device by default if available
      if (audioDevices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
      setError('Unable to access microphone devices. Please ensure your browser supports microphone access.');
    }
  };

  // Function to start the microphone
  const startMicrophone = async () => {
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    // Clean up previous audio context
    if (audioContextRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request microphone access with the selected device (or default if none selected)
      const constraints = {
        audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      // Update permissions state
      setPermissions(prev => ({ ...prev, microphone: 'granted' }));

      // Set the stream
      setStream(mediaStream);

      // Set up audio analyzer
      setupAudioAnalyzer(mediaStream);

      // Enumerate devices again to get labels (which are only available after permission)
      enumerateDevices();

    } catch (err) {
      console.error('Error accessing microphone:', err);

      // Handle permission denied
      if (err.name === 'NotAllowedError') {
        setPermissions(prev => ({ ...prev, microphone: 'denied' }));
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      }
      // Handle device not found
      else if (err.name === 'NotFoundError') {
        setError('No microphone detected. Please connect a microphone and try again.');
      }
      // Handle other errors
      else {
        setError(`Error accessing microphone: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Set up audio analyzer
  const setupAudioAnalyzer = (mediaStream) => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();

      // Create analyzer
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      // Connect stream to analyzer
      const source = audioContextRef.current.createMediaStreamSource(mediaStream);
      source.connect(analyserRef.current);

      // Set up data array for analyzer
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      // Start volume calculation
      calculateVolume();
    } catch (err) {
      console.error('Error setting up audio analyzer:', err);
      setError('Error setting up audio visualization. Your microphone is working, but visualization is not available.');
    }
  };

  // Calculate audio volume level
  const calculateVolume = () => {
    if (!analyserRef.current) return;

    // Get audio data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const avg = sum / dataArrayRef.current.length;
    const normalizedVolume = Math.min(avg / 128, 1);
    setVolume(normalizedVolume);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(calculateVolume);
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

    // Clean up function when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (audioContextRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        audioContextRef.current.close();
      }
    };
  }, [visualOnly]);

  // Restart microphone when selected device changes
  useEffect(() => {
    if (selectedDeviceId && permissions.microphone === 'granted' && !visualOnly) {
      startMicrophone();
    }
  }, [selectedDeviceId, visualOnly]);

  // Listen for device change events from the hero section
  useEffect(() => {
    const handleDeviceChange = (event) => {
      if (event.detail && event.detail.deviceId) {
        setSelectedDeviceId(event.detail.deviceId);
      }
    };

    const handleTestRequest = () => {
      // Always try to start microphone when requested (if not visual-only)
      // This handles both permission requests and device activation
      if (!visualOnly) {
        startMicrophone();
      }
    };

    window.addEventListener('microphone-device-change', handleDeviceChange);
    window.addEventListener('microphone-test-request', handleTestRequest);

    return () => {
      window.removeEventListener('microphone-device-change', handleDeviceChange);
      window.removeEventListener('microphone-test-request', handleTestRequest);
    };
  }, [permissions.microphone, visualOnly]);

  // Populate the device selector in the hero section
  useEffect(() => {
    if (devices.length > 0) {
      // Find the microphone select on the page
      const select = document.getElementById('microphone-selector');
      if (select) {
        // Clear existing options except the first one
        while (select.options.length > 1) {
          select.remove(1);
        }

        // Add device options
        devices.forEach(device => {
          const option = document.createElement('option');
          option.value = device.deviceId;
          option.text = device.label || `Microphone ${device.deviceId.substring(0, 8)}`;
          option.selected = device.deviceId === selectedDeviceId;
          select.appendChild(option);
        });

        // Add event listener to the select element
        const handleSelectChange = (e) => {
          if (e.target.value && e.target.value !== 'Select Microphone') {
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
    // If visualOnly is true, only render the volume indicator
    if (visualOnly) {
      return (
        <div className="w-full">
          {permissions.microphone === 'granted' && !error && !isLoading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MicrophoneIcon className="mr-2 size-4 text-zinc-300" />
                  <span className="text-white text-sm font-medium">Microphone</span>
                </div>
                <div className="flex items-center">
                  <div className="mr-1.5 size-1.5 rounded-full bg-rose-400"></div>
                  <span className="text-xs text-zinc-300">Active</span>
                </div>
              </div>

              {/* Volume indicator */}
              <div className="w-full">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-rose-400 transition-[width] duration-100"
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MicrophoneIcon className="mr-2 size-4 text-zinc-300" />
                <span className="text-white text-sm font-medium">Microphone</span>
              </div>
              <span className="text-xs text-zinc-300">
                {permissions.microphone === 'denied' ? 'Access Denied' : 'Offline'}
              </span>
            </div>
          )}
        </div>
      );
    }

    // Full combined mode
    return (
      <div className="h-full w-full">
        {permissions.microphone === 'granted' ? (
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

            {/* One compact row along the bottom of the preview: icon, level meter, status */}
            <div className={`flex items-center gap-3 rounded-md bg-black/60 px-3 py-2 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}>
              <MicrophoneIcon className={`size-4 shrink-0 transition-colors duration-200 ${volume > 0.1 ? 'text-rose-400' : 'text-zinc-300'}`} />
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-rose-400 transition-[width] duration-100"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-xs font-medium text-white">{volume > 0.1 ? 'Listening…' : 'Speak to test'}</span>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-6">
            <div className="text-center">
              {permissions.microphone === 'denied' ? (
                <>
                  <ExclamationTriangleIcon className="mx-auto mb-4 size-8 text-amber-400" />
                  <h3 className="mb-1 text-sm font-medium text-white">Microphone Access Denied</h3>
                  <p className="mb-5 text-sm text-zinc-400">Please allow microphone access in your browser settings.</p>
                  <button
                    onClick={startMicrophone}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                  >
                    Try Again
                  </button>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 grid size-12 place-items-center rounded-lg border border-zinc-700 bg-zinc-800">
                    <MicrophoneIcon className="size-6 text-zinc-300" />
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-white">Microphone Offline</h3>
                  <p className="mb-5 text-sm text-zinc-400">Allow access to begin testing your microphone</p>
                  <button
                    onClick={startMicrophone}
                    className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400"
                  >
                    Allow Microphone Access
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
              <MicrophoneIcon className="size-5 text-zinc-700" />
            </div>
            <h3 className={ui.cardTitle}>Microphone Test</h3>
          </div>

          {/* Status indicator */}
          {permissions.microphone === 'granted' && !error && !isLoading && (
            <Badge tone="positive">Ready</Badge>
          )}
          {permissions.microphone === 'denied' && (
            <Badge tone="negative">Access denied</Badge>
          )}
        </div>

        {/* Audio visualization */}
        <div className="relative mb-5 aspect-video overflow-hidden rounded-lg bg-zinc-900">
          {permissions.microphone === 'granted' ? (
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

              {/* Microphone Icon with Volume Indicator */}
              <div className={`w-full h-full flex items-center justify-center ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}>
                <div className="text-center">
                  <div className="mx-auto mb-3 grid size-12 place-items-center rounded-lg border border-zinc-700 bg-zinc-800">
                    <MicrophoneIcon className={`size-6 transition-colors duration-200 ${volume > 0.1 ? 'text-rose-400' : 'text-zinc-300'}`} />
                  </div>
                  <div className="text-sm font-medium text-zinc-200">
                    {volume > 0.1 ? 'Listening...' : 'Speak to test your microphone'}
                  </div>
                </div>
              </div>

              {/* Volume indicator */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-rose-400 transition-[width] duration-100"
                    style={{ width: `${volume * 100}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-zinc-400">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>

              {/* Recording indicator */}
              {!error && !isLoading && (
                <div className="absolute top-3 right-3 flex items-center rounded-md bg-black/60 px-2 py-1">
                  <div className="mr-1.5 size-1.5 rounded-full bg-rose-400"></div>
                  <span className="text-xs font-medium text-white">Microphone active</span>
                </div>
              )}
            </>
          ) : (
            <PermissionRequest
              type="microphone"
              permissions={permissions}
              onRequestPermission={startMicrophone}
            />
          )}
        </div>

        {/* Device selector and status */}
        <div className="space-y-4">
          {/* Device selector */}
          {permissions.microphone === 'granted' && devices.length > 0 && (
            <DeviceSelector
              label="Select microphone"
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onChange={handleDeviceChange}
              icon={
                <svg className="size-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              }
            />
          )}

          {/* Status and help text */}
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            {permissions.microphone === 'granted' ? (
              error ? (
                <div>
                  <p className="mb-3 text-amber-700">{error}</p>
                  <button
                    onClick={startMicrophone}
                    className={ui.primaryButton}
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <p>Speak into your microphone to see the audio level indicator move. If the bars move when you speak, your microphone is working properly.</p>
              )
            ) : permissions.microphone === 'denied' ? (
              <div>
                <p className="text-red-700">Microphone access denied. Please allow microphone access in your browser settings and try again.</p>
              </div>
            ) : (
              <p>Click the "Start Microphone Test" button above to test your microphone.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
