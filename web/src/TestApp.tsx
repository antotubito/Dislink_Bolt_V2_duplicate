import React from 'react';

export function TestApp() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f0f0f0',
            fontFamily: 'Arial, sans-serif'
        }}>
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <h1 style={{ color: '#333', marginBottom: '20px' }}>
                    React Test - Dislink
                </h1>
                <p style={{ color: '#666', marginBottom: '20px' }}>
                    If you can see this, React is working correctly.
                </p>
                <button
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                    onClick={() => alert('Button clicked!')}
                >
                    Test Button
                </button>
            </div>
        </div>
    );
}
