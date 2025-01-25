const getCleanedContent = (el: HTMLElement) =>
  el.textContent.replace(/\s+/g, " ").trim();

export default getCleanedContent;
