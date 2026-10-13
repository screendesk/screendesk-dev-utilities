import { VideoCameraIcon, MicrophoneIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export function PermissionRequest({ type, permissions, onRequestPermission }) {
  const isDenied = permissions[type] === 'denied';

  const getTitle = () => {
    if (isDenied) {
      return type === 'camera'
        ? 'Camera Access Denied'
        : 'Microphone Access Denied';
    } else {
      return type === 'camera'
        ? 'Test Your Camera'
        : 'Test Your Microphone';
    }
  };

  const getMessage = () => {
    if (isDenied) {
      return type === 'camera'
        ? 'You need to allow camera access in your browser settings to use this feature.'
        : 'You need to allow microphone access in your browser settings to use this feature.';
    } else {
      return type === 'camera'
        ? 'Click the button below to start testing your camera. Your browser will ask for permission to access your camera.'
        : 'Click the button below to start testing your microphone. Your browser will ask for permission to access your microphone.';
    }
  };

  const getBrowserInstructions = () => {
    // Detect browser
    const isChrome = navigator.userAgent.indexOf('Chrome') > -1;
    const isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
    const isSafari = navigator.userAgent.indexOf('Safari') > -1 && navigator.userAgent.indexOf('Chrome') === -1;
    const isEdge = navigator.userAgent.indexOf('Edg') > -1;

    if (isChrome || isEdge) {
      return (
        <ol className="list-decimal list-inside text-sm text-gray-600 mt-2">
          <li>Click the camera/microphone icon in the address bar</li>
          <li>Select "Always allow" for this site</li>
          <li>Refresh the page</li>
        </ol>
      );
    } else if (isFirefox) {
      return (
        <ol className="list-decimal list-inside text-sm text-gray-600 mt-2">
          <li>Click the shield icon in the address bar</li>
          <li>Toggle the camera/microphone permission to "Allow"</li>
          <li>Refresh the page</li>
        </ol>
      );
    } else if (isSafari) {
      return (
        <ol className="list-decimal list-inside text-sm text-gray-600 mt-2">
          <li>Open Safari Preferences</li>
          <li>Go to Websites tab</li>
          <li>Select Camera/Microphone from the sidebar</li>
          <li>Find this website and set permission to "Allow"</li>
          <li>Refresh the page</li>
        </ol>
      );
    } else {
      return (
        <ol className="list-decimal list-inside text-sm text-gray-600 mt-2">
          <li>Check your browser settings to allow camera/microphone access</li>
          <li>Refresh the page after changing settings</li>
        </ol>
      );
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="text-center max-w-md bg-white p-6 rounded-xl shadow-lg ring-1 ring-gray-900/5">
        {isDenied ? (
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 mx-auto mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-500" />
          </div>
        ) : (
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-50 mx-auto mb-4">
            {type === 'camera' ? (
              <VideoCameraIcon className="h-8 w-8 text-rose-600" />
            ) : (
              <MicrophoneIcon className="h-8 w-8 text-rose-600" />
            )}
          </div>
        )}

        <h4 className="text-xl font-semibold text-gray-900 mb-3">
          {getTitle()}
        </h4>

        <p className="text-sm text-gray-600 mb-6">
          {getMessage()}
        </p>

        {isDenied ? (
          <>
            <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left">
              <p className="text-sm font-medium text-gray-800 mb-2">
                How to enable {type} access:
              </p>
              {getBrowserInstructions()}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={onRequestPermission}
                className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-xs text-white bg-rose-600 hover:bg-rose-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors duration-200"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-full shadow-xs text-gray-700 bg-white hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors duration-200"
              >
                Refresh Page
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={onRequestPermission}
            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-xs text-white bg-rose-600 hover:bg-rose-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 transition-colors duration-200"
          >
            {type === 'camera' ? 'Start Camera Test' : 'Start Microphone Test'}
          </button>
        )}
      </div>
    </div>
  )
}
