export const nowWIB = (() => {
  const now = new Date();
  const offset = 7 * 60 * 60 * 1000;
  return new Date(now.getTime() + offset);
})();

// export const getTodayRangeWIB = () => {
//   const now = new Date();

//   const start = new Date(now);
//   start.setHours(0, 0, 0, 0);

//   const end = new Date(now);
//   end.setHours(23, 59, 59, 999);

//   return { start, end };
// };

export const getTodayRangeWIB = () => {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = formatter.format(now).split("-");

  const start = new Date(`${year}-${month}-${day}T00:00:00+07:00`);
  const end = new Date(`${year}-${month}-${day}T23:59:59.999+07:00`);

  return {
    start,
    end,
    tanggalWIB: start,
  };
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
