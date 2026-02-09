import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
    onSwitchToManual?: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanFailure, onSwitchToManual }) => {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [retryTrigger, setRetryTrigger] = useState(0);

    const handleRetry = () => {
        setError(null);
        setRetryTrigger(prev => prev + 1);
    };

    useEffect(() => {
        let mounted = true;

        const startScanner = async (retryCount = 0) => {
            if (!mounted) return;

            try {
                // Use a unique ID for the scanner element
                const elementId = "reader";

                // Cleanup any existing instance if it wasn't cleaned up properly
                if (scannerRef.current) {
                    if (isScanningRef.current) {
                        try {
                            await scannerRef.current.stop();
                        } catch (e) {
                            console.warn("Error stopping previous scanner instance:", e);
                        }
                    }
                    try {
                        scannerRef.current.clear();
                    } catch {
                        // ignore clean errors
                    }
                    scannerRef.current = null;
                    isScanningRef.current = false;
                }

                const html5QrCode = new Html5Qrcode(elementId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13] // ISBNs are EAN-13
                };

                // Use simple constraints to avoid library validation error
                // html5-qrcode strict mode requires exactly one key (facingMode or deviceId)
                const videoConstraints = {
                    facingMode: "environment"
                };

                await html5QrCode.start(
                    videoConstraints,
                    config,
                    (decodedText) => {
                        // Stop scanning on success to prevent multiple triggers
                        if (isScanningRef.current && scannerRef.current) {
                            scannerRef.current.pause();
                            if (timeoutRef.current) clearTimeout(timeoutRef.current);
                            onScanSuccess(decodedText);
                        }
                    },
                    () => {
                        // console.log(errorMessage);
                    }
                );

                isScanningRef.current = true;
                if (mounted) setError(null);

                // Set timeout for 20 seconds
                timeoutRef.current = setTimeout(() => {
                    if (isScanningRef.current && scannerRef.current) {
                        scannerRef.current.stop().then(() => {
                            scannerRef.current?.clear();
                            isScanningRef.current = false;
                        }).catch(console.error);
                        if (mounted) setError("Scanner timed out. No barcode detected.");
                    }
                }, 20000);

            } catch (err: any) {
                console.error("Error starting scanner:", err);

                // Retry logic for NotReadableError (often caused by React StrictMode double-mount race condition)
                if ((err.name === 'NotReadableError' || err.name === 'NotAllowedError') && retryCount < 2) {
                    console.log(`Scanner start failed with ${err.name}, retrying in 1s... (Attempt ${retryCount + 1})`);
                    if (isScanningRef.current && scannerRef.current) {
                        try { await scannerRef.current.stop(); } catch { /* ignore */ }
                        try { scannerRef.current.clear(); } catch { /* ignore */ }
                        isScanningRef.current = false;
                        scannerRef.current = null;
                    }

                    setTimeout(() => {
                        if (mounted) startScanner(retryCount + 1);
                    }, 1000);
                    return;
                }

                let errorMessage = "Camera error: " + (err instanceof Error ? err.message : String(err));

                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError') {
                        errorMessage = "Camera permission denied. Please allow camera access.";
                    } else if (err.name === 'NotFoundError') {
                        errorMessage = "No camera found on your device.";
                    } else if (err.name === 'NotReadableError') {
                        errorMessage = "Camera is currently in use by another application. Please close other apps using the camera and try again.";
                    } else if (errorMessage.includes("secure context")) {
                        errorMessage = "Camera access requires HTTPS or localhost.";
                    }
                }

                // Generic fallback for common "Available" checking errors which usually mean insecure context
                if (window.isSecureContext === false) {
                    errorMessage += " (Camera access requires a secure HTTPS connection or localhost)";
                }

                if (mounted) {
                    setError(errorMessage);
                    if (onScanFailure) onScanFailure(errorMessage);
                }
                isScanningRef.current = false;
            }
        };

        // Small timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanner();
        }, 300); // Increased from 100ms to 300ms to allow more time for previous cleanup

        return () => {
            mounted = false;
            clearTimeout(timer);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (scannerRef.current && isScanningRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                    isScanningRef.current = false;
                }).catch(() => console.error("Failed to stop scanner"));
            }
        };
    }, [onScanSuccess, onScanFailure, retryTrigger]);

    return (
        <div className="barcode-scanner-container">
            {error ? (
                <div className="scanner-error" style={{ color: 'var(--danger-color)', textAlign: 'center', padding: '20px' }}>
                    <div style={{ marginBottom: '10px' }}>{error}</div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px' }}>
                        <button
                            className="secondary-btn"
                            onClick={handleRetry}
                        >
                            Retry Camera
                        </button>

                        {onSwitchToManual && (
                            <button
                                className="primary-btn"
                                onClick={onSwitchToManual}
                            >
                                Enter ISBN Manually
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
            )}

            {!error && (
                <p style={{ textAlign: 'center', marginTop: '10px', color: 'var(--text-secondary)' }}>
                    Point your camera at a book's barcode (ISBN)
                </p>
            )}
        </div>
    );
};
