/**
 * Scanner Module
 * Wraps Html5QrcodeScanner for QR code detection.
 */
export const Scanner = {
    html5QrcodeScanner: null,

    /**
     * Initialize and render the QR scanner.
     * @param {string} elementId - DOM ID of the container element.
     * @param {function} onScanSuccess - Callback for successful scan (decodedText, decodedResult).
     * @param {function} onScanFailure - Callback for scan failure/error.
     */
    init(elementId, onScanSuccess, onScanFailure) {
        // We use Html5QrcodeScanner for a UI-embedded scanner
        // checking if the library is loaded
        if (typeof Html5QrcodeScanner === 'undefined') {
            console.error('Html5Qrcode library not loaded');
            return;
        }

        this.html5QrcodeScanner = new Html5QrcodeScanner(
            elementId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        this.html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    },

    /**
     * Clear and stop the scanner.
     */
    clear() {
        if (this.html5QrcodeScanner) {
            this.html5QrcodeScanner.clear().catch(error => {
                console.error('Failed to clear scanner', error);
            });
            this.html5QrcodeScanner = null;
        }
    }
};
