/* ==========================================================================
   FORMULAIRE DEMANDE DES SIGNALÉTIQUES V2 - LOGIQUE APPLICATION & SAISIE
   ========================================================================== */

const STORAGE_KEY = 'rma_signaletiques_form_v2';

document.addEventListener('DOMContentLoaded', () => {
    loadFormData();
    setDefaultDate();
    setupPhoneFormatting();
    initArabicVirtualKeyboard();
    applyAutomatedRules();
    setupEventListeners();
});

/**
 * 1. Initialise la date de la demande par défaut à la date du jour
 */
function setDefaultDate() {
    const dateInput = document.getElementById('date_demande');
    if (dateInput && !dateInput.value) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }
}

/**
 * 2. Formatage dynamique du champ Téléphone (Format: 00 00 00 00 00)
 */
function setupPhoneFormatting() {
    const phoneInput = document.getElementById('telephone');
    if (!phoneInput) return;

    phoneInput.addEventListener('input', (e) => {
        let digits = e.target.value.replace(/\D/g, '').substring(0, 10);
        let formatted = digits.match(/.{1,2}/g)?.join(' ') || digits;
        e.target.value = formatted;
    });
}

/**
 * 3. Logiques métier automatisées :
 * - facade_bandeau_1 > 5 => active "Largeur Enseigne >5m"
 * - rokhas_bandeau_1 vide => active "DRG_Sans"
 * - art_bandeau_2 coché  => active "DRG_Ensegne2" (Enseigne Secondaire)
 * - rokhas_Totem vide     => désactive art_totem
 */
function applyAutomatedRules() {
    // Règle 1: facade_bandeau_1 > 5 => Largeur Enseigne >5m
    const facadeInput = document.querySelector('input[name="facade_bandeau_1"]');
    const drg5mCheckbox = document.querySelector('.radio-row2 label:nth-child(4) input[type="checkbox"]');

    if (facadeInput && drg5mCheckbox) {
        const valStr = facadeInput.value.replace(',', '.').trim();
        const valNum = parseFloat(valStr);

        if (!isNaN(valNum) && valNum > 5) {
            drg5mCheckbox.checked = true;
        } else if (valStr !== "") {
            drg5mCheckbox.checked = false;
        }
    }

    // Règle 2: rokhas_bandeau_1 vide => DRG_Sans
    const rokhasInput = document.querySelector('input[name="rokhas_bandeau_1"]');
    const drgSansCheckbox = document.querySelector('input[name="DRG_Sans"]');

    if (rokhasInput && drgSansCheckbox) {
        if (rokhasInput.value.trim() === '') {
            drgSansCheckbox.checked = true;
        } else {
            drgSansCheckbox.checked = false;
        }
    }

    // Règle 3: art_bandeau_2 coché => DRG_Ensegne2 coché
    const artBandeau2Checkbox = document.getElementById('art_bandeau_2');
    const drgEnsegne2Checkbox = document.querySelector('input[name="DRG_Ensegne2"]');

    if (artBandeau2Checkbox && drgEnsegne2Checkbox) {
        drgEnsegne2Checkbox.checked = artBandeau2Checkbox.checked;
    }

    // Règle 4: rokhas_Totem vide => art_totem désactivé et décoché
    const rokhasTotemInput = document.querySelector('input[name="rokhas_Totem"]');
    const artTotemCheckbox = document.getElementById('art_totem');

    if (rokhasTotemInput && artTotemCheckbox) {
        if (rokhasTotemInput.value.trim() === '') {
            artTotemCheckbox.checked = false;
            artTotemCheckbox.disabled = true;
        } else {
            artTotemCheckbox.disabled = false;
        }
    }
}

/**
 * 4. Intégration du Clavier Virtuel Arabe pour raison_sociale1
 */
