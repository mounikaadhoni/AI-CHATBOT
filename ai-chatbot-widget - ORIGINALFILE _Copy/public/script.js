// Global variables
let selectedPlan = '';
let selectedPrice = 0;
let selectedPlanId = null;

// Dashboard tab switching
function showDashboardTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  // Hide all content
  document.getElementById('flowbuilder-content').style.display = 'none';
  document.getElementById('analytics-content').style.display = 'none';
  document.getElementById('knowledge-content').style.display = 'none';
  
  // Show selected content
  if (tab === 'flowbuilder') {
    document.getElementById('flowbuilder-content').style.display = 'grid';
  } else if (tab === 'analytics') {
    document.getElementById('analytics-content').style.display = 'grid';
  } else if (tab === 'knowledge') {
    document.getElementById('knowledge-content').style.display = 'grid';
  }
}

// Smooth scroll functions
function scrollToPricing() {
  document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' });
}

function scrollToDemo() {
  document.getElementById('demo').scrollIntoView({ behavior: 'smooth' });
}

// FAQ Toggle
function toggleFaq(element) {
  const faqItem = element.parentElement;
  const isActive = faqItem.classList.contains('active');
  
  // Close all FAQ items
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Open clicked item if it wasn't active
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// Purchase Modal
function openPurchaseModal(planId, plan, price) {
  selectedPlanId = planId;
  selectedPlan = plan;
  selectedPrice = price;
  
  // Update Plan Name and Price in the new HTML template
  const planNameEl = document.getElementById('modalPlanName');
  if (planNameEl) planNameEl.textContent = plan + ' Plan';
  
  const priceEl = document.getElementById('modalPrice');
  if (priceEl) priceEl.textContent = '₹' + price;
  
  // Show Modal (uses inline styles in the new design)
  const modal = document.getElementById('purchaseModal');
  if (modal) modal.style.display = 'flex';
  
  document.body.style.overflow = 'hidden';
  
  // Reset fields
  const pwEl = document.getElementById('userPassword');
  if (pwEl) {
    pwEl.value = '';
    updatePasswordStrength('');
  }
}
function closePurchaseModal() {
  document.getElementById('purchaseModal').style.display = 'none';
  document.body.style.overflow = 'auto';
}

function togglePasswordVisibility() {
  const input = document.getElementById('userPassword');
  const btn = document.getElementById('eyeBtn');
  if (!input || !btn) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '&#128064;';
    btn.title = 'Hide password';
  } else {
    input.type = 'password';
    btn.innerHTML = '&#128065;';
    btn.title = 'Show password';
  }
}

// Password validation
function validatePassword(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  return requirements;
}

function updatePasswordRequirements(password) {
  const requirements = validatePassword(password);
  
  // Update each requirement indicator
  updateRequirement('req-length', requirements.length);
  updateRequirement('req-uppercase', requirements.uppercase);
  updateRequirement('req-lowercase', requirements.lowercase);
  updateRequirement('req-number', requirements.number);
  updateRequirement('req-special', requirements.special);
  
  return Object.values(requirements).every(val => val === true);
}

function updateRequirement(id, isValid) {
  const element = document.getElementById(id);
  const icon = element.querySelector('.req-icon');
  
  if (isValid) {
    element.classList.add('valid');
    icon.textContent = '✓';
  } else {
    element.classList.remove('valid');
    icon.textContent = '✗';
  }
}

function resetPasswordValidation() {
  ['req-length', 'req-uppercase', 'req-lowercase', 'req-number', 'req-special'].forEach(id => {
    updateRequirement(id, false);
  });
}

// ============================
// PASSWORD STRENGTH VALIDATION
// ============================

function checkPasswordRules(password) {
  return {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(password)
  };
}

