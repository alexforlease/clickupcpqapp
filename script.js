// Configuration
const CONFIG = {
    plans: {
        "Business Plus": { 
            usdPerUserMo: 19, 
            includesAI: false, 
            minSeats: 1,
            features: [
                "Conditional logic in Forms",
                "Advanced automations", 
                "Team permissions"
            ]
        },
        "Enterprise": { 
            usdPerUserMo: 35, 
            includesAI: false, 
            minSeats: 15,
            features: [
                "Unlimited custom roles & permissions",
                "Increased API & automations",
                "Custom capacity planning & access to managed services"
            ]
        },
        "Enterprise Plus": { 
            usdPerUserMo: 55, 
            includesAI: true, 
            minSeats: 35,
            features: [
                "Dedicated ongoing support",
                "ClickUp AI included",
                "Advanced custom roles"
            ]
        }
    },
    addons: {
        "ClickUp AI": { 
            usdPerUserMo: 9, 
            allowedOn: ["Business Plus", "Enterprise"] 
        },
        "ClickUp Notetaker": { 
            usdPerUserMo: 10, 
            allowedOn: ["Business Plus", "Enterprise", "Enterprise Plus"] 
        },
        "Implementation": { 
            usdPerHour: 300, 
            minHours: 10, 
            stepHours: 10 
        }
    }
};

// Application State
let appState = {
    currentStep: 1,
    selectedPlan: null,
    selectedAddons: {
        "ClickUp AI": false,
        "ClickUp Notetaker": false
    },
    userCount: 0,
    discounts: {
        license: 0,
        ai: 0,
        notetaker: 0,
        implementation: 0
    },
    implementationHours: 0,
    customerName: '',
    expirationDate: '',
    additionalTerms: '',
    viewMode: 'annual' // Always annual
};

// DOM Elements
const progressSteps = document.querySelectorAll('.progress-step');
const wizardSteps = document.querySelectorAll('.wizard-step');
const planCards = document.querySelectorAll('.plan-card');
const addonCheckboxes = document.querySelectorAll('.addon-checkbox');
const userCountInput = document.getElementById('user-count');
const discountInputs = document.querySelectorAll('.discount-input');
const implementationSelect = document.getElementById('implementation-hours');
const customerNameInput = document.getElementById('customer-name');
const expirationDateInput = document.getElementById('expiration-date');
const additionalTermsInput = document.getElementById('additional-terms');
// Toggle buttons removed - always use annual view

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updatePricingSummary();
    updateNextButtonState();
});

function initializeEventListeners() {
    // Plan selection
    planCards.forEach(card => {
        card.addEventListener('click', function() {
            selectPlan(this.dataset.plan);
        });
    });

    // Add-on selection
    addonCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const addonCard = this.closest('.addon-card');
            const addonName = addonCard.dataset.addon;
            appState.selectedAddons[addonName] = this.checked;
            updatePricingSummary();
        });
    });

    // User count input
    userCountInput.addEventListener('input', function() {
        appState.userCount = parseInt(this.value) || 0;
        validateUserCount();
        updatePricingSummary();
        updateNextButtonState();
    });

    // Discount inputs
    discountInputs.forEach(input => {
        input.value = ''; // Start with blank fields
        input.addEventListener('input', function() {
            const type = this.dataset.type;
            appState.discounts[type] = parseFloat(this.value) || 0;
            updatePricingSummary();
        });
    });

    // Implementation hours
    implementationSelect.addEventListener('change', function() {
        appState.implementationHours = parseInt(this.value) || 0;
        updatePricingSummary();
        updateDiscountVisibility();
    });

    // Customer details
    customerNameInput.addEventListener('input', function() {
        appState.customerName = this.value;
    });

    expirationDateInput.addEventListener('change', function() {
        appState.expirationDate = this.value;
        validateExpirationDate();
        updateGeneratePDFButton();
    });

    additionalTermsInput.addEventListener('input', function() {
        appState.additionalTerms = this.value;
    });

    // View is always annual - no toggle needed

    // Navigation buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-next')) {
            nextStep();
        } else if (e.target.classList.contains('btn-prev')) {
            previousStep();
        } else if (e.target.classList.contains('btn-generate-pdf')) {
            generatePDF();
        }
    });
}

