export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce(f, interval) {
  let timer = null;

  return (...args) => {
    clearTimeout(timer);

    return new Promise(resolve =>
      timer = setTimeout(
        () => resolve(f(...args)),
        interval,
      )
    );
  };
}