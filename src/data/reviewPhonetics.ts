const reviewPhonetics: Record<string, string> = {
  apple: "ˈæpəl",
  "x-ray": "ˈeks reɪ",
  six: "sɪks",
  box: "bɑːks",
  ox: "ɑːks",
  yogurt: "ˈjoʊɡərt",
  yawn: "jɔːn",
  yak: "jæk",
  yacht: "jɑːt",
  zero: "ˈzɪroʊ",
  zoo: "zuː",
  zebra: "ˈziːbrə",
  zipper: "ˈzɪpər",
  pear: "per",
  orange: "ˈɔːrɪndʒ",
  watermelon: "ˈwɔːtərˌmelən",
  pineapple: "ˈpaɪnˌæpəl",
  mango: "ˈmæŋɡoʊ",
  "dragon fruit": "ˈdræɡən fruːt",
  kiwifruit: "ˈkiːwiːfruːt",
  "smoothie": "ˈsmuːði",
  "ice cube": "ˈaɪs kjuːb",
  sugar: "ˈʃʊɡər",
  syrup: "ˈsɪrəp",
  blender: "ˈblendər",
  cup: "kʌp",
  straw: "strɔː"
};

export function getReviewPhonetic(value: string) {
  const normalizedValue = value.trim().toLocaleLowerCase().replace(/[.!?]+$/g, "");
  const phonetic = reviewPhonetics[normalizedValue];
  return phonetic ? `/${phonetic}/` : "";
}
