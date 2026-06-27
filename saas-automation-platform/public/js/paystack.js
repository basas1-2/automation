
document.addEventListener('DOMContentLoaded', () => {
    const payBtn = document.getElementById('payBtn');
    if (payBtn) {
        payBtn.addEventListener('click', initiatePayment);
    }
});

function getSelectedServices() {
    try {
        return JSON.parse(localStorage.getItem('selectedServices') || '[]');
    } catch (error) {
        console.error('Failed to read selected services:', error);
        return [];
    }
}

function getUserEmail() {
    try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser.email) {
                return parsedUser.email;
            }
        }
    } catch (error) {
        console.error('Failed to read stored user:', error);
    }

    return 'user@example.com';
}

function initiatePayment() {
    const services = getSelectedServices();

    if (!services.length) {
        alert('Please select at least one service first.');
        return;
    }

    const prices = {
        whatsapp: 10000,
        'website-chatbot': 15000,
        instagram: 12000,
        tiktok: 13000,
    };

    const amount = services.reduce((total, service) => total + (prices[service] || 0), 0);

    const handler = PaystackPop.setup({
        key: 'pk_live_0cd1f755e46db8a1a2354ea8dd68a76b9aa3987d',
        email: getUserEmail(),
        amount,
        currency: 'NGN',
        callback: function (response) {
            verifyPayment(response.reference, services);
        },
        onClose: function () {
            window.location.href = 'failure.html';
        },
    });

    handler.openIframe();
}

async function verifyPayment(reference, services) {
    try {
        const response = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ reference, services }),
        });

        if (response.ok) {
            localStorage.removeItem('selectedServices');
            window.location.href = 'success.html';
        } else {
            window.location.href = 'failure.html';
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        window.location.href = 'failure.html';
    }
}
