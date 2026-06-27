const API_BASE = '/api';

function clearAuthState() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedServices');
}

async function validateSession() {
    const token = localStorage.getItem('token');
    if (!token) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            clearAuthState();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Session validation failed:', error);
        clearAuthState();
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('index.html') || currentPath.includes('login.html') || currentPath.includes('register.html') || currentPath === '/';
    const isProtectedPage = currentPath.includes('dashboard.html') || currentPath.includes('services.html') || currentPath.includes('payment.html');

    const hasValidSession = await validateSession();

    if (hasValidSession) {
        if (isAuthPage) {
            window.location.href = 'dashboard.html';
        }
    } else {
        if (isProtectedPage) {
            window.location.href = 'login.html';
        }
    }

    // Handle forms
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    const servicesForm = document.getElementById('servicesForm');
    if (servicesForm) {
        servicesForm.addEventListener('change', calculateTotal);
        servicesForm.addEventListener('submit', handleServicesSubmit);
    }

    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    const whatsappForm = document.getElementById('whatsappForm');
    if (whatsappForm) {
        whatsappForm.addEventListener('submit', handleWhatsAppSubmit);
    }

    // Load dashboard if on dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboard();
    }

    // Load payment details if on payment page
    if (window.location.pathname.includes('payment.html')) {
        loadPaymentDetails();
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ email }));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ email }));
            window.location.href = 'dashboard.html';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed');
    }
}

function calculateTotal() {
    const checkboxes = document.querySelectorAll('input[name="services"]:checked');
    const prices = { whatsapp: 100, 'website-chatbot': 150, instagram: 120, tiktok: 130 };
    let total = 0;
    checkboxes.forEach(cb => {
        total += prices[cb.value] || 0;
    });
    document.getElementById('total').textContent = total;
}

function handleServicesSubmit(e) {
    e.preventDefault();
    const checkboxes = document.querySelectorAll('input[name="services"]:checked');
    const services = Array.from(checkboxes).map(cb => cb.value);
    if (services.length === 0) {
        alert('Please select at least one service');
        return;
    }
    localStorage.setItem('selectedServices', JSON.stringify(services));
    window.location.href = 'payment.html';
}

function handleLogout() {
    clearAuthState();
    window.location.href = 'index.html';
}

async function loadDashboard() {
    try {
        const userResponse = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const user = await userResponse.json();

        let purchases = [];
        try {
            const purchasesResponse = await fetch(`${API_BASE}/payments/purchases`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            });
            if (purchasesResponse.ok) {
                purchases = await purchasesResponse.json();
            } else {
                console.warn('Purchases could not be loaded, continuing without them.');
            }
        } catch (purchaseError) {
            console.warn('Purchases request failed:', purchaseError);
        }

        if (userResponse.ok) {
            displayDashboard(user, purchases);
            loadWhatsAppStatus();
        } else {
            clearAuthState();
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Load dashboard error:', error);
        clearAuthState();
        window.location.href = 'login.html';
    }
}

function displayDashboard(user, purchases) {
    document.getElementById('username').textContent = user.username;
    document.getElementById('welcomeHeader').textContent = `Dashboard - ${user.username}`;

    const servicesList = document.getElementById('servicesList');
    const now = new Date();
    const trialActive = new Date(user.trialExpires) > now;

    let html = '';
    if (trialActive) {
        html += `<div class="service"><p>🎉 Your free trial is active until ${new Date(user.trialExpires).toLocaleDateString()}. You have access to all services!</p></div>`;
        const allServices = ['whatsapp', 'website-chatbot', 'instagram', 'tiktok'];
        html += allServices.map(service => `
            <div class="service">
                <h3>${service.charAt(0).toUpperCase() + service.slice(1).replace('-', ' ')} (Trial)</h3>
                ${getServiceDetails(service)}
            </div>
        `).join('');
    }

    if (purchases.length > 0) {
        html += purchases.map(purchase => `
            <div class="service">
                <h3>Purchase on ${new Date(purchase.createdAt).toLocaleDateString()}</h3>
                <p>Services: ${purchase.servicesSelected.join(', ')}</p>
                <p>Amount: ₦${purchase.amountPaid / 100}</p>
                ${purchase.servicesSelected.map(service => getServiceDetails(service)).join('')}
            </div>
        `).join('');
    }

    if (!trialActive && purchases.length === 0) {
        html = '<p>No active services. <a href="services.html">Select services</a></p>';
    }

    servicesList.innerHTML = html;
}

async function handleWhatsAppSubmit(e) {
    e.preventDefault();

    const to = document.getElementById('whatsappNumber').value.trim();
    const message = document.getElementById('whatsappMessage').value.trim();
    const resultBox = document.getElementById('whatsappResult');
    const statusBox = document.getElementById('whatsappStatus');

    if (!to || !message) {
        resultBox.textContent = 'Please enter both a number and a message.';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/whatsapp/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ to, message }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
            resultBox.textContent = data.message;
            statusBox.textContent = 'WhatsApp integration is ready.';
        } else {
            resultBox.textContent = data.message || 'Unable to send WhatsApp message.';
            if (statusBox) {
                statusBox.textContent = 'WhatsApp integration needs configuration.';
            }
        }
    } catch (error) {
        console.error('WhatsApp send error:', error);
        resultBox.textContent = 'Unable to send WhatsApp message right now.';
    }
}

function getServiceDetails(service) {
    const details = {
        whatsapp: '<p>WhatsApp: Connect your WhatsApp Business API for automated messaging.</p>',
        'website-chatbot': '<p>Website Chatbot: Embed this script on your website: &lt;script&gt;console.log("Chatbot script");&lt;/script&gt;</p>',
        instagram: '<p>Instagram: Set up API integration for messaging automation.</p>',
        tiktok: '<p>TikTok: Configure message automation setup.</p>',
    };
    return details[service] || '';
}

async function loadWhatsAppStatus() {
    const statusBox = document.getElementById('whatsappStatus');
    const resultBox = document.getElementById('whatsappResult');

    if (!statusBox) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/whatsapp/status`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();

        if (response.ok && data.configured) {
            statusBox.textContent = 'WhatsApp integration is configured and ready.';
        } else {
            statusBox.textContent = data.message || 'WhatsApp integration needs configuration.';
            if (resultBox) {
                resultBox.textContent = 'Add Twilio credentials to enable live message sending.';
            }
        }
    } catch (error) {
        console.error('WhatsApp status error:', error);
        statusBox.textContent = 'Could not check WhatsApp integration status.';
    }
}

function loadPaymentDetails() {
    const services = JSON.parse(localStorage.getItem('selectedServices') || '[]');
    const selectedServices = document.getElementById('selectedServices');
    const totalAmount = document.getElementById('totalAmount');
    const prices = { whatsapp: 100, 'website-chatbot': 150, instagram: 120, tiktok: 130 };
    let total = 0;
    selectedServices.innerHTML = services.map(service => {
        const price = prices[service];
        total += price;
        return `<li>${service.charAt(0).toUpperCase() + service.slice(1)} - ₦${price}</li>`;
    }).join('');
    totalAmount.textContent = total;
}
