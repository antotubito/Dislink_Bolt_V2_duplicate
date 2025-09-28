import { logger } from './logger';

export interface GeolocationPosition {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
}

export interface GeolocationError {
    code: number;
    message: string;
}

// Geolocation utility with proper error handling and permissions
export class GeolocationService {
    private static instance: GeolocationService;
    private watchId: number | null = null;
    private isSupported: boolean = false;

    constructor() {
        this.isSupported = 'geolocation' in navigator;
        if (!this.isSupported) {
            logger.warn('Geolocation is not supported in this browser');
        }
    }

    static getInstance(): GeolocationService {
        if (!GeolocationService.instance) {
            GeolocationService.instance = new GeolocationService();
        }
        return GeolocationService.instance;
    }

    // Check if geolocation is supported and available
    isGeolocationSupported(): boolean {
        return this.isSupported;
    }

    // Check if geolocation permission is granted
    async checkPermission(): Promise<PermissionState> {
        if (!this.isSupported) {
            return 'denied';
        }

        try {
            // Use Permissions API if available
            if ('permissions' in navigator) {
                const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
                return permission.state;
            }

            // Fallback: try to get current position to check permission
            return new Promise((resolve) => {
                navigator.geolocation.getCurrentPosition(
                    () => resolve('granted'),
                    (error) => {
                        if (error.code === error.PERMISSION_DENIED) {
                            resolve('denied');
                        } else {
                            resolve('prompt');
                        }
                    },
                    { timeout: 1000, enableHighAccuracy: false }
                );
            });
        } catch (error) {
            logger.error('Error checking geolocation permission:', error);
            return 'denied';
        }
    }

    // Get current position with proper error handling
    async getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
        if (!this.isSupported) {
            throw new Error('Geolocation is not supported in this browser');
        }

        const defaultOptions: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
            ...options
        };

        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const result: GeolocationPosition = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp
                    };

                    logger.info('Geolocation position obtained:', result);
                    resolve(result);
                },
                (error) => {
                    const errorInfo: GeolocationError = {
                        code: error.code,
                        message: this.getErrorMessage(error.code)
                    };

                    logger.error('Geolocation error:', errorInfo);
                    reject(new Error(errorInfo.message));
                },
                defaultOptions
            );
        });
    }

    // Watch position changes
    watchPosition(
        onSuccess: (position: GeolocationPosition) => void,
        onError?: (error: GeolocationError) => void,
        options?: PositionOptions
    ): number {
        if (!this.isSupported) {
            throw new Error('Geolocation is not supported in this browser');
        }

        const defaultOptions: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000, // 1 minute
            ...options
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                const result: GeolocationPosition = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp
                };

                logger.info('Geolocation position updated:', result);
                onSuccess(result);
            },
            (error) => {
                const errorInfo: GeolocationError = {
                    code: error.code,
                    message: this.getErrorMessage(error.code)
                };

                logger.error('Geolocation watch error:', errorInfo);
                if (onError) {
                    onError(errorInfo);
                }
            },
            defaultOptions
        );

        return this.watchId;
    }

    // Stop watching position
    clearWatch(): void {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            logger.info('Geolocation watch cleared');
        }
    }

    // Get user-friendly error message
    private getErrorMessage(code: number): string {
        switch (code) {
            case 1: // PERMISSION_DENIED
                return 'Geolocation access denied. Please enable location permissions in your browser settings.';
            case 2: // POSITION_UNAVAILABLE
                return 'Location information is unavailable. Please check your internet connection and try again.';
            case 3: // TIMEOUT
                return 'Location request timed out. Please try again.';
            default:
                return 'An unknown error occurred while getting your location.';
        }
    }

    // Request permission with user-friendly prompt
    async requestPermission(): Promise<boolean> {
        try {
            const permission = await this.checkPermission();

            if (permission === 'granted') {
                return true;
            }

            if (permission === 'denied') {
                logger.warn('Geolocation permission denied');
                return false;
            }

            // Permission is 'prompt' - try to get position to trigger permission dialog
            try {
                await this.getCurrentPosition({ timeout: 5000 });
                return true;
            } catch (error) {
                logger.warn('Geolocation permission request failed:', error);
                return false;
            }
        } catch (error) {
            logger.error('Error requesting geolocation permission:', error);
            return false;
        }
    }
}

// Export singleton instance
export const geolocationService = GeolocationService.getInstance();

// Utility function to get current position with fallback
export async function getCurrentLocationWithFallback(): Promise<GeolocationPosition | null> {
    try {
        const hasPermission = await geolocationService.requestPermission();
        if (!hasPermission) {
            logger.info('Geolocation permission not granted, skipping location detection');
            return null;
        }

        return await geolocationService.getCurrentPosition();
    } catch (error) {
        logger.error('Failed to get current location:', error);
        return null;
    }
}
