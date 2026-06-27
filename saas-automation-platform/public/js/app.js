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

    const whatsappConnectForm = document.getElementById('whatsappConnectForm');
    if (whatsappConnectForm) {
        whatsappConnectForm.addEventListener('submit', handleWhatsAppConnect);
    }

    const ruleForm = document.getElementById('ruleForm');
    if (ruleForm) {
        ruleForm.addEventListener('submit', handleRuleSubmit);
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
            loadAutomationSummary();
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

async function handleWhatsAppConnect(e) {
    e.preventDefault();

    const phoneNumberId = document.getElementById('phoneNumberId').value.trim();
    const accessToken = document.getElementById('accessToken').value.trim();
    const whatsappNumber = document.getElementById('whatsappNumber').value.trim();
    const webhookVerifyToken = document.getElementById('webhookVerifyToken').value.trim();
    const statusBox = document.getElementById('whatsappStatus');

    try {
        const response = await fetch(`${API_BASE}/whatsapp/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ phoneNumberId, accessToken, whatsappNumber, webhookVerifyToken }),
        });

        const data = await response.json();
        if (response.ok && data.success) {
            statusBox.textContent = 'WhatsApp connection saved successfully.';
            await loadAutomationSummary();
        } else {
            statusBox.textContent = data.message || 'Unable to save WhatsApp connection.';
        }
    } catch (error) {
        console.error('WhatsApp connect error:', error);
        statusBox.textContent = 'Unable to save WhatsApp connection right now.';
    }
}

async function handleRuleSubmit(e) {
    e.preventDefault();

    const trigger = document.getElementById('ruleTrigger').value.trim();
    const response = document.getElementById('ruleResponse').value.trim();

    try {
        const responsePayload = await fetch(`${API_BASE}/whatsapp/rules`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify({ trigger, response }),
        });

        const data = await responsePayload.json();
        if (responsePayload.ok && data.success) {
            document.getElementById('ruleTrigger').value = '';
            document.getElementById('ruleResponse').value = '';
            await loadAutomationSummary();
        } else {
            alert(data.message || 'Unable to create rule.');
        }
    } catch (error) {
        console.error('Rule create error:', error);
        alert('Unable to create rule right now.');
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

    if (!statusBox) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/whatsapp/status`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();

        if (response.ok && data.configured) {
            statusBox.textContent = 'Meta WhatsApp integration is configured and ready.';
        } else {
            statusBox.textContent = data.message || 'WhatsApp integration needs configuration.';
        }
    } catch (error) {
        console.error('WhatsApp status error:', error);
        statusBox.textContent = 'Could not check WhatsApp integration status.';
    }
}

async function loadAutomationSummary() {
    const summaryBox = document.getElementById('automationSummary');
    const rulesBox = document.getElementById('rulesList');
    const logsBox = document.getElementById('messageLogs');

    try {
        const response = await fetch(`${API_BASE}/whatsapp/summary`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Unable to load automation summary.');
        }

        const connectionStatus = data.connected ? 'Connected to Meta WhatsApp' : 'Not connected yet';
        const accessStatus = data.canUseAutomation ? 'Automation access active' : 'Purchase or trial required';
        summaryBox.innerHTML = `
            <p><strong>Status:</strong> ${connectionStatus}</p>
            <p><strong>Access:</strong> ${accessStatus}</p>
            <p><strong>Rules:</strong> ${data.activeRules}/${data.totalRules} active</p>
        `;

        rulesBox.innerHTML = (data.rules || []).map(rule => `
            <div class="service">
                <p><strong>Trigger:</strong> ${rule.trigger}</p>
                <p><strong>Response:</strong> ${rule.response}</p>
                <p><strong>Active:</strong> ${rule.active === false ? 'No' : 'Yes'}</p>
                <button type="button" data-rule-id="${rule._id}" class="toggle-rule">${rule.active === false ? 'Enable' : 'Disable'}</button>
                <button type="button" data-rule-id="${rule._id}" class="delete-rule">Delete</button>
            </div>
        `).join('');

        logsBox.innerHTML = '<h3>Recent Activity</h3>' + (data.messages || []).map(message => `
            <div class="service">
                <p><strong>${message.direction}</strong> - ${message.content}</p>
                <small>${new Date(message.createdAt).toLocaleString()}</small>
            </div>
        `).join('');

        document.querySelectorAll('.toggle-rule').forEach(btn => {
            btn.addEventListener('click', async () => {
                const ruleId = btn.getAttribute('data-rule-id');
                await toggleRule(ruleId);
            });
        });

        document.querySelectorAll('.delete-rule').forEach(btn => {
            btn.addEventListener('click', async () => {
                const ruleId = btn.getAttribute('data-rule-id');
                await deleteRule(ruleId);
            });
        });
    } catch (error) {
        console.error('Automation summary error:', error);
        summaryBox.innerHTML = '<p>Unable to load automation details.</p>';
    }
}

async function toggleRule(ruleId) {
    try {
        const response = await fetch(`${API_BASE}/whatsapp/rules/${ruleId}/toggle`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        if (response.ok) {
            await loadAutomationSummary();
        }
    } catch (error) {
        console.error('Rule toggle error:', error);
    }
}

async function deleteRule(ruleId) {
    try {
        const response = await fetch(`${API_BASE}/whatsapp/rules/${ruleId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        if (response.ok) {
            await loadAutomationSummary();
        }
    } catch (error) {
        console.error('Rule delete error:', error);
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