function selectPlan(planName) {
    appState.selectedPlan = planName;
    
    // Update UI
    planCards.forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.plan === planName) {
            card.classList.add('selected');
        }
    });

    // Update add-on availability
    updateAddonAvailability();
    updatePricingSummary();
    updateNextButtonState();
}

function updateAddonAvailability() {
    if (!appState.selectedPlan) return;

    const plan = CONFIG.plans[appState.selectedPlan];
    const aiCard = document.querySelector('[data-addon="ClickUp AI"]');
    const aiCheckbox = aiCard.querySelector('.addon-checkbox');
    const aiLabel = aiCard.querySelector('.checkbox-label');
    
    // Only grey out ClickUp AI for Enterprise Plus (since it includes AI)
    if (appState.selectedPlan === 'Enterprise Plus') {
        aiCard.classList.add('included');
        aiCard.classList.remove('disabled');
        aiLabel.innerHTML = '<span class="included-label">Included</span>';
        appState.selectedAddons["ClickUp AI"] = false; // Not counted as separate add-on
    } else {
        aiCard.classList.remove('disabled', 'included');
        aiLabel.innerHTML = '<input type="checkbox" class="addon-checkbox"><span class="checkmark"></span>Add to proposal';
        // Re-attach event listener
        const newCheckbox = aiLabel.querySelector('.addon-checkbox');
        newCheckbox.addEventListener('change', function() {
            appState.selectedAddons["ClickUp AI"] = this.checked;
            updatePricingSummary();
        });
    }

    // ClickUp Notetaker is available on all plans
    const notetakerCard = document.querySelector('[data-addon="ClickUp Notetaker"]');
    notetakerCard.classList.remove('disabled');
}

function validateUserCount() {
    const errorElement = document.getElementById('user-count-error');
    
    if (!appState.selectedPlan) {
        errorElement.textContent = '';
        return true;
    }
    
    const minSeats = CONFIG.plans[appState.selectedPlan].minSeats;
    
    if (appState.userCount < minSeats) {
        errorElement.textContent = `${appState.selectedPlan} requires a minimum of ${minSeats} users`;
        return false;
    } else {
        errorElement.textContent = '';
        return true;
    }
}

function validateExpirationDate() {
    const errorElement = document.getElementById('expiration-error');
    
    // Expiration date is now optional
    if (!appState.expirationDate) {
        errorElement.textContent = '';
        return true;
    }
    
    const today = new Date();
    const selectedDate = new Date(appState.expirationDate);
    
    if (selectedDate <= today) {
        errorElement.textContent = 'Expiration date must be in the future';
        return false;
    }
    
    errorElement.textContent = '';
    return true;
}

function updateNextButtonState() {
    const currentStepElement = document.querySelector(`#step-${appState.currentStep}`);
    const nextBtn = currentStepElement.querySelector('.btn-next');
    
    if (!nextBtn) return;
    
    let isValid = true;
    
    switch (appState.currentStep) {
        case 1:
            isValid = appState.selectedPlan !== null;
            break;
        case 2:
            isValid = appState.userCount > 0 && validateUserCount();
            break;
        default:
            isValid = true;
    }
    
    nextBtn.disabled = !isValid;
}

function updateGeneratePDFButton() {
    const generateBtn = document.querySelector('.btn-generate-pdf');
    if (generateBtn) {
        generateBtn.disabled = false; // Always enabled since expiration is optional
    }
}

function updateDiscountVisibility() {
    // Show/hide discount items based on selected options
    const aiDiscountItem = document.getElementById('ai-discount-item');
    const notetakerDiscountItem = document.getElementById('notetaker-discount-item');
    const implementationDiscountItem = document.getElementById('implementation-discount-item');
    
    // AI discount
    if (appState.selectedAddons["ClickUp AI"] && !CONFIG.plans[appState.selectedPlan]?.includesAI) {
        aiDiscountItem.style.display = 'block';
    } else {
        aiDiscountItem.style.display = 'none';
    }
    
    // Notetaker discount
    if (appState.selectedAddons["ClickUp Notetaker"]) {
        notetakerDiscountItem.style.display = 'block';
    } else {
        notetakerDiscountItem.style.display = 'none';
    }
    
    // Implementation discount - always visible in discount step
    implementationDiscountItem.style.display = 'block';
}

