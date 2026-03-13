document.addEventListener('DOMContentLoaded', () => {
    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
        payBtn.addEventListener('click', initiatePayment);
    }
});

function initiatePayment() {
    const services = JSON.parse(localStorage.getItem('selectedServices') || '[]');
    const prices = { whatsapp: 10000, 'website-chatbot': 15000, instagram: 12000, tiktok: 13000 }; // in kobo
    const amount = services.reduce((total, service) => total + (prices[service] || 0), 0);

    const handler = PaystackPop.setup({
        key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxx', // Replace with your public key
        email: 'user@example.com', // Should get from user data
        amount: amount,
        currency: 'NGN',
        callback: function(response) {
            // Payment successful
            verifyPayment(response.reference, services);
        },
        onClose: function() {
            // Payment cancelled
            window.location.href = 'failure.html';
        }
    });
    handler.openIframe();
}

async function verifyPayment(reference, services) {
    try {
        const response = await fetch('http://localhost:5000/api/payments/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ reference, services }),
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.removeItem('selectedServices');
            window.location.href = 'success.html';
        } else {
            window.location.href = 'failure.html';
        }
    } catch (error) {
        console.error('Verification error:', error);
        window.location.href = 'failure.html';
    }
}