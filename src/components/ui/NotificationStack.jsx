import React from 'react';

const NotificationStack = ({ children }) => (
    <div className="fixed inset-x-0 top-16 md:top-5 z-[90] mx-auto flex w-[calc(100vw-1.5rem)] md:w-[min(42rem,calc(100vw-26rem))] flex-col gap-2 pointer-events-none">
        {children}
    </div>
);

export default NotificationStack;