// Handle Purchase Form - validate locally, then show payment
async function handlePurchase(event) {
  event.preventDefault();

  const companyName = document.getElementById('companyName').value.trim();
  const userEmail = document.getElementById('userEmail').value.trim();
  const userPhone = document.getElementById('userPhone').value.trim();
  const userPassword = document.getElementById('userPassword').value;

  // Validations
  if (!companyName) { alert('Please enter your company name.'); return; }
  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) { alert('Please enter a valid email address.'); return; }
  if (!userPhone) { alert('Please enter your phone number.'); return; }

  // Full password policy check
  const hasMinLength = userPassword.length >= 8;
  if (!hasMinLength) { alert('Password must be at least 8 characters long.'); return; }

  const pendingData = {
    company_name: companyName,
    email: userEmail,
    phone: userPhone,
    password: userPassword,
    plan_id: selectedPlanId
  };
  window._pendingPurchase = pendingData;

  const submitBtn = document.getElementById('submitBtn');
  const loadingOverlay = document.getElementById('loading-overlay');
  
  if (loadingOverlay) {
    const loadingText = loadingOverlay.querySelector('div:last-child');
    if (loadingText) loadingText.textContent = 'Initializing payment...';
    loadingOverlay.style.display = 'flex';
  }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Processing...';
  }

  try {
    const orderRes = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingData)
    });
    const orderData = await orderRes.json();
    
    if (orderData.error) {
      alert('Error creating order: ' + orderData.error);
      if (loadingOverlay) loadingOverlay.style.display = 'none';
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Proceed to Payment 💳';
      }
      return;
    }

    // Hide registration modal while payment popup is active
    document.getElementById('purchaseModal').style.display = 'none';
    if (loadingOverlay) loadingOverlay.style.display = 'none';

    const options = {
      key: orderData.key || orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'GAdigital Solution',
      description: pendingData.plan_id == 2 ? 'Standard Plan' : (pendingData.plan_id == 3 ? 'Premium Plan' : 'Basic Plan'),
      order_id: orderData.order_id,
      prefill: {
        name: pendingData.company_name,
        email: pendingData.email,
        contact: pendingData.phone
      },
      theme: { color: '#4F46E5' },
      modal: {
        ondismiss: function() {
          // If user cancels checkout, bring them back to registration form
          document.getElementById('purchaseModal').style.display = 'flex';
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Proceed to Payment 💳';
          }
        }
      },
      handler: async function (response) {
        // Show success loading screen
        if (loadingOverlay) {
          const loadingText = loadingOverlay.querySelector('div:last-child');
          if (loadingText) loadingText.textContent = 'Verifying payment...';
          loadingOverlay.style.display = 'flex';
        }
        
        const verifyPayload = {
          ...pendingData,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        };
        
        try {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verifyPayload)
          });
          const verifyData = await verifyRes.json();
          
          if (loadingOverlay) loadingOverlay.style.display = 'none';
          
          if (verifyRes.ok && verifyData.success) {
            showSuccessModal(pendingData);
          } else {
            alert('Payment Failed: ' + (verifyData.error || 'Unknown error'));
            document.getElementById('purchaseModal').style.display = 'flex';
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = 'Proceed to Payment 💳';
            }
          }
        } catch(err) {
          console.error(err);
          if (loadingOverlay) loadingOverlay.style.display = 'none';
          alert('Error during payment verification.');
          document.getElementById('purchaseModal').style.display = 'flex';
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Proceed to Payment 💳';
          }
        }
      }
    };
    
    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err) {
    console.error(err);
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Proceed to Payment 💳';
    }
    alert('Failed to connect to payment server. Please try again.');
  }
}

function showSuccessModal(pendingData) {
  
  // Set dynamic data
  const emailEl = document.getElementById('successEmail');
  if (emailEl) emailEl.textContent = pendingData.email;
  
  const planEl = document.getElementById('successPlanName');
  if (planEl) {
    let pName = 'Basic';
    if (pendingData.plan_id == 2) pName = 'Pro';
    if (pendingData.plan_id == 3) pName = 'Premium';
    planEl.textContent = pName + ' Plan';
  }
  
  window._pendingPurchase = null;
  document.getElementById('rzpSuccessOverlay').style.display = 'flex';
}

function closeSuccessModal() {
  document.getElementById('rzpSuccessOverlay').style.display = 'none';
  window.location.href = '/';
}

function goToDashboard() {
  window.location.href = '/admin/login.html';
}

