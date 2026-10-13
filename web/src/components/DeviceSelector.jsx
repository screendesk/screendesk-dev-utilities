import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

export function DeviceSelector({ label, devices, selectedDeviceId, onChange, icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Find the selected device
  const selectedDevice = devices.find(device => device.deviceId === selectedDeviceId);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <button
        type="button"
        className="flex items-center w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && <span className="mr-3 text-rose-500">{icon}</span>}
        <span className="flex-1 text-left truncate font-medium">
          {selectedDevice ? selectedDevice.label || `Device ${selectedDeviceId.substring(0, 8)}` : 'Select a device'}
        </span>
        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-2 w-full rounded-lg bg-white shadow-xl ring-1 ring-gray-900/5 focus:outline-hidden">
          <ul
            className="max-h-60 overflow-auto py-1 text-base rounded-lg"
            role="listbox"
            aria-labelledby="device-selector"
            tabIndex={-1}
          >
            {devices.map((device) => (
              <li
                key={device.deviceId}
                className={`relative cursor-pointer select-none py-2.5 pl-4 pr-9 text-gray-900 hover:bg-rose-50 transition-colors duration-150 ${
                  device.deviceId === selectedDeviceId ? 'bg-rose-50' : ''
                }`}
                role="option"
                aria-selected={device.deviceId === selectedDeviceId}
                onClick={() => {
                  onChange(device.deviceId);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center">
                  {icon && <span className="mr-3 text-rose-500">{icon}</span>}
                  <span className={`block truncate ${device.deviceId === selectedDeviceId ? 'font-medium' : 'font-normal'}`}>
                    {device.label || `Device ${device.deviceId.substring(0, 8)}`}
                  </span>
                </div>

                {device.deviceId === selectedDeviceId && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-rose-600">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
