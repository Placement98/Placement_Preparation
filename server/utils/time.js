const TIME_ZONE = 'Asia/Kolkata';

function getDateKeyInTimeZone(date = new Date(), timeZone = TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

function getTimeZoneOffset(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return (asUtc - date.getTime()) / 60000;
}

function makeZonedDate(dateKey, timeString, timeZone = TIME_ZONE) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);

  const utcCandidate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offsetMinutes = getTimeZoneOffset(utcCandidate, timeZone);
  return new Date(utcCandidate.getTime() - offsetMinutes * 60000);
}

function shiftDateKey(dateKey, days, timeZone = TIME_ZONE) {
  const anchor = makeZonedDate(dateKey, '12:00', timeZone);
  const shifted = new Date(anchor.getTime() + days * 24 * 60 * 60 * 1000);
  return getDateKeyInTimeZone(shifted, timeZone);
}

module.exports = {
  TIME_ZONE,
  getDateKeyInTimeZone,
  makeZonedDate,
  shiftDateKey,
};
