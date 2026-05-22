(function () {
  function minutesFromTime(time) {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  }

  function nowDate() {
    return new Date();
  }

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

  function formatClock(iso) {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function getSegmentBoundaryIso(timeText, atIso = nowIso()) {
    const boundary = new Date(atIso);
    const [hours, minutes] = timeText.split(":").map(Number);
    boundary.setHours(hours, minutes, 0, 0);
    return boundary.toISOString();
  }

  function getRemainingSegmentSeconds(segmentEndTime, atIso = nowIso()) {
    const segmentEnd = new Date(atIso);
    const [endHours, endMinutes] = segmentEndTime.split(":").map(Number);
    segmentEnd.setHours(endHours, endMinutes, 0, 0);
    return Math.max(0, (segmentEnd.getTime() - new Date(atIso).getTime()) / 1000);
  }

  window.TimeUtils = {
    minutesFromTime,
    nowDate,
    nowIso,
    nowMinutes,
    formatDuration,
    formatMinutes,
    formatHoursMinutes,
    formatClock,
    getSegmentBoundaryIso,
    getRemainingSegmentSeconds
  };
})();