// --- Password Strength ---
function updatePasswordStrength(val) {
  const p1 = document.getElementById('pw-strength-1');
  const p2 = document.getElementById('pw-strength-2');
  const p3 = document.getElementById('pw-strength-3');
  
  if (!p1 || !p2 || !p3) return;
  
  const hasMinLength = val.length >= 8;
  const hasNumber = /\d/.test(val);
  const hasSpecial = /[!@#$%^&*]/.test(val);
  
  let score = 0;
  if (val.length > 0) score = 1;
  if (hasMinLength) score = 2;
  if (hasMinLength && (hasNumber || hasSpecial)) score = 3;
  
  // Colors: red, yellow, green
  const c1 = score >= 1 ? '#EF4444' : 'rgba(255,255,255,0.1)';
  const c2 = score >= 2 ? '#F59E0B' : 'rgba(255,255,255,0.1)';
  const c3 = score >= 3 ? '#10B981' : 'rgba(255,255,255,0.1)';
  
  if (score === 3) {
    p1.style.background = '#10B981';
    p2.style.background = '#10B981';
    p3.style.background = '#10B981';
  } else {
    p1.style.background = c1;
    p2.style.background = c2;
    p3.style.background = c3;
  }
}
function closeRazorpayModal() {
  document.body.style.overflow = 'auto';
}

// Dynamically fetch and render plans on landing page
async function loadPlansAndRender() {
  try {
    const res = await fetch('/api/plans');
    if (!res.ok) throw new Error('Failed to fetch plans');
    const plans = await res.json();
    
    const grid = document.querySelector('.pricing-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    plans.forEach(p => {
      const isFeatured = p.name.toLowerCase() === 'standard';
      const features = getPlanFeatures(p.name);
      
      const card = document.createElement('div');
      card.className = `pricing-card${isFeatured ? ' featured' : ''}`;
      
      let badgeHTML = '';
      if (isFeatured) {
        badgeHTML = '<div class="badge">MOST POPULAR</div>';
      }
      
      let featuresListHTML = features.map(f => `<li>${f}</li>`).join('');
      
      card.innerHTML = `
        ${badgeHTML}
        <h3>${escapeHtml(p.name)} Plan</h3>
        <div class="price">₹${p.price}<span>/mo</span></div>
        <ul class="features-list">
          ${featuresListHTML}
        </ul>
        <button class="btn ${isFeatured ? 'btn-primary' : 'btn-outline'}" onclick="openPurchaseModal(${p.id}, '${escapeJs(p.name)}', ${p.price})">Purchase ${escapeHtml(p.name)}</button>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading plans on landing page:', err);
  }
}

function getPlanFeatures(planName) {
  const name = planName.toLowerCase();
  if (name.includes('basic')) {
    return [
      '✓ 1 AI Chatbot',
      '✓ 1000 Messages / month',
      '✓ Lead Capture Form',
      '✓ Knowledge Base (Text only)'
    ];
  } else if (name.includes('standard') || name.includes('pro')) {
    return [
      '✓ 3 AI Chatbots',
      '✓ 5,000 Messages / month',
      '✓ Flow Builder Setup',
      '✓ PDF & Web Link Training',
      '✓ Advanced Analytics'
    ];
  } else {
    return [
      '✓ Unlimited Chatbots',
      '✓ Unlimited Messages',
      '✓ White-label Dashboard',
      '✓ Voice Input Features',
      '✓ Priority 24/7 Support'
    ];
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function escapeJs(str) {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

// Simulate successful payment directly bypassing Razorpay for testing
async function simulatePaymentSuccess(event) {
  if (event) event.preventDefault();

  const companyName = document.getElementById('companyName').value.trim();
  const userEmail = document.getElementById('userEmail').value.trim();
  const userPhone = document.getElementById('userPhone').value.trim();
  const userPassword = document.getElementById('userPassword').value;

  // Validations
  if (!companyName) { alert('Please enter your company name.'); return; }
  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) { alert('Please enter a valid email address.'); return; }
  if (!userPhone) { alert('Please enter your phone number.'); return; }

  // Full password policy check
  const hasMinLength = userPassword.length >= 8;
  if (!hasMinLength) { alert('Password must be at least 8 characters long.'); return; }

  const pendingData = {
    company_name: companyName,
    email: userEmail,
    phone: userPhone,
    password: userPassword,
    plan_id: selectedPlanId
  };

  const submitBtn = document.getElementById('submitBtn');
  const loadingOverlay = document.getElementById('loading-overlay');
  
  if (loadingOverlay) {
    const loadingText = loadingOverlay.querySelector('div:last-child');
    if (loadingText) loadingText.textContent = 'Simulating payment success...';
    loadingOverlay.style.display = 'flex';
  }
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Simulating...';
  }

  try {
    const simulateRes = await fetch('/api/payment/simulate-success', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingData)
    });
    const simulateData = await simulateRes.json();
    
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    
    if (simulateRes.ok && simulateData.success) {
      document.getElementById('purchaseModal').style.display = 'none';
      showSuccessModal(pendingData);
    } else {
      alert('Simulation Failed: ' + (simulateData.error || 'Unknown error'));
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Proceed to Payment 💳';
      }
    }
  } catch(err) {
    console.error(err);
    if (loadingOverlay) loadingOverlay.style.display = 'none';
    alert('Error during simulated payment.');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Proceed to Payment 💳';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadPlansAndRender();
});