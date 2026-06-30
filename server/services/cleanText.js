// Extract visible page text — strip chrome/boilerplate tags
function cleanText($) {
  $("script, style, noscript, header, footer, nav, aside, iframe, svg").remove();

  const text = $("body").text();

  // Collapse whitespace and empty lines
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default cleanText;
