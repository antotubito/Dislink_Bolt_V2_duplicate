import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LandingPageSimple } from './pages/LandingPageSimple';

export function AppSimple() {
    return (
        <Routes>
            <Route path="/" element={<LandingPageSimple />} />
            <Route path="*" element={<LandingPageSimple />} />
        </Routes>
    );
}