function calculatePricing() {
    if (!appState.selectedPlan || appState.userCount === 0) {
        return {
            license: { list: 0, discounted: 0, savings: 0 },
            ai: { list: 0, discounted: 0, savings: 0 },
            notetaker: { list: 0, discounted: 0, savings: 0 },
            implementation: { list: 0, discounted: 0, savings: 0 },
            totalSavings: 0,
            annualTotal: 0,
            perUserAnnual: 0
        };
    }
    
    const plan = CONFIG.plans[appState.selectedPlan];
    const multiplier = appState.viewMode === 'annual' ? 12 : 1;
    
    // License calculation
    const licenseList = plan.usdPerUserMo * appState.userCount * multiplier;
    const licenseDiscount = licenseList * (appState.discounts.license / 100);
    const licenseDiscounted = licenseList - licenseDiscount;
    
    // AI calculation
    let aiList = 0, aiDiscount = 0, aiDiscounted = 0;
    if (appState.selectedAddons["ClickUp AI"] && !plan.includesAI) {
        aiList = CONFIG.addons["ClickUp AI"].usdPerUserMo * appState.userCount * multiplier;
        aiDiscount = aiList * (appState.discounts.ai / 100);
        aiDiscounted = aiList - aiDiscount;
    }
    
    // Notetaker calculation
    let notetakerList = 0, notetakerDiscount = 0, notetakerDiscounted = 0;
    if (appState.selectedAddons["ClickUp Notetaker"]) {
        notetakerList = CONFIG.addons["ClickUp Notetaker"].usdPerUserMo * appState.userCount * multiplier;
        notetakerDiscount = notetakerList * (appState.discounts.notetaker / 100);
        notetakerDiscounted = notetakerList - notetakerDiscount;
    }
    
    // Implementation calculation
    let implementationList = 0, implementationDiscount = 0, implementationDiscounted = 0;
    if (appState.implementationHours > 0) {
        implementationList = CONFIG.addons.Implementation.usdPerHour * appState.implementationHours;
        implementationDiscount = implementationList * (appState.discounts.implementation / 100);
        implementationDiscounted = implementationList - implementationDiscount;
    }
    
    const totalSavings = licenseDiscount + aiDiscount + notetakerDiscount + implementationDiscount;
    const annualTotal = licenseDiscounted + aiDiscounted + notetakerDiscounted + implementationDiscounted;
    const perUserAnnual = appState.userCount > 0 ? (annualTotal / appState.userCount) : 0;
    
    return {
        license: { list: licenseList, discounted: licenseDiscounted, savings: licenseDiscount },
        ai: { list: aiList, discounted: aiDiscounted, savings: aiDiscount },
        notetaker: { list: notetakerList, discounted: notetakerDiscounted, savings: notetakerDiscount },
        implementation: { list: implementationList, discounted: implementationDiscounted, savings: implementationDiscount },
        totalSavings,
        annualTotal,
        perUserAnnual
    };
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(Math.round(amount));
}

