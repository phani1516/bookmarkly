import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "PASTE_YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const app = document.getElementById("app");

async function load() {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    app.innerHTML = `
      <h1>Bookmarkly</h1>
      <input id="email" placeholder="Email" />
      <input id="password" type="password" placeholder="Password" />
      <button id="login">Sign In / Sign Up</button>
    `;

    document.getElementById("login").onclick = async () => {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      await supabase.auth.signInWithPassword({ email, password })
        .catch(() => supabase.auth.signUp({ email, password }));

      load();
    };
  } else {
    app.innerHTML = `
      <h1>Bookmarkly</h1>
      <p>Logged in as ${user.email}</p>
      <button id="logout">Log out</button>
    `;

    document.getElementById("logout").onclick = async () => {
      await supabase.auth.signOut();
      load();
    };
  }
}

load();
