/* Servicely auth UI — frontend demo only.
   ASP.NET Core integration points:
   1) POST /api/auth/register to create account and request email OTP.
   2) POST /api/auth/verify-email to verify the submitted OTP.
   3) POST /api/auth/resend-otp to request another OTP.
   Replace the demo navigation/alerts below with fetch() calls when API endpoints are ready. */
(() => {
  "use strict";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  $$("[data-login-placeholder], [data-policy-placeholder]").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      alert("This page is a placeholder in the frontend demo.");
    });
  });

  // Registration page validation and demo navigation.
  const registerForm = $("#registerForm");
  if (registerForm) {
    const fullName = $("#fullName");
    const email = $("#email");
    const phone = $("#phone");
    const password = $("#password");
    const confirmPassword = $("#confirmPassword");
    const terms = $("#terms");
    const alertBox = $("#registerAlert");
    const strengthFill = $("#strengthFill");
    const strengthHelp = $("#passwordHelp");

    $$("[data-toggle-password]").forEach(button => {
      button.addEventListener("click", () => {
        const field = $("#" + button.dataset.togglePassword);
        const show = field.type === "password";
        field.type = show ? "text" : "password";
        button.innerHTML = `<i class="bi ${show ? "bi-eye-slash" : "bi-eye"}"></i>`;
        button.setAttribute("aria-label", show ? "Hide password" : "Show password");
        field.focus();
      });
    });

    const emailIsValid = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
    const scorePassword = value => {
      let score = 0;
      if (value.length >= 8) score++;
      if (value.length >= 12) score++;
      if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
      if (/\d/.test(value)) score++;
      if (/[^A-Za-z0-9]/.test(value)) score++;
      return Math.min(4, score);
    };
    const updateStrength = () => {
      const value = password.value;
      const score = value ? scorePassword(value) : 0;
      const widths = ["0%", "25%", "50%", "75%", "100%"];
      const colors = ["#e76d79", "#e76d79", "#e9b34d", "#72b7a2", "#45b88a"];
      strengthFill.style.width = widths[score];
      strengthFill.style.background = colors[score];
      strengthHelp.textContent = !value ? "Use 8+ characters with a number or symbol."
        : score <= 1 ? "Weak password — add more characters."
        : score === 2 ? "Fair — try adding a number or symbol."
        : score === 3 ? "Good password."
        : "Strong password.";
    };
    password.addEventListener("input", updateStrength);

    const setFieldState = (field, valid) => {
      const group = field.closest(".field-group");
      if (!group) return valid;
      group.classList.toggle("invalid", !valid);
      group.classList.toggle("valid", valid && field.value.trim().length > 0);
      field.setAttribute("aria-invalid", String(!valid));
      return valid;
    };
    const validateName = () => setFieldState(fullName, fullName.value.trim().length >= 2);
    const validateEmail = () => setFieldState(email, emailIsValid(email.value));
    const validatePhone = () => setFieldState(phone, !phone.value.trim() || phone.checkValidity());
    const validatePassword = () => setFieldState(password, password.value.length >= 8);
    const validateConfirm = () => setFieldState(confirmPassword, confirmPassword.value.length > 0 && confirmPassword.value === password.value);
    const validateTerms = () => {
      const group = terms.closest(".terms-check");
      group.classList.toggle("invalid", !terms.checked);
      terms.setAttribute("aria-invalid", String(!terms.checked));
      return terms.checked;
    };
    fullName.addEventListener("blur", validateName);
    email.addEventListener("blur", validateEmail);
    phone.addEventListener("blur", validatePhone);
    password.addEventListener("blur", validatePassword);
    confirmPassword.addEventListener("input", validateConfirm);
    password.addEventListener("input", () => { if (confirmPassword.value) validateConfirm(); });
    terms.addEventListener("change", validateTerms);

    registerForm.addEventListener("submit", event => {
      event.preventDefault();
      alertBox.hidden = true;
      const valid = [validateName(), validateEmail(), validatePhone(), validatePassword(), validateConfirm(), validateTerms()].every(Boolean);
      if (!valid) {
        const firstInvalid = $(".field-group.invalid input, .terms-check.invalid input", registerForm);
        if (firstInvalid) firstInvalid.focus();
        alertBox.textContent = "Please review the highlighted fields and try again.";
        alertBox.hidden = false;
        return;
      }
      // API integration: send fullName/email/phone/password to POST /api/auth/register.
      // Never store or pass the password in URL parameters.
      try { sessionStorage.setItem("servicely-demo-email", email.value.trim()); } catch (_) {}
      window.location.href = "verify-email.html?email=" + encodeURIComponent(email.value.trim());
    });
  }

  // Verification page: dynamic email, OTP keyboard behavior, paste, demo verification and resend timer.
  const otpForm = $("#otpForm");
  if (otpForm) {
    const emailDisplay = $("#emailDisplay");
    const params = new URLSearchParams(window.location.search);
    let passedEmail = params.get("email") || "";
    if (!passedEmail) {
      try { passedEmail = sessionStorage.getItem("servicely-demo-email") || ""; } catch (_) {}
    }
    emailDisplay.textContent = passedEmail || "you@example.com";

    const otpInputs = $$(".otp-input");
    const otpError = $("#otpError");
    const resendButton = $("#resendButton");
    const countdown = $("#countdown");
    const resendMessage = $("#resendMessage");
    let secondsLeft = 45;
    let timerId;

    const updateOtpStyles = () => otpInputs.forEach(input => input.classList.toggle("filled", Boolean(input.value)));
    const fillOtp = text => {
      const digits = (text.match(/\d/g) || []).slice(0, 6);
      otpInputs.forEach((input, index) => input.value = digits[index] || "");
      updateOtpStyles();
      const nextEmpty = otpInputs.find(input => !input.value);
      (nextEmpty || otpInputs[5]).focus();
      otpError.hidden = true;
    };

    otpInputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        const digit = (input.value.match(/\d/g) || []).slice(-1)[0] || "";
        input.value = digit;
        updateOtpStyles();
        otpError.hidden = true;
        if (digit && index < otpInputs.length - 1) otpInputs[index + 1].focus();
      });
      input.addEventListener("keydown", event => {
        if (event.key === "Backspace" && !input.value && index > 0) {
          otpInputs[index - 1].focus();
          otpInputs[index - 1].value = "";
          updateOtpStyles();
          event.preventDefault();
        } else if (event.key === "ArrowLeft" && index > 0) {
          otpInputs[index - 1].focus();
        } else if (event.key === "ArrowRight" && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });
      input.addEventListener("paste", event => {
        event.preventDefault();
        fillOtp((event.clipboardData || window.clipboardData).getData("text"));
      });
    });
    $(".otp-inputs").addEventListener("paste", event => {
      const text = (event.clipboardData || window.clipboardData).getData("text");
      if (/\d{2,}/.test(text)) {
        event.preventDefault();
        fillOtp(text);
      }
    });

    const renderCountdown = () => {
      const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
      const seconds = String(secondsLeft % 60).padStart(2, "0");
      countdown.textContent = `in ${minutes}:${seconds}`;
      resendButton.disabled = secondsLeft > 0;
      if (secondsLeft <= 0) {
        resendButton.innerHTML = 'Resend OTP <span id="countdown"></span>';
        resendMessage.textContent = "Didn't receive the code?";
      }
    };
    const startCountdown = () => {
      clearInterval(timerId);
      secondsLeft = 45;
      resendButton.innerHTML = 'Resend OTP <span id="countdown">in 00:45</span>';
      const countdownEl = $("#countdown");
      resendButton.disabled = true;
      const tick = () => {
        const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
        const seconds = String(secondsLeft % 60).padStart(2, "0");
        countdownEl.textContent = `in ${minutes}:${seconds}`;
        if (secondsLeft <= 0) {
          clearInterval(timerId);
          resendButton.disabled = false;
          countdownEl.textContent = "";
        } else secondsLeft--;
      };
      tick();
      timerId = setInterval(tick, 1000);
    };
    startCountdown();
    resendButton.addEventListener("click", () => {
      if (resendButton.disabled) return;
      // API integration: POST /api/auth/resend-otp with the user's email.
      resendMessage.textContent = "Demo only — no email was sent.";
      startCountdown();
    });

    otpForm.addEventListener("submit", event => {
      event.preventDefault();
      const code = otpInputs.map(input => input.value).join("");
      if (!/^\d{6}$/.test(code)) {
        otpError.textContent = "Please enter all 6 digits.";
        otpError.hidden = false;
        (otpInputs.find(input => !input.value) || otpInputs[0]).focus();
        return;
      }
      // API integration: POST /api/auth/verify-email with { email: passedEmail, otp: code }.
      // This demo intentionally does not claim the OTP is real or verified.
      otpError.textContent = "Demo only: the 6-digit code is complete, but no OTP was verified.";
      otpError.hidden = false;
    });
    otpInputs[0].focus({ preventScroll: true });
  }
})();
