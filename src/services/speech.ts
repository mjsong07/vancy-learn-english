interface SpeakOptions {
  lang?: string;
  pitch?: number;
  rate?: number;
}

export function speak(text: string, options: SpeakOptions = {}) {
  if (!("speechSynthesis" in window)) return;
  if (!text.trim()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || "en-US";
  utterance.pitch = options.pitch || 1.08;
  utterance.rate = options.rate || 0.78;
  window.speechSynthesis.speak(utterance);
}
