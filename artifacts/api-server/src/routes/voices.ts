import { Router } from "express";

const router = Router();

// Static list of Arabic Edge-TTS voices
const ARABIC_VOICES = [
  { id: "ar-EG-SalmaNeural", name: "سلمى (مصري)", language: "ar", gender: "female", locale: "ar-EG", preview: null },
  { id: "ar-EG-ShakirNeural", name: "شاكر (مصري)", language: "ar", gender: "male", locale: "ar-EG", preview: null },
  { id: "ar-SA-ZariyahNeural", name: "زارية (سعودي)", language: "ar", gender: "female", locale: "ar-SA", preview: null },
  { id: "ar-SA-HamedNeural", name: "حامد (سعودي)", language: "ar", gender: "male", locale: "ar-SA", preview: null },
  { id: "ar-AE-FatimaNeural", name: "فاطمة (إماراتي)", language: "ar", gender: "female", locale: "ar-AE", preview: null },
  { id: "ar-AE-HamdanNeural", name: "حمدان (إماراتي)", language: "ar", gender: "male", locale: "ar-AE", preview: null },
  { id: "ar-KW-FahedNeural", name: "فهد (كويتي)", language: "ar", gender: "male", locale: "ar-KW", preview: null },
  { id: "ar-KW-NouraNeural", name: "نورا (كويتي)", language: "ar", gender: "female", locale: "ar-KW", preview: null },
  { id: "ar-MA-JamalNeural", name: "جمال (مغربي)", language: "ar", gender: "male", locale: "ar-MA", preview: null },
  { id: "ar-MA-MounaNeural", name: "مونا (مغربي)", language: "ar", gender: "female", locale: "ar-MA", preview: null },
];

router.get("/voices", (_req, res) => {
  res.json(ARABIC_VOICES);
});

export default router;
