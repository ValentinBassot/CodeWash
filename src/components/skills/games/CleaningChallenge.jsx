import React, { useState } from 'react';
import ParentalVerificationModal from '../../ui/ParentalVerificationModal';

const CleaningChallenge = ({ onComplete }) => {
    const [isAsking, setIsAsking] = useState(false);

    const handleVerified = () => {
        setIsAsking(false);
        onComplete();
    };

    return (
        <>
            <button
                onClick={() => setIsAsking(true)}
                className="w-full bg-green-600 hover:bg-green-500 text-white text-3xl font-bold py-4 rounded shadow-[0_4px_0_#166534] active:shadow-none active:translate-y-[4px] transition-all"
            >
                Complete!
            </button>
            <ParentalVerificationModal
                isOpen={isAsking}
                onClose={() => setIsAsking(false)}
                onVerified={handleVerified}
            />
        </>
    );
};

export default CleaningChallenge;
