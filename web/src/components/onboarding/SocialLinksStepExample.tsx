import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { SocialLinksForm } from '../common/SocialLinksForm';
import { logger } from '../lib/logger';

interface SocialLinksStepExampleProps {
    initialData?: {
        socialLinks?: Record<string, string>;
    };
    onUpdate: (data: { socialLinks: Record<string, string> }) => void;
    onNext: () => void;
    onBack: () => void;
}

export function SocialLinksStepExample({
    initialData = {},
    onUpdate,
    onNext,
    onBack
}: SocialLinksStepExampleProps) {
    const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
        initialData.socialLinks || {}
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isValid, setIsValid] = useState(false);

    // Handle social links update
    const handleSocialLinksUpdate = (links: Record<string, string>) => {
        logger.info('Social links updated:', links);
        setSocialLinks(links);

        // Update parent component
        onUpdate({ socialLinks: links });

        // Check if we meet minimum requirements
        const linkCount = Object.keys(links).length;
        const meetsMinimum = linkCount >= 1; // Minimum 1 link required
        const meetsRecommended = linkCount >= 3; // Recommended 3+ links

        setIsValid(meetsMinimum);

        // Clear errors if we have valid links
        if (meetsMinimum) {
            setErrors({});
        }
    };

    // Handle social links errors
    const handleSocialLinksError = (errorMap: Record<string, string>) => {
        logger.warn('Social links validation errors:', errorMap);
        setErrors(errorMap);
        setIsValid(false);
    };

    // Handle continue
    const handleContinue = () => {
        if (!isValid) {
            setErrors({
                general: 'Please add at least one social link to continue'
            });
            return;
        }

        // Log the final data
        logger.info('Social links step completed:', { socialLinks });

        // Proceed to next step
        onNext();
    };

    // Check if we can proceed
    const canProceed = isValid && Object.keys(socialLinks).length > 0;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-2xl mx-auto p-6"
        >
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Add Your Social Links
                </h2>
                <p className="text-lg text-gray-600">
                    Connect your social profiles to help others find and connect with you.
                    You can add usernames or full URLs - we'll format them correctly.
                </p>
            </div>

            {/* Social Links Form */}
            <div className="mb-8">
                <SocialLinksForm
                    initialLinks={socialLinks}
                    onUpdate={handleSocialLinksUpdate}
                    onError={handleSocialLinksError}
                    required={true}
                    minLinks={1}
                    recommendedLinks={3}
                    className="bg-white p-6 rounded-xl shadow-sm border"
                />
            </div>

            {/* Examples */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Examples of what you can enter:</h3>
                <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>LinkedIn:</strong> "antoniotubito" or "https://linkedin.com/in/antoniotubito"</p>
                    <p><strong>Twitter:</strong> "@antoniotubito" or "https://twitter.com/antoniotubito"</p>
                    <p><strong>Instagram:</strong> "@antoniotubito" or "https://instagram.com/antoniotubito"</p>
                    <p><strong>GitHub:</strong> "antoniotubito" or "https://github.com/antoniotubito"</p>
                </div>
            </div>

            {/* Validation Status */}
            <div className="mb-6">
                {Object.keys(socialLinks).length > 0 ? (
                    <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">
                            {Object.keys(socialLinks).length} social link{Object.keys(socialLinks).length !== 1 ? 's' : ''} added
                        </span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2 text-yellow-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Add at least one social link to continue</span>
                    </div>
                )}
            </div>

            {/* Error Messages */}
            {Object.keys(errors).length > 0 && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800 mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">Please fix the following issues:</span>
                    </div>
                    <ul className="text-sm text-red-700 space-y-1">
                        {Object.entries(errors).map(([key, message]) => (
                            <li key={key}>• {message}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center space-x-2 px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                    <span>Back</span>
                </button>

                <button
                    onClick={handleContinue}
                    disabled={!canProceed}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${canProceed
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <span>Continue</span>
                    <ArrowRight className="h-5 w-5" />
                </button>
            </div>

            {/* Debug Info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-gray-100 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Debug Info:</h4>
                    <pre className="text-xs text-gray-600 overflow-auto">
                        {JSON.stringify({ socialLinks, isValid, errors }, null, 2)}
                    </pre>
                </div>
            )}
        </motion.div>
    );
}
