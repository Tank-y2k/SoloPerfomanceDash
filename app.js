    const STORAGE_KEY = "queuePerformanceDashboard.v2";
    const NON_PRODUCTIVE_NAME = "Non-productive";

    const defaultState = {
      queues: [
        { id: crypto.randomUUID(), name: NON_PRODUCTIVE_NAME, rate: 0, color: "#71717a", locked: true },
        { id: crypto.randomUUID(), name: "Startup", rate: 2.29, color: "#ba3aff" },
        { id: crypto.randomUUID(), name: "Established", rate: 2.29, color: "#2df24d" },
        { id: crypto.randomUUID(), name: "Resubmissions", rate: 2.63, color: "#fb2832" },
        { id: crypto.randomUUID(), name: "Sole Trader", rate: 2.71, color: "#d6fb0b" },
        { id: crypto.randomUUID(), name: "Sole Trader Resubmissions", rate: 2.75, color: "#f48a0f" }
      ],
      segments: [],
      completions: [],
      archive: [],
      activityLog: [],
      startingSnapshot: null,
      timerStartedAt: null,
      selectedSegmentId: null,
      timerSegmentId: null,
      timeBankSeconds: 0,
      claimedQuestIds: [],
      activeQuestIds: []
    };

    let state = loadState();
    ensureNonProductiveQueue();

    const els = {
      menuBtn: document.getElementById("menuBtn"),
      topMenuPanel: document.getElementById("topMenuPanel"),
      settingsBtn: document.getElementById("settingsBtn"),
      planBtn: document.getElementById("planBtn"),
      archiveBtn: document.getElementById("archiveBtn"),
      snapshotBtn: document.getElementById("snapshotBtn"),
      endDayBtn: document.getElementById("endDayBtn"),
      exportCsvBtn: document.getElementById("exportCsvBtn"),
      resetBtn: document.getElementById("resetBtn"),
      settingsDialog: document.getElementById("settingsDialog"),
      planDialog: document.getElementById("planDialog"),
      archiveDialog: document.getElementById("archiveDialog"),
      reviewDialog: document.getElementById("reviewDialog"),
      completionDialog: document.getElementById("completionDialog"),
      completedAppsBtn: document.getElementById("completedAppsBtn"),
      insightsBtn: document.getElementById("insightsBtn"),
      quickInsightsBtn: document.getElementById("quickInsightsBtn"),
      insightsDialog: document.getElementById("insightsDialog"),
      queueName: document.getElementById("queueName"),
      queueRate: document.getElementById("queueRate"),
      queueColor: document.getElementById("queueColor"),
      addQueueBtn: document.getElementById("addQueueBtn"),
      queueList: document.getElementById("queueList"),
      segmentQueue: document.getElementById("segmentQueue"),
      segmentStart: document.getElementById("segmentStart"),
      segmentEnd: document.getElementById("segmentEnd"),
      addSegmentBtn: document.getElementById("addSegmentBtn"),
      sortSegmentsBtn: document.getElementById("sortSegmentsBtn"),
      segmentList: document.getElementById("segmentList"),
      activeQueueName: document.getElementById("activeQueueName"),
      timerDisplay: document.getElementById("timerDisplay"),
      timerBankDisplay: document.getElementById("timerBankDisplay"),
      timerEfficiencyDisplay: document.getElementById("timerEfficiencyDisplay"),
      timerStatus: document.getElementById("timerStatus"),
      timerProgress: document.getElementById("timerProgress"),
      completionQueue: document.getElementById("completionQueue"),
      completionUid: document.getElementById("completionUid"),
      completionOutcome: document.getElementById("completionOutcome"),
      completeAppBtn: document.getElementById("completeAppBtn"),
      completedCount: document.getElementById("completedCount"),
      expectedCount: document.getElementById("expectedCount"),
      dayExpectedCount: document.getElementById("dayExpectedCount"),
      paceValue: document.getElementById("paceValue"),
      paceStat: document.getElementById("paceStat"),
      currentSegmentDetails: document.getElementById("currentSegmentDetails"),
      breakdownList: document.getElementById("breakdownList"),
      completionHistory: document.getElementById("completionHistory"),
      archiveHistory: document.getElementById("archiveHistory"),
      reviewContent: document.getElementById("reviewContent"),
      dayTimeline: document.getElementById("dayTimeline"),
      productiveHours: document.getElementById("productiveHours"),
      nonProductiveHours: document.getElementById("nonProductiveHours"),
      levelValue: document.getElementById("levelValue"),
      xpValue: document.getElementById("xpValue"),
      streakValue: document.getElementById("streakValue"),
      questList: document.getElementById("questList")
    };

    function loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return structuredClone(defaultState);
        const parsed = JSON.parse(raw);
        return { ...structuredClone(defaultState), ...parsed };
      } catch {
        return structuredClone(defaultState);
      }
    }

    function saveState() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function ensureNonProductiveQueue() {
      const existing = state.queues.find(queue => queue.name.toLowerCase() === NON_PRODUCTIVE_NAME.toLowerCase());
      if (existing) {
        existing.rate = 0;
        existing.locked = true;
        existing.color = existing.color || "#71717a";
        return;
      }

      state.queues.unshift({
        id: crypto.randomUUID(),
        name: NON_PRODUCTIVE_NAME,
        rate: 0,
        color: "#71717a",
        locked: true
      });
    }

    function logActivity(type, text) {
      state.activityLog.unshift({ id: crypto.randomUUID(), type, text, at: nowIso() });
      state.activityLog = state.activityLog.slice(0, 80);
      saveState();
    }

    function minutesFromTime(time) {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    }

    function nowDate() { return new Date(); }

    function nowIso() {
      return nowDate().toISOString();
    }

    function nowMinutes() {
      const now = nowDate();
      return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    }

    function formatDuration(seconds) {
      const sign = seconds < 0 ? "-" : "";
      const abs = Math.abs(Math.round(seconds));
      const mins = Math.floor(abs / 60).toString().padStart(2, "0");
      const secs = (abs % 60).toString().padStart(2, "0");
      return `${sign}${mins}:${secs}`;
    }


    function formatMinutes(seconds) {
      const sign = seconds < 0 ? "-" : "";
      const absMinutes = Math.round(Math.abs(seconds) / 60);
      const hours = Math.floor(absMinutes / 60);
      const minutes = absMinutes % 60;
      if (hours > 0) return `${sign}${hours}h ${minutes}m`;
      return `${sign}${minutes}m`;
    }

    function formatHoursMinutes(hoursValue) {
      const totalMinutes = Math.round(Math.max(0, hoursValue) * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }

    function getSecondsPerApp(queue) {
      return isProductiveQueue(queue) ? 3600 / Number(queue.rate) : 0;
    }

    function getCompletionEfficiency(completion) {
      const queue = getQueue(completion.queueId);
      const secondsPerApp = getSecondsPerApp(queue);
      if (!secondsPerApp || !completion.durationSeconds) return 0;
      return (secondsPerApp / completion.durationSeconds) * 100;
    }

    function getThroughputEfficiency(completed, expected) {
      if (expected <= 0) return 0;
      return (completed / expected) * 100;
    }

    function formatClock(iso) {
      return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function getQueue(id, queues = state.queues) {
      return queues.find(queue => queue.id === id);
    }

    function isProductiveQueue(queue) {
      return Number(queue?.rate || 0) > 0;
    }

    function getSegmentBounds(segment) {
      const start = minutesFromTime(segment.start);
      const end = minutesFromTime(segment.end);
      return { start, end };
    }

    function getCurrentSegment() {
      if (state.selectedSegmentId) {
        const selected = state.segments.find(segment => segment.id === state.selectedSegmentId);
        if (selected) return selected;
      }

      const current = nowMinutes();
      return state.segments.find(segment => {
        const { start, end } = getSegmentBounds(segment);
        return current >= start && current < end;
      }) || null;
    }

    function getSegmentAtDate(date, includeEnd = false) {
      const minutes = date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
      return state.segments.find(segment => {
        const { start, end } = getSegmentBounds(segment);
        return includeEnd ? minutes >= start && minutes <= end : minutes >= start && minutes < end;
      }) || null;
    }

    function getSegmentMinutes(segment) {
      const { start, end } = getSegmentBounds(segment);
      return Math.max(0, end - start);
    }

    function getRemainingSegmentSeconds(segment, atIso = nowIso()) {
      if (!segment) return null;
      const segmentEnd = new Date(atIso);
      const [endHours, endMinutes] = segment.end.split(":").map(Number);
      segmentEnd.setHours(endHours, endMinutes, 0, 0);
      return Math.max(0, (segmentEnd.getTime() - new Date(atIso).getTime()) / 1000);
    }

    function clampTimeBankToSegment(segment, atIso = nowIso()) {
      const remainingSegmentSeconds = getRemainingSegmentSeconds(segment, atIso);
      if (remainingSegmentSeconds === null) return;
      state.timeBankSeconds = Math.min(state.timeBankSeconds, remainingSegmentSeconds);
    }

    function getSegmentBoundaryIso(segment, timeText, atIso = nowIso()) {
      const boundary = new Date(atIso);
      const [hours, minutes] = timeText.split(":").map(Number);
      boundary.setHours(hours, minutes, 0, 0);
      return boundary.toISOString();
    }

    function syncTimerToSegment(segment, atIso = nowIso()) {
      if (!segment) return;
      const nowMs = new Date(atIso).getTime();
      const segmentStartIso = getSegmentBoundaryIso(segment, segment.start, atIso);
      const completionsInSegment = state.completions.filter(app => app.segmentId === segment.id);
      const latestCompletion = completionsInSegment.length
        ? completionsInSegment.reduce((latest, app) => new Date(app.at).getTime() > new Date(latest.at).getTime() ? app : latest)
        : null;

      if (state.timerSegmentId !== segment.id) {
        state.timerSegmentId = segment.id;
        state.timerStartedAt = latestCompletion?.at || segmentStartIso;
      }

      if (!state.timerStartedAt) state.timerStartedAt = latestCompletion?.at || segmentStartIso;

      const startedAtMs = new Date(state.timerStartedAt).getTime();
      if (startedAtMs > nowMs) state.timerStartedAt = atIso;
      if (startedAtMs < new Date(segmentStartIso).getTime() && !latestCompletion) state.timerStartedAt = segmentStartIso;
    }

    function getSegmentExpectedApps(segment, untilMinutes = null) {
      const queue = getQueue(segment.queueId);
      if (!queue) return 0;
      const { start, end } = getSegmentBounds(segment);
      const effectiveEnd = untilMinutes === null ? end : Math.min(Math.max(untilMinutes, start), end);
      const minutes = Math.max(0, effectiveEnd - start);
      return (minutes / 60) * Number(queue.rate || 0);
    }

    function getExpectedByNow() {
      const current = nowMinutes();
      return state.segments.reduce((sum, segment) => sum + getSegmentExpectedApps(segment, current), 0);
    }

    function getSegmentLabelForTime(iso) {
      const date = new Date(iso);
      const segment = getSegmentAtDate(date, true);
      if (!segment) return "Outside planned segments";
      const queue = getQueue(segment.queueId);
      return `${queue?.name || "Missing queue"} (${segment.start}-${segment.end})`;
    }

    function buildEtcProjection(appCount = 5) {
      const now = nowDate();
      const segment = getCurrentSegment();
      if (!segment) return [];

      syncTimerToSegment(segment, now.toISOString());
      const queue = getQueue(segment.queueId);
      if (!isProductiveQueue(queue)) return [];

      const secondsPerApp = getSecondsPerApp(queue);
      const elapsed = Math.max(0, (now.getTime() - new Date(state.timerStartedAt).getTime()) / 1000);
      const firstRemaining = Math.max(0, Math.max(1, secondsPerApp + state.timeBankSeconds) - elapsed);
      const projections = [];
      let cursorMs = now.getTime() + firstRemaining * 1000;
      projections.push({ index: 1, etaIso: new Date(cursorMs).toISOString() });

      for (let i = 2; i <= appCount; i += 1) {
        let cursorSegment = getSegmentAtDate(new Date(cursorMs), true);
        if (!cursorSegment) break;

        if (!isProductiveQueue(getQueue(cursorSegment.queueId))) {
          const resumeAt = new Date(cursorMs);
          const [endHour, endMinute] = cursorSegment.end.split(":").map(Number);
          resumeAt.setHours(endHour, endMinute, 0, 0);
          cursorMs = resumeAt.getTime();
          cursorSegment = getSegmentAtDate(new Date(cursorMs), true);
        }

        if (!cursorSegment) break;
        const cursorQueue = getQueue(cursorSegment.queueId);
        if (!isProductiveQueue(cursorQueue)) break;

        cursorMs += getSecondsPerApp(cursorQueue) * 1000;
        projections.push({ index: i, etaIso: new Date(cursorMs).toISOString() });
      }

      return projections;
    }

    function getExpectedFullDay(segments = state.segments, queues = state.queues) {
      return segments.reduce((sum, segment) => {
        const queue = getQueue(segment.queueId, queues);
        if (!queue) return sum;
        return sum + (getSegmentMinutes(segment) / 60) * Number(queue.rate || 0);
      }, 0);
    }

    function getPlannedHours(productiveOnly) {
      const minutes = state.segments.reduce((sum, segment) => {
        const queue = getQueue(segment.queueId);
        const productive = isProductiveQueue(queue);
        if (productiveOnly === productive) return sum + getSegmentMinutes(segment);
        return sum;
      }, 0);
      return minutes / 60;
    }

    const QUEST_LIBRARY = [
      { id: "apps-5", label: "Complete 5 apps", rewardXp: 30, progress: () => getProductiveCompletions(), target: 5 },
      { id: "apps-10", label: "Complete 10 apps", rewardXp: 45, progress: () => getProductiveCompletions(), target: 10 },
      { id: "apps-15", label: "Complete 15 apps", rewardXp: 65, progress: () => getProductiveCompletions(), target: 15 },
      { id: "streak-3", label: "Hit a fast streak of 3", rewardXp: 20, progress: () => getXpAndStreak().bestStreak, target: 3 },
      { id: "streak-5", label: "Hit a fast streak of 5", rewardXp: 40, progress: () => getXpAndStreak().bestStreak, target: 5 },
      { id: "pace", label: "Finish at or above pace", rewardXp: 25, progress: () => getPaceByNow() >= 0 ? 1 : 0, target: 1 },
      { id: "minutes-90", label: "Log 90 productive minutes", rewardXp: 25, progress: () => getProductiveMinutes(), target: 90 },
      { id: "minutes-180", label: "Log 3 productive hours", rewardXp: 50, progress: () => getProductiveMinutes(), target: 180 },
      { id: "queues-3", label: "Complete apps in 3 queues", rewardXp: 30, progress: () => getDistinctProductiveQueuesCompleted(), target: 3 },
      { id: "eff95-60", label: "Maintain 60 mins at ≥95% efficiency", rewardXp: 35, progress: () => getMinutesAtOrAboveEfficiency(95), target: 60 },
      { id: "eff95-120", label: "Maintain 2 hours at ≥95% efficiency", rewardXp: 60, progress: () => getMinutesAtOrAboveEfficiency(95), target: 120 },
      { id: "day-eff-100", label: "Hold 100%+ in-day efficiency", rewardXp: 45, progress: () => (getInDayEfficiency() || 0) >= 100 ? 1 : 0, target: 1 }
    ];

    function getProductiveCompletions() {
      return state.completions.filter(app => isProductiveQueue(getQueue(app.queueId))).length;
    }

    function getDistinctProductiveQueuesCompleted() {
      return new Set(state.completions
        .filter(app => isProductiveQueue(getQueue(app.queueId)))
        .map(app => app.queueId)).size;
    }

    function getProductiveMinutes() {
      return Math.round(state.completions.reduce((sum, app) => {
        const queue = getQueue(app.queueId);
        if (!isProductiveQueue(queue)) return sum;
        return sum + (app.durationSeconds || 0) / 60;
      }, 0));
    }

    function getPaceByNow() {
      return state.completions.length - getExpectedByNow();
    }

    function getInDayEfficiency() {
      const productiveCompletions = state.completions.filter(app => isProductiveQueue(getQueue(app.queueId)));
      let actualSeconds = productiveCompletions.reduce((sum, app) => sum + Math.max(0, app.durationSeconds || 0), 0);
      let expectedSeconds = productiveCompletions.reduce((sum, app) => {
        const queue = getQueue(app.queueId);
        return sum + getSecondsPerApp(queue);
      }, 0);

      const segment = getCurrentSegment();
      const queue = segment ? getQueue(segment.queueId) : null;
      if (segment && isProductiveQueue(queue) && state.timerStartedAt) {
        const elapsed = Math.max(0, (nowDate().getTime() - new Date(state.timerStartedAt).getTime()) / 1000);
        if (elapsed > 0) {
          actualSeconds += elapsed;
          expectedSeconds += getSecondsPerApp(queue);
        }
      }

      if (expectedSeconds <= 0 || actualSeconds <= 0) return null;
      return (expectedSeconds / actualSeconds) * 100;
    }

    function getMinutesAtOrAboveEfficiency(targetPercent = 95) {
      const productiveCompletions = state.completions.filter(app => isProductiveQueue(getQueue(app.queueId)));
      const seconds = productiveCompletions.reduce((sum, app) => {
        const efficiency = getCompletionEfficiency(app);
        return efficiency >= targetPercent ? sum + Math.max(0, app.durationSeconds || 0) : sum;
      }, 0);
      return Math.round(seconds / 60);
    }

    function ensureActiveQuests() {
      if (!Array.isArray(state.claimedQuestIds)) state.claimedQuestIds = [];
      if (!Array.isArray(state.activeQuestIds)) state.activeQuestIds = [];
      const availableIds = QUEST_LIBRARY
        .map(quest => quest.id)
        .filter(id => !state.claimedQuestIds.includes(id));
      state.activeQuestIds = state.activeQuestIds.filter(id => availableIds.includes(id));
      while (state.activeQuestIds.length < 4 && availableIds.length > state.activeQuestIds.length) {
        const candidates = availableIds.filter(id => !state.activeQuestIds.includes(id));
        const choice = candidates[Math.floor(Math.random() * candidates.length)];
        if (!choice) break;
        state.activeQuestIds.push(choice);
      }
    }

    function getActiveQuests() {
      ensureActiveQuests();
      return state.activeQuestIds.map(id => QUEST_LIBRARY.find(quest => quest.id === id)).filter(Boolean);
    }
    function getXpAndStreak() {
      let xp = 0;
      let streak = 0;
      let bestStreak = 0;
      for (const completion of state.completions) {
        const queue = getQueue(completion.queueId);
        const expected = getSecondsPerApp(queue);
        if (!expected) continue;
        xp += 10;
        const efficiency = getCompletionEfficiency(completion);
        if (efficiency >= 100) {
          xp += 8;
          streak += 1;
          bestStreak = Math.max(bestStreak, streak);
        } else {
          streak = 0;
        }
      }
      const questXp = state.claimedQuestIds.reduce((sum, questId) => {
        const quest = QUEST_LIBRARY.find(item => item.id === questId);
        return sum + (quest?.rewardXp || 0);
      }, 0);
      xp += questXp;
      return { xp, streak, bestStreak };
    }

    function collectQuest(questId) {
      const quest = QUEST_LIBRARY.find(item => item.id === questId);
      if (!quest) return;
      if (state.claimedQuestIds.includes(quest.id)) return;
      if (quest.progress() < quest.target) return;
      state.claimedQuestIds.push(quest.id);
      state.activeQuestIds = state.activeQuestIds.filter(id => id !== quest.id);
      ensureActiveQuests();
      saveState();
      logActivity("quest", `Collected quest reward for "${quest.label}" (+${quest.rewardXp} XP).`);
      renderAll();
    }

    function renderGamification() {
      const { xp, streak, bestStreak } = getXpAndStreak();
      const level = Math.floor(xp / 100) + 1;
      const quests = getActiveQuests();

      els.levelValue.textContent = String(level);
      els.xpValue.textContent = `${xp} XP`;
      els.streakValue.textContent = String(streak);
      els.questList.innerHTML = quests.map(quest => {
        const current = quest.progress();
        const done = current >= quest.target;
        return `<div class="quest-item ${done ? "done" : ""}">
          <div><strong>${quest.label}</strong><div class="subtle">${Math.min(current, quest.target)}/${quest.target}</div></div>
          ${done
            ? `<button class="btn small success" data-collect-quest="${quest.id}">Collect +${quest.rewardXp} XP</button>`
            : `<span class="pill warn">In progress · +${quest.rewardXp} XP</span>`}
        </div>`;
      }).join("");
    }

    function resetCurrentTimer() {
      state.timerStartedAt = nowIso();
      saveState();
    }

    function renderQueueOptions() {
      const options = state.queues
        .map(queue => `<option value="${queue.id}">${escapeHtml(queue.name)} - ${queue.rate} apps/hr</option>`)
        .join("");
      els.segmentQueue.innerHTML = options;

      const currentSegment = getCurrentSegment();
      els.completionQueue.innerHTML = state.queues
        .filter(queue => isProductiveQueue(queue))
        .map(queue => `<option value="${queue.id}">${escapeHtml(queue.name)}</option>`)
        .join("");

      if (currentSegment) {
        const currentQueue = getQueue(currentSegment.queueId);
        if (isProductiveQueue(currentQueue)) els.completionQueue.value = currentSegment.queueId;
      }
    }

    function renderQueues() {
      els.queueList.innerHTML = state.queues.map(queue => `
        <article class="queue-card" style="--queue-color: ${queue.color || "#14b8a6"}">
          <div class="queue-card-title">
            <span class="row" style="gap: 8px;"><span class="swatch" style="--queue-color: ${queue.color || "#14b8a6"}"></span>${escapeHtml(queue.name)}</span>
            <span class="pill">${queue.rate} apps/hr</span>
          </div>
          <div class="queue-meta">${queue.rate > 0 ? `One app every ${Math.round(60 / queue.rate)} minutes.` : "No productivity target. Breaks, lunch, meetings, and other sanctioned voids."}</div>
          <div class="row mt-10">
            <button class="btn small" data-edit-queue="${queue.id}">Edit</button>
            ${queue.locked ? "" : `<button class="btn small danger" data-delete-queue="${queue.id}">Delete</button>`}
          </div>
        </article>
      `).join("");
    }

    function renderSegments() {
      const currentSegment = getCurrentSegment();

      els.segmentList.innerHTML = state.segments.map(segment => {
        const queue = getQueue(segment.queueId);
        const expected = getSegmentExpectedApps(segment);
        const isActive = currentSegment && currentSegment.id === segment.id;
        return `
          <article class="segment-card ${isActive ? "active" : ""}" style="--queue-color: ${queue?.color || "#14b8a6"}">
            <div class="segment-title">
              <span>${escapeHtml(queue?.name || "Missing queue")}</span>
              <span class="pill ${isActive ? "good" : ""}">${isActive ? "Active" : `${expected.toFixed(1)} apps`}</span>
            </div>
            <div class="segment-meta">${segment.start} to ${segment.end} · ${queue?.rate ?? 0} apps/hr</div>
            <div class="row mt-10">
              <button class="btn small" data-select-segment="${segment.id}">Use Now</button>
              <button class="btn small" data-edit-segment="${segment.id}">Edit</button>
              <button class="btn small danger" data-delete-segment="${segment.id}">Delete</button>
            </div>
          </article>
        `;
      }).join("");
    }

    function renderCompletionHistory() {
      els.completionHistory.innerHTML = state.completions.length
        ? state.completions.slice().reverse().map(app => {
          const queue = getQueue(app.queueId);
          return `
            <article class="log-card">
              <div><strong>${escapeHtml(app.uid || "(no uid)")}</strong> · ${escapeHtml(queue?.name || "Missing queue")}</div>
              <div class="log-meta">Outcome: ${escapeHtml(app.outcome || "Unspecified")}</div>
              <div class="log-meta log-meta-inline">
                <span>${formatDuration(app.durationSeconds)}</span><span>·</span><span>${getCompletionEfficiency(app).toFixed(0)}%</span><span>·</span><span>${formatClock(app.at)}</span>
              </div>
              <div class="row row-end"><button class="btn small danger" data-delete-completion="${app.id}">Delete</button></div>
            </article>
          `;
        }).join("")
        : `<p class="subtle">No completed apps yet.</p>`;
    }

    function renderArchiveHistory() {
      els.archiveHistory.innerHTML = state.archive?.length
        ? state.archive.slice().reverse().map(day => `
          <article class="log-card">
            <div><strong>${escapeHtml(new Date(day.archivedAt).toLocaleDateString())}</strong> · ${escapeHtml(day.label)}</div>
            <div class="log-meta log-meta-inline">
              <span>${day.completions.length} completed</span><span>·</span>
              <span>${day.segments.length} segments</span><span>·</span>
              <span>${day.queues.length} queues</span>
            </div>
          </article>
        `).join("")
        : `<p class="subtle">No archived days yet.</p>`;
    }

    function renderStats() {
      const completed = state.completions.length;
      const expectedByNow = getExpectedByNow();
      const expectedFullDay = getExpectedFullDay();
      const pace = completed - expectedByNow;
      const currentSegment = getCurrentSegment();
      const currentQueue = currentSegment ? getQueue(currentSegment.queueId) : null;
      const bankInApps = isProductiveQueue(currentQueue)
        ? state.timeBankSeconds / Math.max(1, getSecondsPerApp(currentQueue))
        : 0;
      const netPace = pace + bankInApps;
      els.completedCount.textContent = completed;
      els.expectedCount.textContent = expectedByNow.toFixed(1);
      els.dayExpectedCount.textContent = expectedFullDay.toFixed(1);
      els.paceValue.textContent = `${netPace >= 0 ? "+" : ""}${netPace.toFixed(1)} (${pace >= 0 ? "+" : ""}${pace.toFixed(1)} raw) · bank ${formatMinutes(state.timeBankSeconds)}`;
      els.productiveHours.textContent = formatHoursMinutes(getPlannedHours(true));
      els.nonProductiveHours.textContent = formatHoursMinutes(getPlannedHours(false));

      els.paceStat.classList.remove("good", "bad", "warn");
      els.paceStat.classList.add(netPace >= 0 ? "good" : netPace <= -1 ? "bad" : "warn");
    }

    function renderDayTimeline() {
      if (!state.segments.length) {
        els.dayTimeline.innerHTML = `<div class="timeline-block" style="width: 100%; background: transparent;"></div>`;
        return;
      }

      const first = Math.min(...state.segments.map(segment => minutesFromTime(segment.start)));
      const last = Math.max(...state.segments.map(segment => minutesFromTime(segment.end)));
      const total = Math.max(1, last - first);

      els.dayTimeline.innerHTML = state.segments.map(segment => {
        const queue = getQueue(segment.queueId);
        const width = (getSegmentMinutes(segment) / total) * 100;
        const title = `${queue?.name || "Missing queue"}: ${segment.start}-${segment.end}`;
        return `<div class="timeline-block" title="${escapeHtml(title)}" style="width: ${width}%; --queue-color: ${queue?.color || "#14b8a6"};"></div>`;
      }).join("");
    }

    function renderBreakdown() {
      const byQueue = state.queues.map(queue => {
        const queueSegments = state.segments.filter(segment => segment.queueId === queue.id);
        const expected = queueSegments.reduce((sum, segment) => sum + getSegmentExpectedApps(segment), 0);
        const plannedHours = queueSegments.reduce((sum, segment) => sum + getSegmentMinutes(segment), 0) / 60;
        const queueCompletions = state.completions.filter(app => app.queueId === queue.id);
        const completed = queueCompletions.length;
        const throughputEfficiency = getThroughputEfficiency(completed, expected);
        return { queue, expected, plannedHours, completed, throughputEfficiency, variance: completed - expected };
      }).filter(row => row.expected > 0 || row.completed > 0 || row.plannedHours > 0);

      els.breakdownList.innerHTML = byQueue.length
        ? byQueue.map(row => `
          <div class="mini-table-row">
            <strong class="row" style="gap: 8px;"><span class="swatch" style="--queue-color: ${row.queue.color || "#14b8a6"}"></span>${escapeHtml(row.queue.name)}</strong>
            <span class="subtle">${formatHoursMinutes(row.plannedHours)} · ${row.completed} done / ${row.expected.toFixed(1)} expected · throughput ${row.throughputEfficiency.toFixed(0)}%</span>
            <span class="pill ${row.variance >= 0 ? "good" : "bad"}">${row.variance >= 0 ? "+" : ""}${row.variance.toFixed(1)}</span>
          </div>
        `).join("")
        : `<p class="subtle">No queue expectations yet.</p>`;
    }

    function renderCurrentSegmentDetails() {
      const segment = getCurrentSegment();
      if (!segment) {
        els.currentSegmentDetails.textContent = "No active segment. Either your plan has a gap, or time itself is being unhelpful again.";
        return;
      }

      const queue = getQueue(segment.queueId);
      const expectedSegment = getSegmentExpectedApps(segment);
      const completionsInSegment = state.completions.filter(app => app.segmentId === segment.id);
      const completedInSegment = completionsInSegment.length;
      const throughputEfficiencyInSegment = getThroughputEfficiency(completedInSegment, expectedSegment);
      const etcProjection = buildEtcProjection(5);
      const etcHtml = etcProjection.length
        ? `<div style="margin-top: 8px;"><strong>ETC at 100% efficiency:</strong><br>${etcProjection.map(item => `App ${completedInSegment + item.index}: ${formatClock(item.etaIso)} · ${escapeHtml(getSegmentLabelForTime(item.etaIso))}`).join("<br>")}</div>`
        : `<div style="margin-top: 8px;">ETC unavailable (non-productive or outside planned segments).</div>`;
      els.currentSegmentDetails.innerHTML = `
        <strong>${escapeHtml(queue?.name || "Missing queue")}</strong><br>
        ${segment.start} to ${segment.end} · ${queue?.rate ?? 0} apps/hr · ${expectedSegment.toFixed(1)} expected in this segment<br>
        ${completedInSegment} completed while this segment was active · ${throughputEfficiencyInSegment.toFixed(0)}% throughput efficiency.
        ${etcHtml}
      `;
    }

    function renderTimer() {
      const segment = getCurrentSegment();
      if (!segment) {
        els.activeQueueName.textContent = "No active queue";
        els.timerDisplay.textContent = "--:--";
        els.timerBankDisplay.textContent = "Bank: --";
        els.timerEfficiencyDisplay.textContent = "In-day efficiency: --";
        els.timerDisplay.classList.remove("overdue");
        els.timerStatus.textContent = "No segment is active. Add one, update timings, or manually select a segment.";
        els.timerProgress.style.width = "0%";
        return;
      }

      const currentIso = nowIso();
      syncTimerToSegment(segment, currentIso);

      const queue = getQueue(segment.queueId);
      const productive = isProductiveQueue(queue);

      if (!productive) {
        els.activeQueueName.textContent = queue?.name || NON_PRODUCTIVE_NAME;
        els.timerDisplay.textContent = "No target";
        els.timerBankDisplay.textContent = `Bank: ${formatMinutes(state.timeBankSeconds)}`;
        const inDayEfficiency = getInDayEfficiency();
        els.timerEfficiencyDisplay.textContent = `In-day efficiency: ${inDayEfficiency === null ? "--" : `${inDayEfficiency.toFixed(0)}%`}`;
        els.timerDisplay.classList.remove("overdue");
        els.timerStatus.textContent = "Non-productive segment active. No app timer or expectation applies.";
        els.timerProgress.style.width = "0%";
        return;
      }

      const secondsPerApp = 3600 / Number(queue.rate);
      const baseAllowedSeconds = Math.max(1, secondsPerApp);
      const allowedSecondsWithBank = Math.max(1, baseAllowedSeconds + state.timeBankSeconds);
      const elapsed = Math.max(0, (nowDate().getTime() - new Date(state.timerStartedAt).getTime()) / 1000);
      const baseRemaining = baseAllowedSeconds - elapsed;
      const remainingWithBank = allowedSecondsWithBank - elapsed;
      const progress = Math.min(100, (elapsed / baseAllowedSeconds) * 100);

      els.activeQueueName.textContent = queue?.name || "Missing queue";
      els.timerDisplay.textContent = formatDuration(baseRemaining);
      els.timerBankDisplay.textContent = `Bank: ${formatMinutes(state.timeBankSeconds)} · with bank ${formatDuration(remainingWithBank)}`;
      const inDayEfficiency = getInDayEfficiency();
      els.timerEfficiencyDisplay.textContent = `In-day efficiency: ${inDayEfficiency === null ? "--" : `${inDayEfficiency.toFixed(0)}%`}`;
      els.timerDisplay.classList.toggle("overdue", baseRemaining < 0);
      els.timerStatus.textContent = baseRemaining >= 0
        ? `Base expectation: ${Math.round(baseAllowedSeconds / 60)} minutes per app in this queue.`
        : `Over base expectation by ${formatDuration(Math.abs(baseRemaining))}.`;
      els.timerProgress.style.width = `${progress}%`;
    }

    function renderAll() {
      renderQueueOptions();
      renderQueues();
      renderSegments();
      renderCompletionHistory();
      renderArchiveHistory();
      renderStats();
      renderDayTimeline();
      renderBreakdown();
      renderGamification();
      renderCurrentSegmentDetails();
      renderTimer();
      saveState();
    }

    function addQueue() {
      const name = els.queueName.value.trim();
      const rate = Number(els.queueRate.value);
      const color = els.queueColor.value || "#14b8a6";

      if (!name || Number.isNaN(rate) || rate < 0) return alert("Enter a queue name and a valid apps-per-hour expectation. Zero is allowed for non-productive queues.");

      state.queues.push({ id: crypto.randomUUID(), name, rate, color });
      els.queueName.value = "";
      els.queueRate.value = "";
      logActivity("settings", `Added queue ${name} at ${rate} apps/hr.`);
      renderAll();
    }

    function addSegment() {
      const queueId = els.segmentQueue.value;
      const start = els.segmentStart.value;
      const end = els.segmentEnd.value;

      if (!queueId || !start || !end) return alert("Choose a queue, start time, and end time.");
      if (minutesFromTime(end) <= minutesFromTime(start)) return alert("End time must be after start time. Time remains annoyingly linear.");

      const queue = getQueue(queueId);
      state.segments.push({ id: crypto.randomUUID(), queueId, start, end });
      sortSegments(false);
      logActivity("plan", `Added ${queue?.name || "queue"} segment from ${start} to ${end}.`);
      renderAll();
    }

    function sortSegments(shouldLog = true) {
      state.segments.sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start));
      if (shouldLog) logActivity("plan", "Sorted queue segments.");
    }

    function completeApp() {
      const queueId = els.completionQueue.value;
      const uid = els.completionUid.value.trim();
      const outcome = els.completionOutcome?.value?.trim() || "";
      const queue = getQueue(queueId);
      if (!queue || !isProductiveQueue(queue)) return alert("Choose a productive queue for the completed app.");
      if (!uid) return alert("Enter a UID for the completed app.");
      if (!outcome) return alert("Select an outcome before hitting App Complete.");

      const segment = getCurrentSegment();
      const currentIso = nowIso();
      const startedAt = state.timerStartedAt || currentIso;
      const durationSeconds = Math.max(1, (new Date(currentIso).getTime() - new Date(startedAt).getTime()) / 1000);
      const expectedSeconds = getSecondsPerApp(queue);
      const varianceSeconds = expectedSeconds - durationSeconds;
      state.timeBankSeconds += varianceSeconds;
      clampTimeBankToSegment(segment, currentIso);

      const completion = {
        id: crypto.randomUUID(),
        at: currentIso,
        queueId,
        segmentId: segment?.id || null,
        uid,
        outcome,
        durationSeconds
      };
      state.completions.push(completion);

      const efficiency = getCompletionEfficiency(completion);
      resetCurrentTimer();
      els.completionUid.value = "";
      if (els.completionOutcome) els.completionOutcome.value = "";
      logActivity("complete", `Completed app ${uid} (${outcome}) from ${queue.name} in ${formatDuration(durationSeconds)} (${efficiency.toFixed(0)}% efficiency). Bank now ${formatMinutes(state.timeBankSeconds)}.`);
      renderAll();
    }

    function exportCompletionsCsv() {
      if (!state.completions.length) return alert("No completion history to export yet.");
      const lines = ["uid,queue,outcome,completed_at,duration_minutes,expected_minutes,efficiency_percent,segment"];
      for (const app of state.completions) {
        const queue = getQueue(app.queueId);
        const expectedMinutes = getSecondsPerApp(queue) / 60;
        const segment = app.segmentId ? state.segments.find(item => item.id === app.segmentId) : null;
        const segmentLabel = segment ? `${segment.start}-${segment.end}` : "";
        const row = [
          app.uid || "",
          queue?.name || "",
          app.outcome || "",
          app.at,
          (app.durationSeconds / 60).toFixed(2),
          expectedMinutes.toFixed(2),
          getCompletionEfficiency(app).toFixed(2),
          segmentLabel
        ].map(value => `"${String(value).replaceAll('"', '""')}"`).join(",");
        lines.push(row);
      }

      const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `queue-completions-${nowIso().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      logActivity("export", `Exported CSV for ${state.completions.length} apps.`);
    }

    function saveSnapshot() {
      state.startingSnapshot = {
        at: nowIso(),
        queues: structuredClone(state.queues),
        segments: structuredClone(state.segments),
        expectedFullDay: getExpectedFullDay()
      };
      logActivity("snapshot", "Saved current plan as start-of-day snapshot.");
      renderAll();
    }

    function showReview() {
      const startExpected = state.startingSnapshot?.expectedFullDay ?? null;
      const currentExpected = getExpectedFullDay();
      const completed = state.completions.length;
      const currentVariance = completed - currentExpected;
      const snapshotTime = state.startingSnapshot ? formatClock(state.startingSnapshot.at) : "Not saved";

      const startSegmentsHtml = state.startingSnapshot?.segments?.length
        ? state.startingSnapshot.segments.map(segment => {
          const queue = state.startingSnapshot.queues.find(q => q.id === segment.queueId);
          return `<div class="mini-table-row"><strong>${escapeHtml(queue?.name || "Missing queue")}</strong><span>${segment.start} to ${segment.end}</span><span>${getSnapshotSegmentExpected(segment).toFixed(1)} apps</span></div>`;
        }).join("")
        : `<p class="subtle">No start snapshot saved.</p>`;

      const currentSegmentsHtml = state.segments.length
        ? state.segments.map(segment => {
          const queue = getQueue(segment.queueId);
          return `<div class="mini-table-row"><strong>${escapeHtml(queue?.name || "Missing queue")}</strong><span>${segment.start} to ${segment.end}</span><span>${getSegmentExpectedApps(segment).toFixed(1)} apps</span></div>`;
        }).join("")
        : `<p class="subtle">No current plan segments.</p>`;

      els.reviewContent.innerHTML = `
        <section class="stats-grid">
          <article class="stat"><div class="value">${completed}</div><div class="label">Completed today</div></article>
          <article class="stat"><div class="value">${currentExpected.toFixed(1)}</div><div class="label">Current expected total</div></article>
          <article class="stat ${currentVariance >= 0 ? "good" : "bad"}"><div class="value">${currentVariance >= 0 ? "+" : ""}${currentVariance.toFixed(1)}</div><div class="label">Final variance</div></article>
          <article class="stat"><div class="value">${startExpected === null ? "--" : startExpected.toFixed(1)}</div><div class="label">Start expected total</div></article>
        </section>
        <section class="panel"><h3>Start-of-day plan · ${snapshotTime}</h3><div class="table-like">${startSegmentsHtml}</div></section>
        <section class="panel"><h3>Current / end-of-day plan</h3><div class="table-like">${currentSegmentsHtml}</div></section>
      `;

      els.reviewDialog.showModal();
    }

    function getSnapshotSegmentExpected(segment) {
      const queue = state.startingSnapshot.queues.find(q => q.id === segment.queueId);
      if (!queue) return 0;
      return (getSegmentMinutes(segment) / 60) * Number(queue.rate || 0);
    }

    function resetDay() {
      const confirmed = confirm("Reset today’s segments, completions, logs, and snapshot? Queue settings will be kept.");
      if (!confirmed) return;
      state.archive.push({
        id: crypto.randomUUID(),
        archivedAt: nowIso(),
        label: `Archive ${new Date().toLocaleString()}`,
        queues: structuredClone(state.queues),
        segments: structuredClone(state.segments),
        completions: structuredClone(state.completions),
        activityLog: structuredClone(state.activityLog),
        startingSnapshot: structuredClone(state.startingSnapshot)
      });
      state.segments = [];
      state.completions = [];
      state.activityLog = [];
      state.startingSnapshot = null;
      state.timerStartedAt = null;
      state.selectedSegmentId = null;
      state.timerSegmentId = null;
      state.timeBankSeconds = 0;
      renderAll();
    }


    function recalculateTimeBankSeconds() {
      state.timeBankSeconds = state.completions
        .slice()
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
        .reduce((sum, app) => {
          const queue = getQueue(app.queueId);
          const nextBank = sum + (getSecondsPerApp(queue) - Number(app.durationSeconds || 0));
          const segment = app.segmentId ? state.segments.find(item => item.id === app.segmentId) : null;
          if (!segment) return nextBank;
          const remainingSegmentSeconds = getRemainingSegmentSeconds(segment, app.at);
          return Math.min(nextBank, remainingSegmentSeconds);
        }, 0);
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }

    document.addEventListener("click", event => {
      if (!els.topMenuPanel.contains(event.target) && event.target !== els.menuBtn) {
        els.topMenuPanel.classList.add("hidden");
      }
      const editQueueId = event.target.dataset.editQueue;
      const deleteQueueId = event.target.dataset.deleteQueue;
      const selectSegmentId = event.target.dataset.selectSegment;
      const editSegmentId = event.target.dataset.editSegment;
      const deleteSegmentId = event.target.dataset.deleteSegment;
      const deleteCompletionId = event.target.dataset.deleteCompletion;
      const collectQuestId = event.target.dataset.collectQuest;

      if (editQueueId) {
        const queue = getQueue(editQueueId);
        if (!queue) return;
        const name = queue.locked ? queue.name : prompt("Queue name", queue.name);
        if (!name) return;
        const rate = queue.locked ? 0 : Number(prompt("Apps per hour", queue.rate));
        if (Number.isNaN(rate) || rate < 0) return alert("Rate must be zero or a positive number.");
        const color = prompt("Queue colour hex code", queue.color || "#14b8a6") || queue.color || "#14b8a6";
        queue.name = name.trim();
        queue.rate = rate;
        queue.color = color;
        logActivity("settings", `Updated queue ${queue.name} to ${rate} apps/hr.`);
        renderAll();
      }

      if (deleteQueueId) {
        const queue = getQueue(deleteQueueId);
        if (queue?.locked) return alert("The default Non-productive queue cannot be deleted.");
        const inUse = state.segments.some(segment => segment.queueId === deleteQueueId);
        if (inUse) return alert("This queue is used in today’s plan. Delete or edit those segments first.");
        state.queues = state.queues.filter(queue => queue.id !== deleteQueueId);
        logActivity("settings", `Deleted queue ${queue?.name || "queue"}.`);
        renderAll();
      }

      if (selectSegmentId) {
        state.selectedSegmentId = selectSegmentId;
        state.timerSegmentId = null;
        state.timerStartedAt = null;
        logActivity("plan", "Manually selected active segment.");
        renderAll();
      }

      if (editSegmentId) {
        const segment = state.segments.find(item => item.id === editSegmentId);
        if (!segment) return;
        const start = prompt("Start time HH:MM", segment.start);
        const end = prompt("End time HH:MM", segment.end);
        if (!start || !end) return;
        if (minutesFromTime(end) <= minutesFromTime(start)) return alert("End time must be after start time.");
        segment.start = start;
        segment.end = end;
        sortSegments(false);
        logActivity("plan", `Updated segment to ${start}-${end}.`);
        renderAll();
      }


      if (deleteCompletionId) {
        const completion = state.completions.find(item => item.id === deleteCompletionId);
        if (!completion) return;
        state.completions = state.completions.filter(item => item.id !== deleteCompletionId);
        recalculateTimeBankSeconds();
        logActivity("complete", `Deleted completion ${completion.uid || completion.id}.`);
        renderAll();
      }
      if (collectQuestId) collectQuest(collectQuestId);
      if (deleteSegmentId) {
        state.segments = state.segments.filter(segment => segment.id !== deleteSegmentId);
        if (state.selectedSegmentId === deleteSegmentId) state.selectedSegmentId = null;
        if (state.timerSegmentId === deleteSegmentId) {
          state.timerSegmentId = null;
          state.timerStartedAt = null;
        }
        logActivity("plan", "Deleted segment from plan.");
        renderAll();
      }
    });

    els.settingsBtn.addEventListener("click", () => els.settingsDialog.showModal());
    els.menuBtn.addEventListener("click", () => els.topMenuPanel.classList.toggle("hidden"));
    els.planBtn.addEventListener("click", () => els.planDialog.showModal());
    els.archiveBtn.addEventListener("click", () => els.archiveDialog.showModal());
    els.addQueueBtn.addEventListener("click", addQueue);
    els.addSegmentBtn.addEventListener("click", addSegment);
    els.sortSegmentsBtn.addEventListener("click", () => { sortSegments(); renderAll(); });
    els.completeAppBtn.addEventListener("click", completeApp);
    els.snapshotBtn.addEventListener("click", saveSnapshot);
    els.endDayBtn.addEventListener("click", showReview);
    els.completedAppsBtn.addEventListener("click", () => els.completionDialog.showModal());
    els.insightsBtn.addEventListener("click", () => els.insightsDialog.showModal());
    els.quickInsightsBtn.addEventListener("click", () => els.insightsDialog.showModal());
    els.exportCsvBtn.addEventListener("click", exportCompletionsCsv);
    els.resetBtn.addEventListener("click", resetDay);

    setInterval(() => {
      renderTimer();
      renderStats();
      renderCurrentSegmentDetails();
      renderDayTimeline();
    }, 1000);

    els.completionUid.value = "";
    if (els.completionOutcome) els.completionOutcome.value = "";
    renderAll();
  
