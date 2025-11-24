import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanFailure }) => {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef<boolean>(false);

    useEffect(() => {
        const startScanner = async () => {
            try {
                // Use a unique ID for the scanner element
                const elementId = "reader";

                // Cleanup any existing instance if it wasn't cleaned up properly
                if (scannerRef.current) {
                    if (isScanningRef.current) {
                        await scannerRef.current.stop();
                    }
                    scannerRef.current.clear();
                    scannerRef.current = null;
                }

                const html5QrCode = new Html5Qrcode(elementId);
                scannerRef.current = html5QrCode;

                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13] // ISBNs are EAN-13
                };

                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    (decodedText) => {
                        // Stop scanning on success to prevent multiple triggers
                        if (isScanningRef.current && scannerRef.current) {
                            scannerRef.current.pause();
                            onScanSuccess(decodedText);
                        }
                    },
                    (errorMessage) => {
                        if (onScanFailure) {
                            onScanFailure(errorMessage);
                        }
                    }
                );

                isScanningRef.current = true;
                setError(null);

            } catch (err) {
                console.error("Error starting scanner", err);
                setError("Could not start camera. Please ensure you have granted camera permissions.");
                isScanningRef.current = false;
            }
        };

        // Small timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current && isScanningRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                    isScanningRef.current = false;
                }).catch(err => console.error("Failed to stop scanner", err));
            }
        };
    }, [onScanSuccess, onScanFailure]);

    return (
        <div className="barcode-scanner-container">
            {error ? (
                <div className="scanner-error" style={{ color: 'var(--danger-color)', textAlign: 'center', padding: '20px' }}>
                    {error}
                </div>
            ) : (
                <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
            )}
            <p style={{ textAlign: 'center', marginTop: '10px', color: 'var(--text-secondary)' }}>
                Point your camera at a book's barcode (ISBN)
            </p>
        </div>
    );
};
