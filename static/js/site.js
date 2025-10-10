(() => {
  // ====== CONFIG ======
  const FORM_ENDPOINT = "https://formspree.io/f/mzzjryzl";

  // ====== UTIL ======
  const $ = (id) => document.getElementById(id);

  // ====== CONTACT FORM HANDLER ======
  const form = $("contactForm");
  if (form) {
    const submitBtn = $("contactSubmit");
    const statusEl  = $("formStatus");
    const ttv       = $("ttv");
    const startedAt = Date.now();

    form.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusEl.textContent = "";
  submitBtn.disabled = true;

  // 1) Built-in browser validation
  if (!form.reportValidity()) {
    submitBtn.disabled = false;
    return;
  }

  // 2) Spam heuristics
  ttv.value = Math.round((Date.now() - startedAt) / 1000); // time to submit (sec)
  if (form.company && form.company.value.trim() !== "") {
    submitBtn.disabled = false;
    return; // honeypot tripped
  }

  // 3) EMAIL CHECK 
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i; 
  const emailVal = form.email.value.trim();
  if (!EMAIL_RE.test(emailVal)) {
    form.email.setCustomValidity("Please enter a valid email like name@example.com");
    form.email.reportValidity();
    form.email.setCustomValidity("");
    submitBtn.disabled = false;
    return;
  }

  // 4) Build payload 
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.page = location.href;
  payload.userAgent = navigator.userAgent;

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      form.reset();
      statusEl.textContent = "Thanks — your message is on its way.";
    } else {
      let msg = "Hmm — something went wrong. Please try again or reach out directly via e-mail or phone";
      try {
        const err = await res.json();
        if (err?.error) msg = err.error;
      } catch {}
      statusEl.textContent = msg;
    }
  } catch {
    statusEl.textContent = "Network error — please try again or reach out directly via e-mail or phone";
  } finally {
    submitBtn.disabled = false;
  }
});
  }

  // ====== REVEAL EMAIL (toggle, no address in HTML) ======
const revealBtn   = $("revealEmail");
const emailStatus = $("emailStatus");

if (revealBtn) {
  const user = "lubertha.humphries";
  const host = "proton.me";
  let visible = false;
  let mailedOnce = false;

  const show = async () => {
    const addr = `${user}@${host}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(addr);
        emailStatus.textContent = ` ${addr} (copied)`;
      } else {
        emailStatus.textContent = ` ${addr}`;
      }
    } catch {
      emailStatus.textContent = ` ${addr}`;
    }
    revealBtn.setAttribute("aria-pressed", "true");
    revealBtn.textContent = "Hide email";
    if (!mailedOnce) {
      location.href = `mailto:${addr}`; // open mail app once
      mailedOnce = true;
    }
    visible = true;
  };

  const hide = () => {
    emailStatus.textContent = "";
    revealBtn.setAttribute("aria-pressed", "false");
    revealBtn.textContent = "Reveal email";
    visible = false;
  };

  revealBtn.addEventListener("click", () => (visible ? hide() : show()));
}
})();