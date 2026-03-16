export const nowWIB = (() => {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
})();

export const getTodayRangeWIB = () => {
  const now = new Date();

  const offset = 7 * 60 * 60 * 1000;

  // waktu sekarang dalam WIB
  const nowWIB = new Date(now.getTime() + offset);

  const startWIB = new Date(nowWIB);
  startWIB.setHours(0, 0, 0, 0);

  const endWIB = new Date(nowWIB);
  endWIB.setHours(23, 59, 59, 999);

  // convert kembali ke UTC untuk query DB
  const startUTC = new Date(startWIB.getTime() - offset);
  const endUTC = new Date(endWIB.getTime() - offset);

  return { start: startUTC, end: endUTC };
};

export const toUTCFromWIBRange = (startDate, endDate) => {
  const offset = 7 * 60 * 60 * 1000;

  let start;
  let end;

  if (startDate) {
    start = new Date(`${startDate}T00:00:00`);
  }

  if (endDate) {
    end = new Date(`${endDate}T23:59:59.999`);
  }

  return {
    gte: start ? new Date(start.getTime() - offset) : undefined,
    lte: end ? new Date(end.getTime() - offset) : undefined,
  };
};
