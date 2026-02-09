import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://dupnqfzzhcxtzewnlaft.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1cG5xZnp6aGN4dHpld25sYWZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MDM2MDMsImV4cCI6MjA4NjE3OTYwM30.404qW1CAlHacEVz75KAuZwrYN3cZUvXYHOKAX2L6lvk";

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
    return;
  }

  // Logged in UI
  app.innerHTML = `
    <h1>Bookmarkly</h1>
    <p>Logged in as ${user.email}</p>

    <input id="url" placeholder="Paste a link" />
    <input id="name" placeholder="Display name (optional)" />
    <button id="save">Save Bookmark</button>

    <h2>Your Bookmarks</h2>
    <ul id="list"></ul>

    <button id="logout">Log out</button>
  `;

  document.getElementById("logout").onclick = async () => {
    await supabase.auth.signOut();
    load();
  };

  document.getElementById("save").onclick = async () => {
    const url = document.getElementById("url").value;
    const name = document.getElementById("name").value;

    if (!url) return alert("Please enter a URL");

    await supabase.from("links").insert({
      user_id: user.id,
      url,
      name,
      type: "Web"
    });

    document.getElementById("url").value = "";
    document.getElementById("name").value = "";

    load();
  };

  const { data: links } = await supabase
    .from("links")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  const list = document.getElementById("list");
  list.innerHTML = "";

  links.forEach(link => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${link.url}" target="_blank">${link.name || link.url}</a>`;
    list.appendChild(li);
  });
}

load();