function updatePricingSummary() {
    const pricing = calculatePricing();
    
    // Update plan name and includes
    const planNameElement = document.getElementById('selected-plan-name');
    const includesList = document.getElementById('includes-list');
    
    if (appState.selectedPlan) {
        planNameElement.textContent = appState.selectedPlan;
        const features = CONFIG.plans[appState.selectedPlan].features;
        includesList.innerHTML = features.map(feature => `<li>${feature}</li>`).join('');
    } else {
        planNameElement.textContent = 'Select a plan';
        includesList.innerHTML = '<li>Select a plan to see features</li>';
    }
    
    // Update pricing breakdown
    const licenseLineElement = document.getElementById('license-line');
    const aiLineElement = document.getElementById('ai-line');
    const notetakerLineElement = document.getElementById('notetaker-line');
    const implementationLineElement = document.getElementById('implementation-line');
    const savingsLineElement = document.getElementById('savings-line');
    const perUserLineElement = document.getElementById('per-user-line');
    
    // License
    if (appState.selectedPlan && appState.userCount > 0) {
        licenseLineElement.style.display = 'flex';
        const monthlyPerUser = (pricing.license.discounted / appState.userCount / 12).toFixed(0);
        const listMonthlyPerUser = (pricing.license.list / appState.userCount / 12).toFixed(0);
        const hasDiscount = pricing.license.savings > 0;
        
        if (hasDiscount) {
            document.getElementById('license-price').innerHTML = `
                <div style="font-size: 0.75rem; color: var(--clickup-gray-500); text-decoration: line-through;">$${listMonthlyPerUser}/user/mo</div>
                <div>$${monthlyPerUser}/user/mo × ${appState.userCount} users</div>
                <div style="font-weight: 700;">${formatCurrency(pricing.license.discounted)}/year</div>
            `;
        } else {
            document.getElementById('license-price').innerHTML = `
                <div>$${monthlyPerUser}/user/mo × ${appState.userCount} users</div>
                <div style="font-weight: 700;">${formatCurrency(pricing.license.discounted)}/year</div>
            `;
        }
    } else {
        licenseLineElement.style.display = 'none';
    }
    
    // AI
    if (pricing.ai.discounted > 0) {
        aiLineElement.style.display = 'flex';
        const monthlyPerUser = (pricing.ai.discounted / appState.userCount / 12).toFixed(0);
        const hasDiscount = pricing.ai.savings > 0;
        
        if (hasDiscount) {
            document.getElementById('ai-price').innerHTML = `
                <div style="font-size: 0.75rem; color: var(--clickup-gray-500); text-decoration: line-through;">$9/user/mo</div>
                <div>$${monthlyPerUser}/user/mo × ${appState.userCount} users</div>
                <div style="font-weight: 700;">${formatCurrency(pricing.ai.discounted)}/year</div>
            `;
        } else {
            document.getElementById('ai-price').innerHTML = `
                <div>$${monthlyPerUser}/user/mo × ${appState.userCount} users</div>
                <div style="font-weight: 700;">${formatCurrency(pricing.ai.discounted)}/year</div>
            `;
        }
    } else {
        aiLineElement.style.display = 'none';
    }
    
    // Notetaker
    if (pricing.notetaker.discounted > 0) {
        notetakerLineElement.style.display = 'flex';
        const monthlyPerUser = (pricing.notetaker.discounted / appState.userCount / 12).toFixed(0);
        const hasDiscount = pricing.notetaker.savings > 0;
        
        if (hasDiscount) {
            document.getElementById('notetaker-price').innerHTML = `
                <div style="font-size: 0.75rem; color: var(--clickup-gray-500); text-decoration: line-through;">$10/user/mo</div>
                <div>$${monthlyPerUser}/user/mo × ${appState.userCount} users</div>
                <div style="font-weight: 700;">${formatCurrency(pricing.notetaker.discounted)}/year</div>
            `;
        } else {
            document.getElementById('notetaker-price').innerHTML = `
                <div>$${monthlyPerUser}/user/mo × ${appState.userCount} users</div>
                <div style="font-weight: 700;">${formatCurrency(pricing.notetaker.discounted)}/year</div>
            `;
        }
    } else {
        notetakerLineElement.style.display = 'none';
    }
    
    // Implementation
    if (pricing.implementation.discounted > 0) {
        implementationLineElement.style.display = 'flex';
        const hasDiscount = pricing.implementation.savings > 0;
        
        if (hasDiscount) {
            const discountedHourlyRate = (pricing.implementation.discounted / appState.implementationHours).toFixed(0);
            document.getElementById('implementation-price').innerHTML = `
                <div style="font-size: 0.75rem; color: var(--clickup-gray-500); text-decoration: line-through;">$300/hour</div>
                <div>$${discountedHourlyRate}/hour × ${appState.implementationHours} hours</div>
                <div style="font-weight: 700;">${formatCurrency(pricing.implementation.discounted)} total</div>
            `;
        } else {
            document.getElementById('implementation-price').innerHTML = `
                <div>$300/hour × ${appState.implementationHours} hours</div>
                <div style="font-weight: 700;">${formatCurrency(pricing.implementation.discounted)} total</div>
            `;
        }
    } else {
        implementationLineElement.style.display = 'none';
    }
    
    // Total Savings
    if (pricing.totalSavings > 0) {
        savingsLineElement.style.display = 'flex';
        document.getElementById('total-savings').textContent = formatCurrency(pricing.totalSavings);
    } else {
        savingsLineElement.style.display = 'none';
    }
    
    // Annual Total
    document.getElementById('annual-total').textContent = formatCurrency(pricing.annualTotal);
    
    // Per User Annual
    if (appState.userCount > 0 && pricing.annualTotal > 0) {
        perUserLineElement.style.display = 'flex';
        document.getElementById('per-user-price').textContent = formatCurrency(pricing.perUserAnnual);
    } else {
        perUserLineElement.style.display = 'none';
    }
}

