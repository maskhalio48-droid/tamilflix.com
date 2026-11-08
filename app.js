async function authSubmit(ev) {
  ev.preventDefault();

  const form = $("authForm");
  const message = $("authMessage");
  const button = form.querySelector('button[type="submit"]');

  if (!client) {
    message.textContent = "Supabase connection failed.";
    return;
  }

  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;
  const mode = form.dataset.mode;

  button.disabled = true;
  button.textContent = "Please wait...";
  message.textContent = "Connecting...";

  try {
    let result;

    if (mode === "Register") {
      result = await client.auth.signUp({
        email,
        password
      });
    } else {
      result = await client.auth.signInWithPassword({
        email,
        password
      });
    }

    if (result.error) {
      throw result.error;
    }

    if (mode === "Register") {
      message.textContent =
        "Account created. Check your email.";
    } else {
      message.textContent = "Login successful!";
      hideModal("authModal");
    }

  } catch (error) {
    message.textContent =
      error.message || "Something went wrong.";
  } finally {
    button.disabled = false;
    button.textContent = "Continue";
  }
}
