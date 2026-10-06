(() => {
  function init() {
    const trigger = document.querySelector(".topbar .profile-chip");

    if (!trigger || trigger.closest(".admin-account")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "admin-account";

    trigger.replaceWith(wrapper);

    wrapper.append(trigger);

    // Same icons as the user page
    const avatar = trigger.querySelector(".avatar");

    if (avatar) {
    avatar.innerHTML =
        '<i class="fas fa-user" aria-hidden="true"></i>';
    }

    const bell = document.querySelector(".topbar .icon-btn svg");

    if (bell) {
    bell.outerHTML =
        '<i class="fas fa-bell" aria-hidden="true"></i>';
    }
    wrapper.append(trigger);

    trigger.removeAttribute("onclick");

    if (trigger.tagName === "A") {
      trigger.removeAttribute("href");
    }

    trigger.setAttribute("role", "button");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", "adminAccountMenu");

    trigger.insertAdjacentHTML(
      "beforeend",
      `<svg class="account-chevron" aria-hidden="true"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <path d="m6 9 6 6 6-6"/>
      </svg>`
    );

    const menu = document.createElement("div");
    menu.id = "adminAccountMenu";
    menu.className = "admin-account-menu";
    menu.hidden = true;

    menu.innerHTML = `
      <a href="settings.html#accountSection">
        <svg aria-hidden="true" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
        </svg>
        Account
      </a>

      <button type="button" class="account-logout">
        <svg aria-hidden="true" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M9 3H4v18h5M14 8l5 4-5 4M8 12h11"/>
        </svg>
        Log out
      </button>
    `;

    wrapper.append(menu);

    function setOpen(open) {
      menu.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
    }

    trigger.addEventListener("click", event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(menu.hidden);
    }, true);

    trigger.addEventListener("keydown", event => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
        menu.querySelector("a").focus();
      } else if (
        trigger.tagName !== "BUTTON" &&
        ["Enter", " "].includes(event.key)
      ) {
        event.preventDefault();
        trigger.click();
      }
    });

    document.addEventListener("click", event => {
      if (!wrapper.contains(event.target)) {
        setOpen(false);
      }
    });

    wrapper.addEventListener("focusout", event => {
      if (!wrapper.contains(event.relatedTarget)) {
        setOpen(false);
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !menu.hidden) {
        setOpen(false);
        trigger.focus();
      }
    });

    function openAccount() {
      if (location.hash !== "#accountSection") return;

      const tab = document.querySelector(
        '.settings-tab[data-target="accountSection"]'
      );

      if (tab) tab.click();
    }

    menu.querySelector("a").addEventListener("click", () => {
      setOpen(false);

      if (document.getElementById("accountSection")) {
        document.querySelector(
          '.settings-tab[data-target="accountSection"]'
        )?.click();
      }
    });

    window.addEventListener("hashchange", openAccount);
    openAccount();

    menu.querySelector("button").addEventListener("click", () => {
      setOpen(false);

      const logout = document.getElementById("logoutBtn");

      if (logout && document.getElementById("logoutModal")) {
        logout.click();
        return;
      }

      for (const storage of [localStorage, sessionStorage]) {
        storage.removeItem("token");
        storage.removeItem("user");
      }

      window.location.replace("../login.html");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();