function nextStep() {
    if (appState.currentStep < 3) {
        appState.currentStep++;
        updateStepDisplay();
        updateDiscountVisibility();
    }
}

function previousStep() {
    if (appState.currentStep > 1) {
        appState.currentStep--;
        updateStepDisplay();
    }
}

function updateStepDisplay() {
    // Update progress bar
    progressSteps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNumber === appState.currentStep) {
            step.classList.add('active');
        } else if (stepNumber < appState.currentStep) {
            step.classList.add('completed');
        }
    });
    
    // Update wizard steps
    wizardSteps.forEach((step, index) => {
        const stepNumber = index + 1;
        step.classList.remove('active');
        
        if (stepNumber === appState.currentStep) {
            step.classList.add('active');
        }
    });
    
    updateNextButtonState();
}

function generatePDF() {
    if (!validateExpirationDate()) {
        alert('Please check your expiration date.');
        return;
    }
    
    const pricing = calculatePricing();
    
    // Create PDF template content
    const pdfTemplate = createPDFTemplate(pricing);
    
    // Insert template into hidden div
    const templateElement = document.getElementById('pdf-template');
    templateElement.innerHTML = pdfTemplate;
    templateElement.style.display = 'block';
    
    // Generate PDF using html2canvas and jsPDF
    html2canvas(templateElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 960, // 10 inches at 96 DPI
        height: 540 // 5.625 inches at 96 DPI
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'in',
            format: [10, 5.625]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, 10, 5.625);
        
        // Generate filename
        const date = new Date().toISOString().split('T')[0];
        const customerPart = appState.customerName || appState.selectedPlan;
        const filename = `ClickUp_Proposal_${customerPart.replace(/\s+/g, '_')}_${date}.pdf`;
        
        pdf.save(filename);
        
        // Hide template
        templateElement.style.display = 'none';
    }).catch(error => {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please try again.');
        templateElement.style.display = 'none';
    });
}

