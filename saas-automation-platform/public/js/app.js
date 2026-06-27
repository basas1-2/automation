const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // If logged in, redirect to dashboard if on index or login
        if (window.location.pathname.includes('index.html') || window.location.pathname.includes('login.html')) {
            window.location.href = 'dashboard.html';
        }
    } else {
        // If not logged in, redirect to login if on protected pages
        if (window.location.pathname.includes('dashboard.html') || window.location.pathname.includes('services.html') || window.location.pathname.includes('payment.html')) {
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
    localStorage.removeItem('token');
    localStorage.removeItem('selectedServices');
    window.location.href = 'index.html';
}

async function loadDashboard() {
    try {
        const userResponse = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const user = await userResponse.json();

        const purchasesResponse = await fetch(`${API_BASE}/payments/purchases`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const purchases = await purchasesResponse.json();
        // WHERE I CHANGE 

        console.log(userResponse.status);
console.log(purchasesResponse.status);

if (userResponse.ok && purchasesResponse.ok) {
    displayDashboard(user, purchases);
} else {
    console.log(await userResponse.text());
    console.log(await purchasesResponse.text());
    alert('Failed to load dashboard');
}
    } catch (error) {
        console.error('Load dashboard error:', error);
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

function getServiceDetails(service) {
    const details = {
        whatsapp: '<p>WhatsApp: Connect your WhatsApp Business API for automated messaging.</p>',
        'website-chatbot': '<p>Website Chatbot: Embed this script on your website: &lt;script&gt;console.log("Chatbot script");&lt;/script&gt;</p>',
        instagram: '<p>Instagram: Set up API integration for messaging automation.</p>',
        tiktok: '<p>TikTok: Configure message automation setup.</p>',
    };
    return details[service] || '';
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
