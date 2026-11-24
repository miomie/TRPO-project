(() => {
  "use strict";
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const KEY = "career_platform_db_v1",
    SESSION = "career_platform_user_v1";
  const initial = {
    users: [
      {
        id: 1,
        email: "hr@gmail.com",
        password: "demo123",
        role: "recruiter",
        fullName: "Алексеева Елена Игоревна",
        phone: "+375291112233",
        company_id: 1,
      },
      {
        id: 2,
        email: "dev@mail.ru",
        password: "demo123",
        role: "applicant",
        fullName: "Иванов Иван Сергеевич",
        phone: "+375336667788",
      },
      {
        id: 3,
        email: "petrova@mail.ru",
        password: "demo123",
        role: "applicant",
        fullName: "Петрова Анна Сергеевна",
        phone: "+375293334455",
      },
    ],
    companies: [
      { id: 1, owner_id: 1, name: "HR Solutions", city: "Минск", website: "" },
    ],
    vacancies: [
      {
        id: 11,
        title: "Middle Python Developer",
        department: "Отдел разработки",
        salary: "3500 BYN",
        city: "Минск",
        description:
          "Опыт работы от 2 лет, знание Django/FastAPI, PostgreSQL, Docker.",
        status: "active",
        created_at: "2026-10-01",
        company_id: 1,
        employment: "Полная занятость",
        experience: 2,
        skills: ["Python", "Django", "FastAPI", "PostgreSQL", "Docker"],
      },
      {
        id: 12,
        title: "HR-менеджер / Специалист по подбору",
        department: "Отдел кадров",
        salary: "2000 BYN",
        city: "Минск",
        description:
          "Опыт проведения интервью, ведение базы кандидатов, проведение первичного скрининга резюме.",
        status: "active",
        created_at: "2026-10-03",
        company_id: 1,
        employment: "Полная занятость",
        experience: 1,
        skills: ["Подбор персонала", "Интервью"],
      },
    ],
    resumes: [
      {
        id: 31,
        applicant_id: 2,
        title: "Middle Python Developer",
        city: "Минск",
        experience: 3,
        skills: ["Python", "Django", "FastAPI", "PostgreSQL", "Docker"],
        about:
          "Разработчик backend-приложений. Ищу интересные задачи и команду.",
        active: true,
      },
      {
        id: 32,
        applicant_id: 3,
        title: "HR-менеджер",
        city: "Минск",
        experience: 2,
        skills: ["Подбор персонала", "Интервью", "Коммуникации"],
        about: "Специалист по подбору персонала.",
        active: true,
      },
    ],
    applications: [
      {
        id: 21,
        vacancy_id: 11,
        applicant_id: 2,
        resume_link: "",
        stage: "Интервью",
        created_at: "2026-10-04",
      },
      {
        id: 22,
        vacancy_id: 12,
        applicant_id: 3,
        resume_link: "",
        stage: "Первичный отбор",
        created_at: "2026-10-05",
      },
    ],
    favorites: [],
  };
  let db;
  try {
    db = JSON.parse(localStorage.getItem(KEY)) || structuredClone(initial);
  } catch {
    db = structuredClone(initial);
  }
  [
    "users",
    "companies",
    "vacancies",
    "resumes",
    "applications",
    "favorites",
  ].forEach((k) => {
    if (!Array.isArray(db[k])) db[k] = initial[k] || [];
  });
  function save() {
    localStorage.setItem(KEY, JSON.stringify(db));
  }
  function esc(v = "") {
    return String(v).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  }
  function money(v) {
    const n = parseInt(String(v || "").replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : 0;
  }
  function date(v) {
    if (!v) return "—";
    return new Date(v + "T00:00:00").toLocaleDateString("ru-RU");
  }
  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2800);
  }
  function current() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION));
      return db.users.find((u) => u.id === s?.id) || null;
    } catch {
      return null;
    }
  }
  function setCurrent(user) {
    sessionStorage.setItem(SESSION, JSON.stringify({ id: user.id }));
  }
  function logout() {
    sessionStorage.removeItem(SESSION);
    location.href = "index.html";
  }
  function companyFor(user) {
    return (
      db.companies.find((c) => c.owner_id === user?.id) ||
      db.companies.find((c) => c.id === user?.company_id)
    );
  }
  function applicantResume(user) {
    return db.resumes.find((r) => r.applicant_id === user?.id);
  }
  function userById(id) {
    return db.users.find((u) => u.id === Number(id));
  }
  function companyByVacancy(v) {
    return (
      db.companies.find((c) => c.id === v.company_id) || {
        name: "Работодатель",
        city: v.city,
      }
    );
  }
  function goDashboard(user) {
    location.href =
      user.role === "recruiter" ? "employer.html" : "applicant.html";
  }
  function requireRole(role) {
    const u = current();
    if (!u) {
      location.href = "auth.html";
      return null;
    }
    if (u.role !== role) {
      goDashboard(u);
      return null;
    }
    return u;
  }
  function vacancyCard(v, compact = false) {
    const co = companyByVacancy(v),
      u = current(),
      saved = (db.favorites || []).some(
        (x) => x.user_id === u?.id && x.vacancy_id === v.id,
      );
    return `<article class="vacancy-card"><div class="company-line"><span>▣</span>${esc(co.name)} · ${esc(v.city)}</div><h3>${esc(v.title)}</h3><p>${esc(v.description || "Описание не добавлено")}</p><div class="salary">${esc(v.salary || "Зарплата не указана")}</div><div>${(
      v.skills || []
    )
      .slice(0, 4)
      .map((s) => `<span class="tag">${esc(s)}</span>`)
      .join(
        "",
      )}</div>${!compact ? `<div class="card-actions"><button class="btn btn-primary" data-apply="${v.id}">Откликнуться</button><button class="btn btn-soft" data-fav="${v.id}">${saved ? "★ В избранном" : "☆ В избранное"}</button></div>` : ""}</article>`;
  }
  function bindVacancyActions(root = document) {
    $$("[data-apply]", root).forEach((b) =>
      b.addEventListener("click", () =>
        applyToVacancy(Number(b.dataset.apply)),
      ),
    );
    $$("[data-fav]", root).forEach((b) =>
      b.addEventListener("click", () => toggleFavorite(Number(b.dataset.fav))),
    );
  }
  function applyToVacancy(id) {
    const u = current();
    if (!u) {
      location.href = "auth.html";
      return;
    }
    if (u.role !== "applicant") {
      toast("Отклик доступен только соискателям");
      return;
    }
    const resume = applicantResume(u);
    if (!resume) {
      toast("Сначала заполните резюме в личном кабинете");
      return;
    }
    if (
      db.applications.some(
        (a) => a.vacancy_id === id && a.applicant_id === u.id,
      )
    ) {
      toast("Вы уже откликались на эту вакансию");
      return;
    }
    db.applications.push({
      id: Date.now(),
      vacancy_id: id,
      applicant_id: u.id,
      resume_link: "",
      stage: "Новый",
      created_at: new Date().toISOString().slice(0, 10),
    });
    save();
    toast("Отклик успешно отправлен");
  }
  function toggleFavorite(id) {
    const u = current();
    if (!u) {
      location.href = "auth.html";
      return;
    }
    const i = db.favorites.findIndex(
      (x) => x.user_id === u.id && x.vacancy_id === id,
    );
    if (i >= 0) db.favorites.splice(i, 1);
    else db.favorites.push({ user_id: u.id, vacancy_id: id });
    save();
    toast(i >= 0 ? "Удалено из избранного" : "Добавлено в избранное");
    if (location.pathname.endsWith("vacancies.html")) renderVacancies();
  }
  function updateHeader() {
    const u = current(),
      box = $("#headerActions");
    if (!box || !u) return;
    box.innerHTML = `<span class="header-user">${esc(u.fullName.split(" ")[0])}</span><a class="btn btn-light" href="${u.role === "recruiter" ? "employer.html" : "applicant.html"}">Личный кабинет</a>`;
  }
  function renderHome() {
    const host = $("#homeVacancies");
    if (!host) return;
    host.innerHTML =
      db.vacancies
        .filter((v) => v.status === "active")
        .slice()
        .sort((a, b) => b.id - a.id)
        .slice(0, 3)
        .map((v) => vacancyCard(v, true))
        .join("") ||
      '<div class="empty-state">Пока нет опубликованных вакансий</div>';
    const form = $("#homeSearch");
    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      sessionStorage.setItem(
        "vacancySearch",
        JSON.stringify({ q: d.get("q"), city: d.get("city") }),
      );
      location.href = "vacancies.html";
    });
  }
  function renderVacancies() {
    const list = $("#vacancyList");
    if (!list) return;
    const city = $("#vacancyCity"),
      cities = [
        ...new Set(db.vacancies.map((v) => v.city).filter(Boolean)),
      ].sort();
    if (city && city.options.length <= 1)
      city.innerHTML =
        '<option value="">Все города</option>' +
        cities.map((c) => `<option>${esc(c)}</option>`).join("");
    const q = ($("#vacancyQuery")?.value || "").toLowerCase().trim(),
      c = city?.value || "",
      emp = $("#vacancyEmployment")?.value || "",
      exp = $("#vacancyExperience")?.value || "";
    let items = db.vacancies
      .filter((v) => v.status === "active")
      .filter((v) => {
        const co = companyByVacancy(v),
          hay = [
            v.title,
            v.description,
            v.department,
            co.name,
            ...(v.skills || []),
          ]
            .join(" ")
            .toLowerCase();
        return (
          (!q || hay.includes(q)) &&
          (!c || v.city === c) &&
          (!emp || v.employment === emp) &&
          (!exp || Number(v.experience || 0) >= Number(exp))
        );
      });
    if ($("#vacancySort")?.value === "salary")
      items.sort((a, b) => money(b.salary) - money(a.salary));
    else
      items.sort((a, b) =>
        String(b.created_at).localeCompare(String(a.created_at)),
      );
    $("#vacancyCount").textContent = `Найдено вакансий: ${items.length}`;
    list.innerHTML =
      items
        .map((v) => {
          const co = companyByVacancy(v);
          return `<article class="job-row"><div class="row-main"><div class="company-line">${esc(co.name)} · ${esc(v.city)} · ${esc(v.employment || "Занятость не указана")}</div><h3>${esc(v.title)}</h3><p>${esc(v.description)}</p><div>${(v.skills || []).map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div></div><div class="row-side"><b class="salary">${esc(v.salary || "По договорённости")}</b><button class="btn btn-primary" data-apply="${v.id}">Откликнуться</button><button class="text-link" data-fav="${v.id}">☆ В избранное</button></div></article>`;
        })
        .join("") ||
      '<div class="empty-state">По заданным параметрам вакансии не найдены. Измените фильтры и попробуйте снова.</div>';
    bindVacancyActions(list);
  }
  function initVacancies() {
    const saved = JSON.parse(sessionStorage.getItem("vacancySearch") || "{}");
    renderVacancies();
    if (saved.q) $("#vacancyQuery").value = saved.q;
    if (saved.city) $("#vacancyCity").value = saved.city;
    sessionStorage.removeItem("vacancySearch");
    [
      "#vacancyQuery",
      "#vacancyCity",
      "#vacancyEmployment",
      "#vacancyExperience",
      "#vacancySort",
    ].forEach((s) => $(s)?.addEventListener("input", renderVacancies));
    $("#resetVacancyFilters")?.addEventListener("click", () => {
      $("#vacancyQuery").value = "";
      $("#vacancyCity").value = "";
      $("#vacancyEmployment").value = "";
      $("#vacancyExperience").value = "";
      renderVacancies();
    });
    renderVacancies();
  }
  function initAuth() {
    const form = $("#authForm");
    if (!form) return;
    const params = new URLSearchParams(location.search);
    let mode = params.get("mode") === "register" ? "register" : "login";
    const role = params.get("role");
    if (role === "recruiter" || role === "applicant") {
      $(`input[name="role"][value="${role}"]`).checked = true;
    }
    function show() {
      const reg = mode === "register";
      $$("[data-auth-tab]").forEach((b) =>
        b.classList.toggle("active", b.dataset.authTab === mode),
      );
      $("#authTitle").textContent = reg ? "Создать аккаунт" : "Войти в аккаунт";
      $("#registerFields").hidden = !reg;
      $("#authSubmit").textContent = reg ? "Зарегистрироваться" : "Войти";
      $("#authNote").hidden = reg;
      form.elements.fullName.required = reg;
      form.elements.phone.required = reg;
      syncRole();
    }
    function syncRole() {
      const recruiter = form.elements.role.value === "recruiter";
      $("#companyField").hidden = !(mode === "register" && recruiter);
      form.elements.company.required = mode === "register" && recruiter;
    }
    $$("[data-auth-tab]").forEach((b) =>
      b.addEventListener("click", () => {
        mode = b.dataset.authTab;
        show();
      }),
    );
    $$('input[name="role"]', form).forEach((r) =>
      r.addEventListener("change", syncRole),
    );
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form),
        email = String(d.get("email")).trim().toLowerCase(),
        password = String(d.get("password"));
      if (mode === "login") {
        const u = db.users.find(
          (x) => x.email.toLowerCase() === email && x.password === password,
        );
        if (!u) {
          toast("Неверный email или пароль");
          return;
        }
        setCurrent(u);
        goDashboard(u);
        return;
      }
      if (db.users.some((x) => x.email.toLowerCase() === email)) {
        toast("Пользователь с таким email уже зарегистрирован");
        return;
      }
      const newUser = {
        id: Date.now(),
        email,
        password,
        role: d.get("role"),
        fullName: String(d.get("fullName")).trim(),
        phone: String(d.get("phone")).trim(),
      };
      db.users.push(newUser);
      if (newUser.role === "recruiter") {
        const company = {
          id: Date.now() + 1,
          owner_id: newUser.id,
          name: String(d.get("company")).trim(),
          city: "",
          website: "",
        };
        db.companies.push(company);
        newUser.company_id = company.id;
      }
      save();
      setCurrent(newUser);
      toast("Аккаунт создан");
      goDashboard(newUser);
    });
    show();
  }
  function initApplicant() {
    const u = requireRole("applicant");
    if (!u) return;
    $("#applicantIdentity").innerHTML =
      `${esc(u.fullName)}<small>${esc(u.email)}</small>`;
    $("#logoutBtn").addEventListener("click", logout);
    const form = $("#resumeForm"),
      view = $("#resumeView");
    function paintResume() {
      const r = applicantResume(u);
      view.innerHTML = r
        ? `<div class="resume-summary"><h3>${esc(r.title)}</h3><div class="meta-line">${esc(r.city)} · Опыт: ${Number(r.experience) || 0} лет · ${r.active ? "Открыто для работодателей" : "Скрыто"}</div><p style="margin:13px 0">${esc(r.about || "Описание не добавлено")}</p><div>${(r.skills || []).map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div></div>`
        : '<div class="empty-state">Резюме пока не создано. Заполните форму, чтобы отправлять отклики.</div>';
    }
    function openForm() {
      const r = applicantResume(u);
      form.hidden = false;
      view.hidden = true;
      form.elements.title.value = r?.title || "";
      form.elements.city.value = r?.city || "";
      form.elements.experience.value = r?.experience ?? 0;
      form.elements.skills.value = (r?.skills || []).join(", ");
      form.elements.about.value = r?.about || "";
    }
    $("#editResumeBtn").addEventListener("click", openForm);
    $("#cancelResumeBtn").addEventListener("click", () => {
      form.hidden = true;
      view.hidden = false;
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form),
        r = applicantResume(u),
        data = {
          id: r?.id || Date.now(),
          applicant_id: u.id,
          title: String(d.get("title")).trim(),
          city: String(d.get("city")).trim(),
          experience: Number(d.get("experience")) || 0,
          skills: String(d.get("skills"))
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          about: String(d.get("about")).trim(),
          active: true,
        };
      if (r) Object.assign(r, data);
      else db.resumes.push(data);
      save();
      form.hidden = true;
      view.hidden = false;
      paintResume();
      toast("Резюме сохранено");
    });
    function paintApplications() {
      const arr = db.applications
        .filter((a) => a.applicant_id === u.id)
        .sort((a, b) => b.id - a.id);
      $("#applicantApplications").innerHTML =
        arr
          .map((a) => {
            const v = db.vacancies.find((x) => x.id === a.vacancy_id);
            return `<article class="application-row"><div class="row-main"><h3>${esc(v?.title || "Вакансия удалена")}</h3><div class="meta-line">${esc(v?.city || "")} · Отклик от ${date(a.created_at)}</div></div><span class="status ${["Принят", "Предложение"].includes(a.stage) ? "green" : ""}">${esc(a.stage)}</span></article>`;
          })
          .join("") ||
        '<div class="empty-state">Вы ещё не отправляли отклики.</div>';
    }
    paintResume();
    paintApplications();
    const suggestions = db.vacancies
      .filter((v) => v.status === "active")
      .slice(0, 3);
    $("#applicantSuggestions").innerHTML =
      suggestions.map((v) => vacancyCard(v)).join("") ||
      '<div class="empty-state">Активных вакансий пока нет</div>';
    bindVacancyActions($("#applicantSuggestions"));
  }
  function initEmployer() {
    const u = requireRole("recruiter");
    if (!u) return;
    const company = companyFor(u);
    $("#employerIdentity").innerHTML =
      `${esc(u.fullName)}<small>${esc(company?.name || "Работодатель")} · ${esc(u.email)}</small>`;
    $("#logoutBtn").addEventListener("click", logout);
    const form = $("#vacancyForm");
    function paintVacancies() {
      const own = db.vacancies
        .filter((v) => v.company_id === company?.id)
        .sort((a, b) => b.id - a.id);
      $("#employerVacancies").innerHTML =
        own
          .map(
            (v) =>
              `<article class="job-row"><div class="row-main"><h3>${esc(v.title)}</h3><div class="meta-line">${esc(v.city)} · ${date(v.created_at)} · ${db.applications.filter((a) => a.vacancy_id === v.id).length} откликов</div><span class="status ${v.status === "active" ? "green" : ""}">${v.status === "active" ? "Активна" : "На паузе"}</span></div><div class="row-actions"><button class="btn btn-soft" data-edit-vac="${v.id}">Изменить</button><button class="btn btn-soft" data-toggle-vac="${v.id}">${v.status === "active" ? "Пауза" : "Опубликовать"}</button></div></article>`,
          )
          .join("") ||
        '<div class="empty-state">Вы ещё не добавили вакансии. Нажмите «Добавить вакансию».</div>';
      $$("[data-edit-vac]", $("#employerVacancies")).forEach((b) =>
        b.addEventListener("click", () => {
          const v = db.vacancies.find(
            (x) => x.id === Number(b.dataset.editVac),
          );
          form.hidden = false;
          form.elements.id.value = v.id;
          [
            "title",
            "department",
            "city",
            "salary",
            "employment",
            "experience",
            "description",
          ].forEach((k) => (form.elements[k].value = v[k] ?? ""));
          form.elements.skills.value = (v.skills || []).join(", ");
          form.scrollIntoView({ behavior: "smooth" });
        }),
      );
      $$("[data-toggle-vac]", $("#employerVacancies")).forEach((b) =>
        b.addEventListener("click", () => {
          const v = db.vacancies.find(
            (x) => x.id === Number(b.dataset.toggleVac),
          );
          v.status = v.status === "active" ? "paused" : "active";
          save();
          paintVacancies();
          paintEmployerApplications();
          toast("Статус вакансии обновлён");
        }),
      );
      const sel = $("#applicationVacancy");
      if (sel) {
        const old = sel.value;
        sel.innerHTML =
          '<option value="">Все вакансии</option>' +
          own
            .map((v) => `<option value="${v.id}">${esc(v.title)}</option>`)
            .join("");
        sel.value = old;
      }
    }
    $("#newVacancyBtn").addEventListener("click", () => {
      form.reset();
      form.elements.id.value = "";
      form.hidden = false;
      form.scrollIntoView({ behavior: "smooth" });
    });
    $("#cancelVacancyBtn").addEventListener(
      "click",
      () => (form.hidden = true),
    );
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form),
        id = Number(d.get("id")),
        existing = db.vacancies.find((v) => v.id === id),
        data = {
          id: id || Date.now(),
          company_id: company?.id,
          title: String(d.get("title")).trim(),
          department: String(d.get("department")).trim(),
          city: String(d.get("city")).trim(),
          salary: String(d.get("salary")).trim(),
          employment: d.get("employment"),
          experience: Number(d.get("experience")) || 0,
          skills: String(d.get("skills"))
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          description: String(d.get("description")).trim(),
          status: existing?.status || "active",
          created_at:
            existing?.created_at || new Date().toISOString().slice(0, 10),
        };
      if (existing) Object.assign(existing, data);
      else db.vacancies.push(data);
      save();
      form.hidden = true;
      paintVacancies();
      paintEmployerApplications();
      toast("Вакансия сохранена");
    });
    function paintEmployerApplications() {
      const ownIds = db.vacancies
          .filter((v) => v.company_id === company?.id)
          .map((v) => v.id),
        q = ($("#applicationQuery").value || "").toLowerCase(),
        stage = $("#applicationStage").value,
        vac = $("#applicationVacancy").value;
      const arr = db.applications
        .filter((a) => ownIds.includes(a.vacancy_id))
        .filter((a) => {
          const person = userById(a.applicant_id),
            r = applicantResume(person),
            v = db.vacancies.find((x) => x.id === a.vacancy_id),
            hay = [
              person?.fullName,
              r?.title,
              r?.city,
              ...(r?.skills || []),
              v?.title,
            ]
              .join(" ")
              .toLowerCase();
          return (
            (!q || hay.includes(q)) &&
            (!stage || a.stage === stage) &&
            (!vac || String(a.vacancy_id) === vac)
          );
        })
        .sort((a, b) => b.id - a.id);
      $("#employerApplications").innerHTML =
        arr
          .map((a) => {
            const person = userById(a.applicant_id),
              r = applicantResume(person),
              v = db.vacancies.find((x) => x.id === a.vacancy_id);
            return `<article class="application-row"><div class="row-main"><h3>${esc(person?.fullName || "Соискатель")}</h3><div class="meta-line">${esc(r?.title || "Резюме не заполнено")} · ${esc(r?.city || "")} · ${esc(v?.title || "")}</div><p>${esc((r?.skills || []).join(", "))}</p><small>${esc(person?.email || "")} · ${date(a.created_at)}</small></div><div class="row-side"><span class="status">${esc(a.stage)}</span><div class="row-actions"><select data-stage="${a.id}" aria-label="Этап отклика"><option ${a.stage === "Новый" ? "selected" : ""}>Новый</option><option ${a.stage === "Первичный отбор" ? "selected" : ""}>Первичный отбор</option><option ${a.stage === "Интервью" ? "selected" : ""}>Интервью</option><option ${a.stage === "Тестовое задание" ? "selected" : ""}>Тестовое задание</option><option ${a.stage === "Предложение" ? "selected" : ""}>Предложение</option><option ${a.stage === "Отказ" ? "selected" : ""}>Отказ</option><option ${a.stage === "Принят" ? "selected" : ""}>Принят</option></select></div></div></article>`;
          })
          .join("") ||
        '<div class="empty-state">Откликов по выбранным фильтрам пока нет.</div>';
      $$("[data-stage]", $("#employerApplications")).forEach((s) =>
        s.addEventListener("change", () => {
          const a = db.applications.find(
            (x) => x.id === Number(s.dataset.stage),
          );
          a.stage = s.value;
          save();
          paintEmployerApplications();
          toast("Этап отклика изменён");
        }),
      );
    }
    function paintResumeBase() {
      const q = $("#resumeQuery").value.toLowerCase(),
        city = $("#resumeCity").value.toLowerCase(),
        exp = $("#resumeExperience").value;
      const arr = db.resumes
        .filter((r) => r.active !== false)
        .filter((r) => {
          const person = userById(r.applicant_id),
            hay = [r.title, r.about, ...r.skills, person?.fullName]
              .join(" ")
              .toLowerCase();
          return (
            (!q || hay.includes(q)) &&
            (!city || r.city.toLowerCase().includes(city)) &&
            (!exp || r.experience >= Number(exp))
          );
        });
      $("#resumeBaseList").innerHTML =
        arr
          .map((r) => {
            const p = userById(r.applicant_id);
            return `<article class="resume-row"><div class="row-main"><h3>${esc(r.title)}</h3><div class="meta-line">${esc(p?.fullName || "Соискатель")} · ${esc(r.city)} · Опыт ${r.experience} лет</div><p>${esc(r.about)}</p><div>${r.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}</div></div><a class="btn btn-soft" href="mailto:${encodeURIComponent(p?.email || "")}">Связаться</a></article>`;
          })
          .join("") ||
        '<div class="empty-state">Резюме не найдены. Попробуйте изменить фильтры.</div>';
    }
    ["#applicationQuery", "#applicationStage", "#applicationVacancy"].forEach(
      (s) => $(s).addEventListener("input", paintEmployerApplications),
    );
    ["#resumeQuery", "#resumeCity", "#resumeExperience"].forEach((s) =>
      $(s).addEventListener("input", paintResumeBase),
    );
    paintVacancies();
    paintEmployerApplications();
    paintResumeBase();
  }
  document.addEventListener("DOMContentLoaded", () => {
    updateHeader();
    renderHome();
    initAuth();
    initVacancies();
    if ($("#applicantIdentity")) initApplicant();
    if ($("#employerIdentity")) initEmployer();
  });
})();