function createPDFTemplate(pricing) {
    const currentDate = new Date();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    const currentMonth = monthNames[currentDate.getMonth()];
    
    const expirationFormatted = appState.expirationDate ? 
        new Date(appState.expirationDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : null;
    
    let tableRows = '';
    
    // License row
    if (pricing.license.discounted > 0) {
        const discountRate = pricing.license.savings > 0 ? ((pricing.license.list - pricing.license.discounted) / pricing.license.list * 100).toFixed(0) : '0';
        const listRate = (pricing.license.list / appState.userCount / 12).toFixed(0);
        const discountedRate = parseFloat((pricing.license.discounted / appState.userCount / 12).toFixed(2));
        const hasDiscount = pricing.license.savings > 0;
        
        tableRows += `
            <tr>
                <td>${appState.selectedPlan} License</td>
                <td class="col-qty">${appState.userCount}</td>
                <td class="col-list">${hasDiscount ? `<s>$${listRate}/Mo</s>` : `$${listRate}/Mo`}</td>
                <td class="col-disc">${discountRate}%</td>
                <td class="col-dunit">$${discountedRate}/Mo</td>
                <td class="col-price">${formatCurrency(pricing.license.discounted)}</td>
            </tr>
        `;
    }
    
    // AI row
    if (pricing.ai.discounted > 0) {
        const discountRate = pricing.ai.savings > 0 ? ((pricing.ai.list - pricing.ai.discounted) / pricing.ai.list * 100).toFixed(0) : '0';
        const discountedRate = parseFloat((pricing.ai.discounted / appState.userCount / 12).toFixed(2));
        const hasDiscount = pricing.ai.savings > 0;
        
        tableRows += `
            <tr>
                <td>ClickUp AI</td>
                <td class="col-qty">${appState.userCount}</td>
                <td class="col-list">${hasDiscount ? '<s>$9/Mo</s>' : '$9/Mo'}</td>
                <td class="col-disc">${discountRate}%</td>
                <td class="col-dunit">$${discountedRate}/Mo</td>
                <td class="col-price">${formatCurrency(pricing.ai.discounted)}</td>
            </tr>
        `;
    }
    
    // Notetaker row
    if (pricing.notetaker.discounted > 0) {
        const discountRate = pricing.notetaker.savings > 0 ? ((pricing.notetaker.list - pricing.notetaker.discounted) / pricing.notetaker.list * 100).toFixed(0) : '0';
        const discountedRate = parseFloat((pricing.notetaker.discounted / appState.userCount / 12).toFixed(2));
        const hasDiscount = pricing.notetaker.savings > 0;
        
        tableRows += `
            <tr>
                <td>ClickUp Notetaker</td>
                <td class="col-qty">${appState.userCount}</td>
                <td class="col-list">${hasDiscount ? '<s>$10/Mo</s>' : '$10/Mo'}</td>
                <td class="col-disc">${discountRate}%</td>
                <td class="col-dunit">$${discountedRate}/Mo</td>
                <td class="col-price">${formatCurrency(pricing.notetaker.discounted)}</td>
            </tr>
        `;
    }
    
    // Implementation row
    if (pricing.implementation.discounted > 0) {
        const discountRate = pricing.implementation.savings > 0 ? ((pricing.implementation.list - pricing.implementation.discounted) / pricing.implementation.list * 100).toFixed(0) : '0';
        const hasDiscount = pricing.implementation.savings > 0;
        const discountedHourlyRate = hasDiscount ? parseFloat((pricing.implementation.discounted / appState.implementationHours).toFixed(2)) : '300';
        
        tableRows += `
            <tr>
                <td>Implementation Services</td>
                <td class="col-qty">${appState.implementationHours} Hrs.</td>
                <td class="col-list">${hasDiscount ? '<s>$300</s>' : '$300'}</td>
                <td class="col-disc">${discountRate}%</td>
                <td class="col-dunit">${hasDiscount ? '$' + discountedHourlyRate : '–'}</td>
                <td class="col-price">${formatCurrency(pricing.implementation.discounted)}</td>
            </tr>
        `;
    }
    
    const features = CONFIG.plans[appState.selectedPlan].features;
    const includesBullets = features.map(feature => `
        <div class="bullet">
            <div class="bullet-dot"></div>
            <div class="bullet-text">${feature}</div>
        </div>
    `).join('');
    
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>ClickUp Pricing Proposal</title>
        <style>
          :root{
            --page-w: 10in;
            --page-h: 5.625in;
            --bg-gradient-start: #7a5cff;
            --bg-gradient-end: #4fc3f7;
            --card-bg: #ffffff;
            --table-head-bg: #6a4fd6;
            --table-head-text: #ffffff;
            --table-row-border: #e9ecf3;
            --price-green-bg: #9bd18a;
            --total-row-bg: #f4f5f9;
            --ink: #1c1f28;
            --muted: #57607a;
            --includes-head-bg: #6a4fd6;
            --includes-head-text: #ffffff;
            --disclaimer-bg: #f7ff61;
          }

          html,body{
            margin:0; background:#111; color:var(--ink);
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
          }

          .slide{
            width:var(--page-w); height:var(--page-h);
            background:linear-gradient(135deg,var(--bg-gradient-start),var(--bg-gradient-end));
            padding:0.35in; box-sizing:border-box; overflow:hidden;
          }

          .card{
            background:var(--card-bg);
            border-radius:0.12in;
            width:100%; height:100%;
            padding:0.3in; box-sizing:border-box;
            box-shadow:0 0.05in 0.25in rgba(16,24,40,.12);
            display:flex; flex-direction:column; gap:0.25in; overflow:hidden;
          }

          .title-band{
            height:0.6in; border-radius:0.12in;
            background:linear-gradient(135deg,#774aff,#57c7f7);
            flex:0 0 auto;
            display:flex; align-items:center; justify-content:center;
            color:white; font-size:0.2in; font-weight:700;
          }

          .content{
            flex:1 1 auto; min-height:0;
            display:grid;
            grid-template-columns: minmax(0,1fr) 1.6in;
            gap:0.40in;
          }

          table.pricing{
            width:100%; height:100%;
            border-collapse:collapse; table-layout:fixed;
            font-size:0.11in;
            border-radius:0.08in; overflow:hidden; background:#fff;
          }
          table.pricing thead th{
            background:var(--table-head-bg); color:var(--table-head-text);
            text-align:left; padding:0.10in 0.12in; font-weight:700;
          }
          table.pricing tbody td{
            padding:0.12in; border-bottom:0.5pt solid var(--table-row-border);
            vertical-align:middle; color:var(--ink);
          }

          .col-product { width: 1.80in; }
          .col-qty     { width: 0.50in; text-align: center; }
          .col-list    { width: 0.85in; text-align: right; }
          .col-disc    { width: 0.60in; text-align: center; }
          .col-dunit   { width: 0.90in; text-align: right; }
          .col-price   { width: 0.65in; text-align: right; }

          .savings-row td{ background:var(--price-green-bg); font-weight:700; }
          .savings-row .label{ text-align:right; padding-right:0.18in; }
          .annual-row td{ background:var(--total-row-bg); font-weight:700; }

          .includes{
            background:#fff; border-radius:0.12in;
            box-shadow:0 0.05in 0.25in rgba(16,24,40,.08);
            display:flex; flex-direction:column; overflow:hidden; max-height:100%;
          }
          .includes-header{
            background:var(--includes-head-bg); color:var(--includes-head-text);
            text-align:center; font-weight:800; padding:0.12in 0.10in; font-size:0.15in;
            flex:0 0 auto;
          }
          .includes-body{
            padding:0.14in 0.16in; display:grid; gap:0.09in; flex:1 1 auto; overflow:hidden;
          }
          
          .bullet{ display:grid; grid-template-columns:0.12in 1fr; gap:0.12in; align-items:start; color:var(--muted); min-height:0.14in; }
          .bullet-dot{ width:0.08in; height:0.08in; border-radius:50%; background:#6a4fd6; margin-top:0.02in; }
          .bullet-text{ min-height:0.10in; font-size:0.10in; }

          .disclaimer{
            flex:0 0 auto; height:0.45in; background:var(--disclaimer-bg);
            border-radius:0.04in; display:flex; align-items:center;
            padding:0 0.18in; font-size:0.11in; color:var(--ink); box-sizing:border-box;
          }

          @page{ size:var(--page-w) var(--page-h); margin:0; }
          @media print{ body{background:#fff;} .slide{box-shadow:none; margin:0;} }
        </style>
        </head>
        <body>
          <section class="slide">
            <div class="card">
              <div class="title-band">${appState.userCount} ${appState.selectedPlan} Users — ${currentMonth} Pricing</div>

              <div class="content">
                <div>
                  <table class="pricing">
                    <thead>
                      <tr>
                        <th class="col-product">Product Name</th>
                        <th class="col-qty">Qty.</th>
                        <th class="col-list">List Unit<br/>Rate</th>
                        <th class="col-disc">Discount</th>
                        <th class="col-dunit">Discounted<br/>Unit Rate</th>
                        <th class="col-price">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${tableRows}
                      ${pricing.totalSavings > 0 ? `
                        <tr class="savings-row">
                          <td colspan="5" class="label">Total Savings</td>
                          <td class="col-price">${formatCurrency(pricing.totalSavings)}</td>
                        </tr>
                      ` : ''}
                      <tr class="annual-row">
                        <td><strong>Annual Total</strong></td>
                        <td colspan="4"></td>
                        <td class="col-price">${formatCurrency(pricing.annualTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <aside class="includes">
                  <div class="includes-header">Includes</div>
                  <div class="includes-body">
                    ${includesBullets}
                  </div>
                </aside>
              </div>

              ${appState.expirationDate ? `<div class="disclaimer">*Discounts are contingent upon finalizing a partnership by ${expirationFormatted}</div>` : ''}
            </div>
          </section>
        </body>
        </html>
    `;
}
