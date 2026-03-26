// ── Stael Gissoni — Language Switcher ──
// Supports: en (English), pt (Portuguese)
// Usage: add data-i18n="key" to any element

const TRANSLATIONS = {
  en: {
    // NAV
    nav_about: 'About',
    nav_services: 'Services',
    nav_blog: 'Blog',
    nav_faq: 'FAQ',
    nav_book: 'Book a Session',

    // INDEX hero
    hero_tag: 'English & Portuguese Interpreter',
    hero_h1_1: 'Breaking language',
    hero_h1_em: 'barriers',
    hero_h1_2: ', one conversation at a time.',
    hero_p: 'Professional interpretation and language coaching for medical, legal, corporate, and personal settings across Orlando and worldwide.',
    hero_btn_book: 'Book a Session',
    hero_btn_services: 'View Services',

    // SERVICES page
    services_hero_h1_1: 'Services',
    services_hero_h1_em: 'tailored',
    services_hero_h1_2: ' to you',
    services_hero_p: 'Professional English–Portuguese interpretation and language coaching — every service designed around your needs.',
    svc_live_name: 'Live Interpretation',
    svc_live_summary: 'Real-time EN↔PT for meetings, conferences & events. I come to you.',
    svc_virtual_name: 'Virtual Session',
    svc_virtual_summary: 'Full interpretation via Google Meet or phone — same quality, anywhere.',
    svc_medical_name: 'Medical Interpretation',
    svc_medical_summary: 'Doctor visits, hospital, therapy & mental health — HIPAA aware.',
    svc_legal_name: 'Legal Interpretation',
    svc_legal_summary: 'Courts, depositions, attorney meetings & immigration proceedings.',
    svc_private_name: '1/1 Private Lessons',
    svc_private_summary: 'Personalized EN or PT lessons — all levels, conversation & culture.',
    svc_immigration_name: 'Immigration & Citizenship Prep',
    svc_immigration_summary: 'Green card interviews, citizenship test prep & USCIS guidance.',
    cta_unsure_h2: "Not sure which service fits?",
    cta_unsure_p: "Book a free 10-minute consultation and Stael will help you figure out exactly what you need.",
    cta_talk: "Let's Talk →",

    // BOOKING page
    book_hero_h1_1: 'Book your',
    book_hero_h1_em: 'session',
    book_hero_p: 'Pick a service, choose your time, and you\'re done — confirmed instantly.',
    step1_title: 'Choose a service',
    step1_sub: 'What do you need help with?',
    step2_title: 'When & who',
    step2_sub: 'Pick a date, time, and tell us about yourself.',
    step3_title: 'Review & confirm',
    step3_sub: 'Everything looks good? Let\'s get you booked.',
    label_date: 'SELECT A DATE',
    label_time: 'SELECT A TIME',
    label_fname: 'First Name',
    label_lname: 'Last Name',
    label_email: 'Email',
    label_phone: 'Phone',
    label_notes: 'Notes for Stael (optional)',
    notes_placeholder: 'Any details, requirements, or questions...',
    btn_continue: 'Continue →',
    btn_back: '← Back',
    btn_review: 'Review Booking →',
    btn_pay: 'Confirm & Pay →',
    summary_title: 'Booking Summary',
    summary_service: 'Service',
    summary_date: 'Date',
    summary_time: 'Time',
    summary_name: 'Name',
    summary_fee: 'Processing fee (3%)',
    summary_total: 'Total',
    trust_stripe: 'Payment secured by Stripe — encrypted & safe',
    trust_cancel: 'Free cancellation up to 24 hours before your session',

    // FOOTER
    footer_tagline: 'Professional English–Portuguese interpretation and language coaching. Connecting people, one conversation at a time.',
    footer_services: 'Services',
    footer_company: 'Company',
    footer_contact: 'Contact',
    footer_about: 'About',
    footer_how: 'How It Works',
    footer_testimonials: 'Testimonials',
    footer_faq: 'FAQ',
    footer_rights: '© 2026 Stael Gissoni. All rights reserved.',
    footer_privacy: 'Privacy Policy',
    footer_terms: 'Terms of Service',
  },

  pt: {
    // NAV
    nav_about: 'Sobre',
    nav_services: 'Serviços',
    nav_blog: 'Blog',
    nav_faq: 'FAQ',
    nav_book: 'Agendar Sessão',

    // INDEX hero
    hero_tag: 'Intérprete Inglês & Português',
    hero_h1_1: 'Quebrando',
    hero_h1_em: 'barreiras linguísticas',
    hero_h1_2: ', uma conversa de cada vez.',
    hero_p: 'Interpretação profissional e aulas de idiomas para áreas médica, jurídica, corporativa e pessoal em Orlando e no mundo inteiro.',
    hero_btn_book: 'Agendar Sessão',
    hero_btn_services: 'Ver Serviços',

    // SERVICES page
    services_hero_h1_1: 'Serviços',
    services_hero_h1_em: 'personalizados',
    services_hero_h1_2: ' para você',
    services_hero_p: 'Interpretação profissional Inglês–Português e aulas de idiomas — cada serviço pensado para suas necessidades.',
    svc_live_name: 'Interpretação Presencial',
    svc_live_summary: 'Interpretação EN↔PT em tempo real para reuniões, conferências e eventos.',
    svc_virtual_name: 'Sessão Virtual',
    svc_virtual_summary: 'Interpretação completa via Google Meet ou telefone — mesma qualidade, em qualquer lugar.',
    svc_medical_name: 'Interpretação Médica',
    svc_medical_summary: 'Consultas, hospital, terapia e saúde mental — com confidencialidade HIPAA.',
    svc_legal_name: 'Interpretação Jurídica',
    svc_legal_summary: 'Tribunais, depoimentos, reuniões com advogados e processos de imigração.',
    svc_private_name: 'Aulas Particulares 1/1',
    svc_private_summary: 'Aulas personalizadas de EN ou PT — todos os níveis, conversação e cultura.',
    svc_immigration_name: 'Preparação para Imigração e Cidadania',
    svc_immigration_summary: 'Entrevistas de green card, preparação para o teste de cidadania e orientação USCIS.',
    cta_unsure_h2: 'Não sabe qual serviço escolher?',
    cta_unsure_p: 'Agende uma consulta gratuita de 10 minutos e Stael ajudará a encontrar a melhor opção para você.',
    cta_talk: 'Vamos Conversar →',

    // BOOKING page
    book_hero_h1_1: 'Agende sua',
    book_hero_h1_em: 'sessão',
    book_hero_p: 'Escolha um serviço, selecione seu horário e pronto — confirmado na hora.',
    step1_title: 'Escolha um serviço',
    step1_sub: 'Com o que você precisa de ajuda?',
    step2_title: 'Quando e quem',
    step2_sub: 'Escolha uma data, horário e nos conte sobre você.',
    step3_title: 'Revisar e confirmar',
    step3_sub: 'Tudo certo? Vamos finalizar o seu agendamento.',
    label_date: 'SELECIONE UMA DATA',
    label_time: 'SELECIONE UM HORÁRIO',
    label_fname: 'Nome',
    label_lname: 'Sobrenome',
    label_email: 'E-mail',
    label_phone: 'Telefone',
    label_notes: 'Observações para Stael (opcional)',
    notes_placeholder: 'Detalhes, requisitos ou dúvidas...',
    btn_continue: 'Continuar →',
    btn_back: '← Voltar',
    btn_review: 'Revisar Agendamento →',
    btn_pay: 'Confirmar e Pagar →',
    summary_title: 'Resumo do Agendamento',
    summary_service: 'Serviço',
    summary_date: 'Data',
    summary_time: 'Horário',
    summary_name: 'Nome',
    summary_fee: 'Taxa de processamento (3%)',
    summary_total: 'Total',
    trust_stripe: 'Pagamento seguro via Stripe — criptografado e protegido',
    trust_cancel: 'Cancelamento gratuito até 24 horas antes da sessão',

    // FOOTER
    footer_tagline: 'Interpretação profissional Inglês–Português e aulas de idiomas. Conectando pessoas, uma conversa de cada vez.',
    footer_services: 'Serviços',
    footer_company: 'Empresa',
    footer_contact: 'Contato',
    footer_about: 'Sobre',
    footer_how: 'Como Funciona',
    footer_testimonials: 'Depoimentos',
    footer_faq: 'FAQ',
    footer_rights: '© 2026 Stael Gissoni. Todos os direitos reservados.',
    footer_privacy: 'Política de Privacidade',
    footer_terms: 'Termos de Serviço',
  }
};

// ── Core ──
const I18N = {
  current: localStorage.getItem('sf_lang') || 'en',

  t(key) {
    return TRANSLATIONS[this.current][key] || TRANSLATIONS['en'][key] || key;
  },

  set(lang) {
    this.current = lang;
    localStorage.setItem('sf_lang', lang);
    this.apply();
    this.updateToggle();
  },

  apply() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = this.t(key);
    });

    // Update html lang attribute
    document.documentElement.lang = this.current;
  },

  updateToggle() {
    const btn = document.getElementById('langToggle');
    if (!btn) return;
    btn.textContent = this.current === 'en' ? 'PT' : 'EN';
    btn.setAttribute('aria-label', this.current === 'en' ? 'Mudar para Português' : 'Switch to English');
  },

  toggle() {
    this.set(this.current === 'en' ? 'pt' : 'en');
  },

  init() {
    this.apply();
    this.updateToggle();
  }
};

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', () => I18N.init());