function initArabicVirtualKeyboard() {
    const targetInput = document.querySelector('input[name="raison_sociale1"]');
    if (!targetInput) return;

    const keyboardLayout = [
        ['ذ', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫'],
        ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
        ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
        ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'],
        ['espace', 'Fermer']
    ];

    const keyboardEl = document.createElement('div');
    keyboardEl.id = 'arabic-virtual-keyboard';
    keyboardEl.className = 'no-print arabic-keyboard-container';

    const headerEl = document.createElement('div');
    headerEl.className = 'ak-header';
    headerEl.innerHTML = '<span>لوحة المفاتيح العربية (Clavier Arabe)</span><button type="button" class="ak-close-btn">&times;</button>';
    keyboardEl.appendChild(headerEl);

    const bodyEl = document.createElement('div');
    bodyEl.className = 'ak-body';

    keyboardLayout.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'ak-row';

        row.forEach(key => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'ak-key';

            if (key === 'espace') {
                btn.textContent = 'مسافة (Espace)';
                btn.classList.add('ak-key-space');
                btn.onclick = () => insertAtCursor(targetInput, ' ');
            } else if (key === '⌫') {
                btn.textContent = '⌫';
                btn.classList.add('ak-key-backspace');
                btn.onclick = () => backspaceAtCursor(targetInput);
            } else if (key === 'Fermer') {
                btn.textContent = 'إغلاق';
                btn.classList.add('ak-key-close');
                btn.onclick = () => keyboardEl.classList.remove('active');
            } else {
                btn.textContent = key;
                btn.onclick = () => insertAtCursor(targetInput, key);
            }

            rowEl.appendChild(btn);
        });

        bodyEl.appendChild(rowEl);
    });

    keyboardEl.appendChild(bodyEl);
    document.body.appendChild(keyboardEl);

    targetInput.addEventListener('focus', () => {
        keyboardEl.classList.add('active');
    });

    headerEl.querySelector('.ak-close-btn').addEventListener('click', () => {
        keyboardEl.classList.remove('active');
    });

    document.addEventListener('click', (e) => {
        if (!keyboardEl.contains(e.target) && e.target !== targetInput) {
            keyboardEl.classList.remove('active');
        }
    });
}

function insertAtCursor(input, text) {
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = input.value;

    input.value = value.substring(0, start) + text + value.substring(end);
    input.selectionStart = input.selectionEnd = start + text.length;
    input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

function backspaceAtCursor(input) {
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = input.value;

    if (start === end && start > 0) {
        input.value = value.substring(0, start - 1) + value.substring(end);
        input.selectionStart = input.selectionEnd = start - 1;
    } else if (start !== end) {
        input.value = value.substring(0, start) + value.substring(end);
        input.selectionStart = input.selectionEnd = start;
    }

    input.focus();
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * Gestion des écouteurs généraux
 */
function setupEventListeners() {
    const form = document.getElementById('signaletique-form');
    if (!form) return;

    const handleInput = () => {
        applyAutomatedRules();
        saveFormData();
    };

    form.addEventListener('input', handleInput);
    form.addEventListener('change', handleInput);
}

function onlyOneCheck(checkbox) {
    const checkboxes = document.getElementsByName('type_reseau');
    checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false;
    });
    saveFormData();
}

function saveFormData() {
    const form = document.getElementById('signaletique-form');
    if (!form) return;

    const data = {};
    const inputs = form.querySelectorAll('input');
    inputs.forEach((input, index) => {
        const key = input.name || input.id || `field_${index}`;
        if (input.type === 'checkbox') {
            data[key] = input.checked;
        } else if (input.type === 'radio') {
            if (input.checked) data[input.name] = input.value;
        } else {
            data[key] = input.value;
        }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFormData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
        const data = JSON.parse(saved);
        const form = document.getElementById('signaletique-form');
        if (!form) return;

        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"], [id="${key}"]`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = Boolean(data[key]);
                } else if (input.type === 'radio') {
                    if (input.value === data[key]) input.checked = true;
                } else {
                    input.value = data[key];
                }
            }
        });
    } catch (e) {
        console.error("Erreur de chargement LocalStorage :", e);
    }
}

function resetForm() {
    if (confirm("Voulez-vous vraiment réinitialiser le formulaire ?")) {
        const form = document.getElementById('signaletique-form');
        if (form) form.reset();
        localStorage.removeItem(STORAGE_KEY);
        setDefaultDate();
        applyAutomatedRules();
    }
}

function exportToPDF() {
    const element = document.querySelector('.page-wrapper');
    const dateDemandeInput = document.getElementById('date_demande');
    const codeRmaInput = document.getElementById('code_rma');

    const dateDemande = dateDemandeInput ? dateDemandeInput.value : 'Demande';
    const codeRma = codeRmaInput ? codeRmaInput.value : 'RMA';

    // Masquer temporairement l'ombre pour un rendu net
    const originalShadow = element.style.boxShadow;
    const originalBorder = element.style.border;
    element.style.boxShadow = 'none';
    element.style.border = 'none';

    const opt = {
        margin:       [8, 8, 8, 8], // mm
        filename:     `Signaletiques_RMA_${codeRma}_${dateDemande}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.style.boxShadow = originalShadow;
        element.style.border = originalBorder;
    }).catch(err => {
        console.error("Erreur génération PDF:", err);
        element.style.boxShadow = originalShadow;
        element.style.border = originalBorder;
    });
}
