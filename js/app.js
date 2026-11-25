(function () {
  "use strict";

  // ===== CONFIG =====
  var WAIT_SECONDS = 45;
  var MAX_PER_DAY = 12;
  var STORAGE_QUOTA = "alg_quota_v1";
  var STORAGE_KEYS = "alg_issued_v1";

  var SCRIPTS = [
    {
      id: "roblox-hub",
      name: "Roblox Hub",
      meta: "Roblox · key 24j · 12x / hari",
      icon: "assets/icon-roblox.svg",
      prefix: "ALG-RBX"
    },
    {
      id: "roblox-aim",
      name: "Roblox Aim Assist",
      meta: "Roblox · key 24j · 12x / hari",
      icon: "assets/icon-roblox.svg",
      prefix: "ALG-AIM"
    },
    {
      id: "roblox-esp",
      name: "Roblox ESP",
      meta: "Roblox · key 24j · 12x / hari",
      icon: "assets/icon-roblox.svg",
      prefix: "ALG-ESP"
    },
    {
      id: "universal",
      name: "Universal Script",
      meta: "Multi · key 24j · 12x / hari",
      icon: "assets/icon-uni.svg",
      prefix: "ALG-UNI"
    }
  ];

  var TRACKS = [
    { title: "Night Drive", src: "music/01-night-drive.mp3" },
    { title: "Orange Circuit", src: "music/02-orange-circuit.mp3" },
    { title: "Blackout Beat", src: "music/03-blackout-beat.mp3" },
    { title: "Key Runner", src: "music/04-key-runner.mp3" },
    { title: "Loot Drop", src: "music/05-loot-drop.mp3" },
    { title: "Fridge Hum", src: "music/06-fridge-hum.mp3" },
    { title: "Solder Flow", src: "music/07-solder-flow.mp3" },
    { title: "Rail Heat", src: "music/08-rail-heat.mp3" },
    { title: "Spud Bounce", src: "music/09-spud-bounce.mp3" },
    { title: "Three Eyes", src: "music/10-three-eyes.mp3" },
    { title: "Crisper Class", src: "music/11-crisper-class.mp3" },
    { title: "Bench Light", src: "music/12-bench-light.mp3" },
    { title: "Iron Hot", src: "music/13-iron-hot.mp3" },
    { title: "Ticket Queue", src: "music/14-ticket-queue.mp3" },
    { title: "Absolute", src: "music/15-absolute.mp3" },
    { title: "No Cap Wave", src: "music/16-no-cap-wave.mp3" },
    { title: "6767", src: "music/17-6767.mp3" },
    { title: "Oil Up", src: "music/18-oil-up.mp3" },
    { title: "Mash Hour", src: "music/19-mash-hour.mp3" },
    { title: "Peeler Loop", src: "music/20-peeler-loop.mp3" },
    { title: "Sizzle Track", src: "music/21-sizzle-track.mp3" },
    { title: "Dark Orange", src: "music/22-dark-orange.mp3" },
    { title: "Claim Window", src: "music/23-claim-window.mp3" },
    { title: "Device Lock", src: "music/24-device-lock.mp3" },
    { title: "Two Hour Glow", src: "music/25-two-hour-glow.mp3" },
    { title: "Copy That", src: "music/26-copy-that.mp3" },
    { title: "Next Slot", src: "music/27-next-slot.mp3" },
    { title: "Prev Lane", src: "music/28-prev-lane.mp3" },
    { title: "Dock Side", src: "music/29-dock-side.mp3" },
    { title: "Mute Switch", src: "music/30-mute-switch.mp3" },
    { title: "Last Rail", src: "music/31-last-rail.mp3" },
    { title: "Close Ticket", src: "music/32-close-ticket.mp3" }
  ];

  var currentScript = null;
  var timerId = null;
  var remaining = 0;
  var trackIndex = 0;
  var musicOn = false;

  var el = {
    boot: document.getElementById("boot"),
    bootBar: document.getElementById("bootBar"),
    bootPct: document.getElementById("bootPct"),
    select: document.getElementById("select"),
    scriptGrid: document.getElementById("scriptGrid"),
    claim: document.getElementById("claim"),
    btnBack: document.getElementById("btnBack"),
    scriptIcon: document.getElementById("scriptIcon"),
    scriptName: document.getElementById("scriptName"),
    scriptMeta: document.getElementById("scriptMeta"),
    quotaLeft: document.getElementById("quotaLeft"),
    btnStart: document.getElementById("btnStart"),
    timerDisplay: document.getElementById("timerDisplay"),
    keyValue: document.getElementById("keyValue"),
    btnCopy: document.getElementById("btnCopy"),
    keyNote: document.getElementById("keyNote"),
    btnMusic: document.getElementById("btnMusic"),
    btnPrev: document.getElementById("btnPrev"),
    btnNext: document.getElementById("btnNext"),
    trackName: document.getElementById("trackName"),
    trackIndex: document.getElementById("trackIndex"),
    audio: document.getElementById("audio")
  };

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function loadQuota() {
    try {
      var raw = localStorage.getItem(STORAGE_QUOTA);
      if (!raw) return { day: todayKey(), used: 0 };
      var o = JSON.parse(raw);
      if (o.day !== todayKey()) return { day: todayKey(), used: 0 };
      return { day: o.day, used: Number(o.used) || 0 };
    } catch (e) {
      return { day: todayKey(), used: 0 };
    }
  }

  function saveQuota(q) {
    localStorage.setItem(STORAGE_QUOTA, JSON.stringify(q));
  }

  function remainingClaims() {
    return Math.max(0, MAX_PER_DAY - loadQuota().used);
  }

  function consumeClaim() {
    var q = loadQuota();
    q.used = (q.used || 0) + 1;
    q.day = todayKey();
    saveQuota(q);
    return q.used;
  }

  function updateQuotaUI() {
    var left = remainingClaims();
    el.quotaLeft.textContent = left + " / " + MAX_PER_DAY;
    if (left <= 0) {
      el.btnStart.disabled = true;
      el.btnStart.textContent = "KUOTA HABIS";
      el.keyNote.textContent = "Kuota 12x hari ini sudah habis. Reset otomatis besok.";
    }
  }

  function fnv1a(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function toBase36(n, len) {
    var s = (n >>> 0).toString(36).toUpperCase();
    while (s.length < len) s = "0" + s;
    return s.slice(-len);
  }

  function issueKey(scriptId, slotIndex) {
    var day = todayKey();
    var seed = scriptId + "|" + day + "|" + slotIndex + "|ALG-REAL-v1";
    var a = fnv1a(seed);
    var b = fnv1a(seed + "|B");
    var c = fnv1a(seed + "|C");
    var script = SCRIPTS.find(function (s) { return s.id === scriptId; });
    var prefix = script ? script.prefix : "ALG-KEY";
    return prefix + "-" + toBase36(a, 5) + "-" + toBase36(b, 5) + "-" + toBase36(c, 4);
  }

  function recordIssued(scriptId, key) {
    try {
      var raw = localStorage.getItem(STORAGE_KEYS);
      var list = raw ? JSON.parse(raw) : [];
      list.push({ scriptId: scriptId, key: key, at: Date.now(), day: todayKey() });
      if (list.length > 50) list = list.slice(-50);
      localStorage.setItem(STORAGE_KEYS, JSON.stringify(list));
    } catch (e) {}
  }

  function show(name) {
    el.boot.classList.toggle("hidden", name !== "boot");
    el.select.classList.toggle("hidden", name !== "select");
    el.claim.classList.toggle("hidden", name !== "claim");
  }

  function bootSequence() {
    show("boot");
    var p = 0;
    var id = setInterval(function () {
      p += 2 + Math.floor(Math.random() * 4);
      if (p >= 100) {
        p = 100;
        clearInterval(id);
        el.bootBar.style.width = "100%";
        el.bootPct.textContent = "100%";
        setTimeout(function () {
          buildScriptGrid();
          show("select");
        }, 350);
        return;
      }
      el.bootBar.style.width = p + "%";
      el.bootPct.textContent = p + "%";
    }, 40);
  }

  function buildScriptGrid() {
    el.scriptGrid.innerHTML = "";
    SCRIPTS.forEach(function (s) {
      var card = document.createElement("button");
      card.type = "button";
      card.className = "script-card";
      card.innerHTML =
        "<img src=\"" + s.icon + "\" alt=\"\" />" +
        "<h3>" + s.name + "</h3>" +
        "<p>" + s.meta + "</p>" +
        "<span class=\"tag\">CLAIM</span>";
      card.addEventListener("click", function () {
        openClaim(s);
      });
      el.scriptGrid.appendChild(card);
    });
  }

  function openClaim(script) {
    currentScript = script;
    el.scriptIcon.src = script.icon;
    el.scriptName.textContent = script.name;
    el.scriptMeta.textContent = script.meta;
    el.keyValue.textContent = "—";
    el.btnCopy.disabled = true;
    el.btnStart.disabled = false;
    el.btnStart.textContent = "MULAI";
    el.timerDisplay.textContent = "00:00";
    el.timerDisplay.classList.remove("run", "done");
    el.keyNote.textContent = "Klik MULAI, tunggu timer selesai. Key real, no fake.";
    updateQuotaUI();
    show("claim");
  }

  function formatTime(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function startTimer() {
    if (!currentScript) return;
    if (remainingClaims() <= 0) {
      updateQuotaUI();
      return;
    }
    if (timerId) return;
    el.btnStart.disabled = true;
    el.btnStart.textContent = "MENUNGGU...";
    remaining = WAIT_SECONDS;
    el.timerDisplay.textContent = formatTime(remaining);
    el.timerDisplay.classList.add("run");
    el.timerDisplay.classList.remove("done");
    el.keyValue.textContent = "—";
    el.btnCopy.disabled = true;
    timerId = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        finishClaim();
        return;
      }
      el.timerDisplay.textContent = formatTime(remaining);
    }, 1000);
  }

  function finishClaim() {
    var slot = consumeClaim() - 1;
    var key = issueKey(currentScript.id, slot);
    recordIssued(currentScript.id, key);
    el.timerDisplay.textContent = "00:00";
    el.timerDisplay.classList.remove("run");
    el.timerDisplay.classList.add("done");
    el.keyValue.textContent = key;
    el.btnCopy.disabled = false;
    el.btnStart.disabled = remainingClaims() <= 0;
    el.btnStart.textContent = remainingClaims() <= 0 ? "KUOTA HABIS" : "MULAI LAGI";
    el.keyNote.textContent = "Key real · slot " + (slot + 1) + "/" + MAX_PER_DAY + " · reset besok.";
    updateQuotaUI();
  }

  function copyKey() {
    var text = el.keyValue.textContent || "";
    if (!text || text === "—") return;
    function ok() {
      el.btnCopy.textContent = "TERSALIN";
      el.btnCopy.classList.add("ok");
      setTimeout(function () {
        el.btnCopy.textContent = "SALIN";
        el.btnCopy.classList.remove("ok");
      }, 1400);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok).catch(fallback);
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      ok();
    }
  }

  function loadTrack(i, autoplay) {
    if (!TRACKS.length) return;
    trackIndex = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    var t = TRACKS[trackIndex];
    el.trackName.textContent = t.title;
    el.trackIndex.textContent = (trackIndex + 1) + " / " + TRACKS.length;
    el.audio.src = t.src;
    el.audio.load();
    if (autoplay && musicOn) {
      el.audio.play().catch(function () {});
    }
  }

  function setMusicOn(on) {
    musicOn = on;
    el.btnMusic.classList.toggle("on", on);
    var iconOn = el.btnMusic.querySelector(".icon-on");
    var iconOff = el.btnMusic.querySelector(".icon-off");
    if (iconOn && iconOff) {
      iconOn.classList.toggle("hidden", !on);
      iconOff.classList.toggle("hidden", on);
    }
    if (on) {
      el.audio.play().catch(function () {});
    } else {
      el.audio.pause();
    }
  }

  function nextTrack() {
    loadTrack(trackIndex + 1, true);
  }

  function prevTrack() {
    loadTrack(trackIndex - 1, true);
  }

  el.btnBack.addEventListener("click", function () {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    show("select");
  });
  el.btnStart.addEventListener("click", startTimer);
  el.btnCopy.addEventListener("click", copyKey);
  el.btnMusic.addEventListener("click", function () {
    setMusicOn(!musicOn);
  });
  el.btnNext.addEventListener("click", nextTrack);
  el.btnPrev.addEventListener("click", prevTrack);
  el.audio.addEventListener("ended", function () {
    nextTrack();
  });

  loadTrack(0, false);
  setMusicOn(false);
  bootSequence();
})();
